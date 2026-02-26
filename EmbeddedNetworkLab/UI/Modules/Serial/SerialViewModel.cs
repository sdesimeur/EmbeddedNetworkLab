using CommunityToolkit.Mvvm.ComponentModel;

namespace EmbeddedNetworkLab.UI.Modules.Serial
{
	public partial class SerialViewModel : ObservableObject
	{
		[ObservableProperty]
		private string title = "Serial";

		[ObservableProperty]
		private string serialText = string.Empty;
	}
}