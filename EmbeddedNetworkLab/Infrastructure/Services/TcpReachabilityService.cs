using EmbeddedNetworkLab.Core;
using System;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

namespace EmbeddedNetworkLab.Infrastructure.Services
{
	public class TcpReachabilityService : ITcpReachabilityService
	{
		public async Task<bool> TryConnectAsync(string address, int port, TimeSpan timeout, CancellationToken ct)
		{
			using var client = new TcpClient();

			using var timeoutCts = new CancellationTokenSource(timeout);
			using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

			try
			{
				await client.ConnectAsync(address, port, linkedCts.Token);
				return true;
			}
			catch
			{
				return false;
			}
		}
	}
}
