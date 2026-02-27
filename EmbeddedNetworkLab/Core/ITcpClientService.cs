

namespace EmbeddedNetworkLab.Core
{
	public interface ITcpClientService
	{
		event Action<double>? RateUpdated;

		void Start();
		void Stop();
	}
}
