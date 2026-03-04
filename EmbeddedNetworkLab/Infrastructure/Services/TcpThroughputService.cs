using EmbeddedNetworkLab.Core;
using System.Diagnostics;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

public sealed class TcpThroughputService : ITcpThroughputService
{
	public event Action<double>? RateUpdated;

	private readonly object _sync = new();

	private CancellationTokenSource? _cts;
	private Task? _task;
	private TcpThroughputConfig? _config;

	public void Configure(TcpThroughputConfig config)
	{
		lock (_sync)
		{
			_config = config;
		}
	}

	public void Start()
	{
		lock (_sync)
		{
			if (_task != null)
				return;

			_cts = new CancellationTokenSource();
			_task = Task.Run(() => RunAsync(_cts.Token));
		}
	}

	public void Stop()
	{
		Task? taskToWait;
		CancellationTokenSource? ctsToDispose;

		lock (_sync)
		{
			if (_task == null)
				return;

			taskToWait = _task;
			ctsToDispose = _cts;

			_task = null;
			_cts = null;
		}

		ctsToDispose?.Cancel();

		// Do not block the caller (UI) waiting for the background task.
		// Dispose the CTS once the background task completes.
		if (taskToWait != null)
		{
			_ = taskToWait.ContinueWith(t =>
			{
				try
				{
					// Swallow exceptions from the background task; ensure observers see 0 rate.
					RateUpdated?.Invoke(0);
				}
				finally
				{
					try { ctsToDispose?.Dispose(); } catch { }
				}
			}, TaskScheduler.Default);
		}
	}

	private async Task RunAsync(CancellationToken token)
	{
		try
		{
			TcpThroughputConfig? config;
			lock (_sync)
			{
				config = _config;
			}

			if (config is null || string.IsNullOrEmpty(config.Address))
			{
				RateUpdated?.Invoke(0);
				return;
			}

			using var client = new TcpClient();
			client.NoDelay = true;

			await client.ConnectAsync(host: config.Address, port: config.Port, cancellationToken: token);

			using NetworkStream stream = client.GetStream();

			// 🔵 Tell STM32: Throughput mode
			await stream.WriteAsync(new byte[] { 0x02 }, token);

			byte[] buffer = new byte[4096];
			new Random().NextBytes(buffer);

			var sw = Stopwatch.StartNew();

			long bytesSent = 0;
			long lastBytes = 0;
			long lastTime = 0;

			while (!token.IsCancellationRequested)
			{
				await stream.WriteAsync(buffer, token);
				bytesSent += buffer.Length;

				long currentTime = sw.ElapsedMilliseconds;

				if (currentTime - lastTime >= config.SamplePeriod.TotalMilliseconds)
				{
					long deltaBytes = bytesSent - lastBytes;
					double seconds = (currentTime - lastTime) / 1000.0;

					double bytesPerSecond = deltaBytes / seconds;

					RateUpdated?.Invoke(bytesPerSecond * 8 / 1_000_000); // Mbps

					lastBytes = bytesSent;
					lastTime = currentTime;
				}
			}
		}
		catch
		{
			RateUpdated?.Invoke(0);
		}
	}
}
