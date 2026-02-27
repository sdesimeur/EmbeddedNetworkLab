using System;
using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace EmbeddedNetworkLab.UI.Converters
{
	public class BoolToBrushConverter : IValueConverter
	{
		public Brush TrueBrush { get; set; } = Brushes.Green;
		public Brush FalseBrush { get; set; } = new SolidColorBrush(Color.FromRgb(0x33, 0x33, 0x33));

		public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
		{
			if (value is bool b && b)
				return TrueBrush;
			return FalseBrush;
		}

		public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
		{
			throw new NotImplementedException();
		}
	}
}