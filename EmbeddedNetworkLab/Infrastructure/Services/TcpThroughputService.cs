using EmbeddedNetworkLab.Core;
using System.Diagnostics;
using System.Net.Sockets;

public sealed class TcpThroughputService : ITcpThroughputService
{
	public event Action<double>? RateUpdated;

	private readonly object _sync = new();

	private CancellationTokenSource? _cts;
	private Task? _task;

	private string _address = "127.0.0.1";
	private int _port = 8080;

	public void Configure(string address, int port)
	{
		lock (_sync)
		{
			_address = address;
			_port = port;
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
			taskToWait = _task;
			ctsToDispose = _cts;

			_task = null;
			_cts = null;
		}

		try
		{
			ctsToDispose?.Cancel();
		}
		finally
		{
			ctsToDispose?.Dispose();
		}

		// Optional: wait a short time so the socket closes cleanly
		try
		{
			taskToWait?.Wait(500);
		}
		catch
		{
			// Ignore
		}

		RateUpdated?.Invoke(0);
	}

	private async Task RunAsync(CancellationToken token)
	{
		string address;
		int port;

		lock (_sync)
		{
			address = _address;
			port = _port;
		}

		try
		{
			using var client = new TcpClient();
			client.NoDelay = true;

			await client.ConnectAsync(address, port, token);

			using NetworkStream stream = client.GetStream();

			byte[] buffer = new byte[4096];
			Random.Shared.NextBytes(buffer);

			var sw = Stopwatch.StartNew();
			long bytesSent = 0;
			long lastBytes = 0;
			long lastTimeMs = 0;

			while (!token.IsCancellationRequested)
			{
				await stream.WriteAsync(buffer, token);
				bytesSent += buffer.Length;

				long nowMs = sw.ElapsedMilliseconds;

				if (nowMs - lastTimeMs >= 500)
				{
					long deltaBytes = bytesSent - lastBytes;
					double seconds = (nowMs - lastTimeMs) / 1000.0;

					double bytesPerSecond = deltaBytes / seconds;
					double mbps = (bytesPerSecond * 8.0) / 1_000_000.0;

					RateUpdated?.Invoke(mbps);

					lastBytes = bytesSent;
					lastTimeMs = nowMs;
				}
			}
		}
		catch
		{
			RateUpdated?.Invoke(0);
		}
	}
}