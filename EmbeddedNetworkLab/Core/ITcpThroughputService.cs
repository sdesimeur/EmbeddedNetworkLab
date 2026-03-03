

namespace EmbeddedNetworkLab.Core
{
	public interface ITcpThroughputService
	{
		event Action<double>? RateUpdated;
		void Configure(string address, int port);

		void Start();
		void Stop();
	}
}
