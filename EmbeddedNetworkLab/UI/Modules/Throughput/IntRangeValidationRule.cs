using System.Globalization;
using System.Windows.Controls;

namespace EmbeddedNetworkLab.UI.Modules.Throughput
{
	public class IntRangeValidationRule : ValidationRule
	{
		public int Min { get; set; } = 1;
		public int Max { get; set; } = 65535;

		public override ValidationResult Validate(object value, CultureInfo cultureInfo)
		{
			var input = value as string;
			if (string.IsNullOrWhiteSpace(input))
				return new ValidationResult(false, "Port requis.");

			if (!int.TryParse(input, out var port))
				return new ValidationResult(false, "Doit être un nombre entier.");

			if (port < Min || port > Max)
				return new ValidationResult(false, $"Le port doit être entre {Min} et {Max}.");

			return ValidationResult.ValidResult;
		}
	}
}
