using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EmbeddedNetworkLab.Modules
{
	public interface IModule
	{
		string Name { get; }

		/// <summary>
		/// Current running state of the module. Implementations should expose this
		/// so the UI can reflect the module's state (e.g. green/gray indicator).
		/// </summary>
		bool IsRunning { get; }

		/// <summary>
		/// Raised whenever the running state changes. The handler receives the new state.
		/// </summary>
		event Action<bool>? RunningStateChanged;
	}
}
