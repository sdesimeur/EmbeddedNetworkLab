

namespace EmbeddedNetworkLab.Core
{
	public sealed record TcpThroughputConfig(
		string Address,
		int Port,
		TimeSpan SamplePeriod);

	public interface ITcpThroughputService
	{
		event Action<double>? RateUpdated;
		void Configure(TcpThroughputConfig config);

		void Start();
		void Stop();
	}
}
