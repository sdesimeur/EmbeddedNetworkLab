

using EmbeddedNetworkLab.Core;

namespace EmbeddedNetworkLab.Infrastructure.Services
{
	public class TcpThroughputServiceMock : ITcpThroughputService
	{
		public event Action<double>? RateUpdated;

		private TcpThroughputConfig? _config;

		private bool _running;

		public void Configure(TcpThroughputConfig config)
		{
			_config = config;	
		}

		public void Start()
		{
			_running = true;

			Task.Run(async () =>
			{
				var rnd = new Random();

				while (_running)
				{
					if (_config is null)
						break;

					await Task.Delay(_config.SamplePeriod);
					RateUpdated?.Invoke(rnd.NextDouble() * 100);
				}
			});
		}

		public void Stop()
		{
			_running = false;
		}
	}
}

