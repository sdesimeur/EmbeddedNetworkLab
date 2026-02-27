using CommunityToolkit.Mvvm.ComponentModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EmbeddedNetworkLab.UI.Modules.TcpServer
{
    partial class TcpServerViewModel : ModuleViewModel
	{
        public override string Name => "TCP Server";

		[ObservableProperty]
		private string? hostAddress = "127.0.0.1";

		[ObservableProperty]
		private int hostPort = 8080;

		// Text backing for the port input so we can validate parsing
		[ObservableProperty]
		private string? hostPortText = "8080";

		public bool IsConfigurationEditable => !IsRunning;

		public bool IsToggleEnabled => IsRunning || IsPortValid();

		private bool IsPortValid()
		{
			if (string.IsNullOrWhiteSpace(HostPortText))
				return false;
			if (!int.TryParse(HostPortText, out var port))
				return false;
			return port >= 1 && port <= 65535;
		}
	}


}
