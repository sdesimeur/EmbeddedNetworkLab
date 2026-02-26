using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EmbeddedNetworkLab.Modules;
using System.Windows;
using System.Collections.ObjectModel;
using System.IO.Ports;
using System.Linq;

namespace EmbeddedNetworkLab.UI.Modules.SimulatorCentrale
{
	public partial class SimulatorCentraleViewModel : ModuleViewModel
	{
		public override string Name => "Central Simulator";

		[ObservableProperty]
		private string? statusText = "Ready";

		// Collections exposed for binding
		public ObservableCollection<string> SerialPorts { get; } = new();
		public ObservableCollection<int> BaudRates { get; } = new();

		[ObservableProperty]
		private string? selectedPort;

		[ObservableProperty]
		private int selectedBaud = 460800;

		// Indicates the real state of the serial port
		[ObservableProperty]
		private bool isPortOpen;

		// Convenience property to enable/disable configuration in the UI
		public bool IsConfigurationEditable => !IsPortOpen;

		private SerialPort? _serialPort;

		public SimulatorCentraleViewModel()
		{
			// Populate common baud rates
			var commonBauds = new[]
			{
				110, 300, 600, 1200, 2400, 4800, 9600,
				14400, 19200, 38400, 57600, 115200,
				230400, 460800, 921600
			};

			foreach (var b in commonBauds)
				BaudRates.Add(b);

			SelectedBaud = 460800;

			RefreshSerialPorts();
		}

		public void RefreshSerialPorts()
		{
			var previous = SelectedPort;

			SerialPorts.Clear();

			var ports = SerialPort.GetPortNames()
								  .OrderBy(p => p);

			foreach (var p in ports)
				SerialPorts.Add(p);

			if (!string.IsNullOrWhiteSpace(previous) && SerialPorts.Contains(previous))
				SelectedPort = previous;
			else
				SelectedPort = SerialPorts.FirstOrDefault();
		}

		[RelayCommand(CanExecute = nameof(CanOpen))]
		private void Open()
		{
			// Open the serial port first
			if (string.IsNullOrWhiteSpace(SelectedPort))
			{
				StatusText = "Select a serial port before opening.";
				return;
			}

			try
			{
				_serialPort = new SerialPort(SelectedPort!, SelectedBaud)
				{
					ReadTimeout = 1000,
					WriteTimeout = 1000
				};

				_serialPort.DataReceived += SerialPort_DataReceived;
				_serialPort.Open();
				IsPortOpen = true;
			}
			catch (Exception ex)
			{
				StatusText = $"Failed to open port {SelectedPort}: {ex.Message}";
				if (_serialPort != null)
				{
					try { _serialPort.DataReceived -= SerialPort_DataReceived; } catch { }
					try { _serialPort.Dispose(); } catch { }
				}
				_serialPort = null;
				IsPortOpen = false;
				return;
			}

			// Then start the module logic
			if (!TryStart())
				return;

			StatusText = $"Running on {SelectedPort} @ {SelectedBaud}";
		}

		private bool CanOpen()
		{
			// Allow open only if a port is selected and not already open or running
			if (IsRunning)
				return false;

			return !string.IsNullOrWhiteSpace(SelectedPort) && !IsPortOpen;
		}

		[RelayCommand(CanExecute = nameof(CanClose))]
		private void Close()
		{
			// Stop module logic
			StopExecution();

			// Close the serial port cleanly if open
			CloseSerialPort();

			StatusText = "Closed";
		}

		private bool CanClose()
		{
			// Close is allowed if the module is running or if the port is open
			return IsRunning || IsPortOpen;
		}

		private void CloseSerialPort()
		{
			if (_serialPort == null)
			{
				IsPortOpen = false;
				return;
			}

			try
			{
				if (_serialPort.IsOpen)
					_serialPort.Close();
			}
			catch
			{
				// ignore
			}
			finally
			{
				try { _serialPort.DataReceived -= SerialPort_DataReceived; } catch { }
				try { _serialPort.Dispose(); } catch { }
				_serialPort = null;
				IsPortOpen = false;
			}
		}

		// Incoming data handler: simple example that feeds StatusText (UI thread)
		private void SerialPort_DataReceived(object? sender, SerialDataReceivedEventArgs e)
		{
			try
			{
				if (sender is not SerialPort sp)
					return;

				var incoming = sp.ReadExisting();
				if (string.IsNullOrEmpty(incoming))
					return;

				Application.Current?.Dispatcher.BeginInvoke(new Action(() =>
				{
					StatusText = incoming.Length > 200 ? incoming[..200] + "…" : incoming;
				}));
			}
			catch (Exception ex)
			{
				Application.Current?.Dispatcher.BeginInvoke(new Action(() =>
				{
					StatusText = $"[ERROR reading serial port: {ex.Message}]";
				}));
			}
		}

		// Invoked automatically by the source generator when IsPortOpen changes
		partial void OnIsPortOpenChanged(bool value)
		{
			// Update commands and UI
			OpenCommand.NotifyCanExecuteChanged();
			CloseCommand.NotifyCanExecuteChanged();
			OnPropertyChanged(nameof(IsConfigurationEditable));
		}

		protected override void OnRunningStateChanged(bool isRunning)
		{
			// Update command availability when running state changes
			OpenCommand.NotifyCanExecuteChanged();
			CloseCommand.NotifyCanExecuteChanged();
			OnPropertyChanged(nameof(StatusText));
			// Ensure the port is closed when stopping the module
			if (!isRunning)
				CloseSerialPort();
		}
	}
}