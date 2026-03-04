using System;
using System.Threading;
using System.Threading.Tasks;

namespace EmbeddedNetworkLab.Core
{
	public interface ITcpReachabilityService
	{
		Task<bool> TryConnectAsync(string address, int port, TimeSpan timeout, CancellationToken ct);
	}
}
