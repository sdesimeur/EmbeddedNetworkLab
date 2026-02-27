using System;
using System;
using System.Linq;
using System.IO.Ports;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Globalization;

namespace EmbeddedNetworkLab.UI.Windows
{
	/// <summary>
	/// Interaction logic for SerialCommandsWindow.xaml
	/// </summary>
	public partial class SerialCommandsWindow : Window
	{
		private SerialPort? _serialPort;

		public SerialCommandsWindow()
		{
			InitializeComponent();
			LoadSerialPorts();

			// Ensure per-row Send buttons initial state
			SetRowSendEnabled(false);
		}

		private void LoadSerialPorts()
		{
			try
			{
				var ports = SerialPort.GetPortNames()
					.OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
					.ToArray();

				PortComboBox.ItemsSource = ports;

				if (ports.Length > 0)
				{
					PortComboBox.SelectedIndex = 0;
					SetStatus("Ready", Brushes.Green);
				}
				else
				{
					SetStatus("No COM ports found", Brushes.Red);
				}
			}
			catch (Exception)
			{
				SetStatus("Error listing COM ports", Brushes.Red);
			}
		}

		private void RefreshPortsButton_Click(object sender, RoutedEventArgs e)
		{
			LoadSerialPorts();
		}

		private void ConnectButton_Click(object sender, RoutedEventArgs e)
		{
			if (_serialPort is null || !_serialPort.IsOpen)
			{
				OpenPort();
			}
			else
			{
				ClosePort();
			}
		}

		private void OpenPort()
		{
			var portName = PortComboBox.SelectedItem as string;
			if (string.IsNullOrWhiteSpace(portName))
			{
				SetStatus("No port selected", Brushes.Red);
				return;
			}

			// Attempt to parse the selected baudrate; fall back to 115200
			int baud = 115200;
			if (BaudrateComboBox.SelectedItem is ComboBoxItem cbi)
			{
				int.TryParse(cbi.Content?.ToString() ?? string.Empty, out baud);
			}
			else if (BaudrateComboBox.SelectedItem is string s)
			{
				int.TryParse(s, out baud);
			}

			try
			{
				_serialPort = new SerialPort(portName, baud)
				{
					NewLine = "\r\n",
					ReadTimeout = 500,
					WriteTimeout = 500
				};
				_serialPort.DataReceived += SerialPort_DataReceived;
				_serialPort.Open();

				ConnectButton.Content = "Close";
				SetStatus($"Opened {portName} @ {baud}", Brushes.Green);

				// Disable selectors while open
				PortComboBox.IsEnabled = false;
				BaudrateComboBox.IsEnabled = false;
				SetRowSendEnabled(true);
			}
			catch (Exception ex)
			{
				SetStatus($"Open failed: {ex.Message}", Brushes.Red);
				_serialPort?.Dispose();
				_serialPort = null;
			}
		}

		private void ClosePort()
		{
			try
			{
				if (_serialPort != null)
				{
					_serialPort.DataReceived -= SerialPort_DataReceived;

					if (_serialPort.IsOpen)
					{
						_serialPort.Close();
					}

					_serialPort.Dispose();
					_serialPort = null;
				}

				ConnectButton.Content = "Open";
				SetStatus("Disconnected", Brushes.Red);

				// Re-enable selectors
				PortComboBox.IsEnabled = true;
				BaudrateComboBox.IsEnabled = true;
				SetRowSendEnabled(false);
			}
			catch (Exception ex)
			{
				SetStatus($"Close failed: {ex.Message}", Brushes.Red);
			}
		}

		private void SerialPort_DataReceived(object? sender, SerialDataReceivedEventArgs e)
		{
			try
			{
				if (sender is SerialPort sp)
				{
					var data = sp.ReadExisting();
					if (!string.IsNullOrEmpty(data))
					{
						Dispatcher.BeginInvoke(() =>
						{
							ReceptionTextBox.AppendText(data);
							ReceptionTextBox.ScrollToEnd();
						});
					}
				}
			}
			catch
			{
				// ignore read errors for now
			}
		}



		/// <summary>
		/// Handler for individual row Send buttons. Tag must contain the row index (1..10).
		/// ValueTextBox{n} content is parsed as hex and sent raw.
		/// </summary>
		private void SendRowButton_Click(object? sender, RoutedEventArgs e)
		{
			if (_serialPort is null || !_serialPort.IsOpen)
			{
				SetStatus("Port not open", Brushes.Red);
				return;
			}

			if (sender is not Button btn || btn.Tag is null)
			{
				SetStatus("Invalid send button", Brushes.Red);
				return;
			}

			var idx = btn.Tag.ToString();
			if (string.IsNullOrEmpty(idx))
			{
				SetStatus("Invalid button tag", Brushes.Red);
				return;
			}

			var valueBox = FindName($"ValueTextBox{idx}") as TextBox;
			if (valueBox == null)
			{
				SetStatus("Value box not found", Brushes.Red);
				return;
			}

			var input = valueBox.Text ?? string.Empty;
			if (string.IsNullOrWhiteSpace(input))
			{
				SetStatus("Empty command", Brushes.Red);
				return;
			}

			var bytes = ParseHexStringToBytes(input);
			if (bytes is null || bytes.Length == 0)
			{
				SetStatus("Invalid hex input", Brushes.Red);
				return;
			}

			try
			{
				_serialPort.Write(bytes, 0, bytes.Length);
				ReceptionTextBox.AppendText($"[Sent {DateTime.Now:HH:mm:ss}] {BitConverter.ToString(bytes)}\n");
				ReceptionTextBox.ScrollToEnd();
				SetStatus($"Sent {bytes.Length} bytes", Brushes.Green);
			}
			catch (Exception ex)
			{
				SetStatus($"Send failed: {ex.Message}", Brushes.Red);
			}
		}

		/// <summary>
		/// Parses many common hex string formats to a byte array.
		/// Returns null on parse error.
		/// </summary>
		private static byte[]? ParseHexStringToBytes(string input)
		{
			// Normalize common separators
			var cleaned = input.Trim();

			// If contains commas or spaces or hyphens or semicolons, split tokens
			if (cleaned.IndexOfAny(new[] { ' ', ',', ';', '-' }) >= 0)
			{
				var tokens = cleaned
					.Split(new[] { ' ', ',', ';', '-' }, StringSplitOptions.RemoveEmptyEntries)
					.Select(t => t.Trim())
					.ToArray();

				var bytes = new byte[tokens.Length];
				for (int i = 0; i < tokens.Length; i++)
				{
					var tok = tokens[i];
					if (tok.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
						tok = tok.Substring(2);

					if (tok.Length == 0 || tok.Length > 2)
						return null;

					if (!byte.TryParse(tok, System.Globalization.NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var b))
						return null;

					bytes[i] = b;
				}

				return bytes;
			}

			// Otherwise assume contiguous hex string like "0A1BFF"
			// Remove optional 0x prefixes if present
			if (cleaned.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
				cleaned = cleaned.Substring(2);

			// Must have even length
			if ((cleaned.Length & 1) != 0)
				return null;

			var outBytes = new byte[cleaned.Length / 2];
			for (int i = 0; i < outBytes.Length; i++)
			{
				var pair = cleaned.Substring(i * 2, 2);
				if (!byte.TryParse(pair, System.Globalization.NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var b))
					return null;
				outBytes[i] = b;
			}

			return outBytes;
		}

		private void SetStatus(string text, Brush color)
		{
			ConnectionStatusText.Text = text;
			ConnectionStatusText.Foreground = color;
		}

		private void SetRowSendEnabled(bool enabled)
		{
			for (int i = 1; i <= 10; i++)
			{
				var btn = FindName($"SendRowButton{i}") as Button;
				if (btn != null)
					btn.IsEnabled = enabled;
			}
		}

		protected override void OnClosed(EventArgs e)
		{
			base.OnClosed(e);
			try
			{
				if (_serialPort != null)
				{
					if (_serialPort.IsOpen)
					{
						_serialPort.Close();
					}
					_serialPort.Dispose();
					_serialPort = null;
				}
			}
			catch
			{
				// ignore cleanup errors
			}
		}
	}
}
