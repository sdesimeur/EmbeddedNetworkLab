using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Threading;

namespace EmbeddedNetworkLab.UI.Modules.TestingModuleUi
{
	partial class TestingModuleUiViewModel : ModuleViewModel
	{

		public override string Name => "Testing Module";

		public ObservableCollection<double> Values { get; } = new();

		public ISeries[] Series { get; }

		private readonly DispatcherTimer _timer;
		private double _t;

		public TestingModuleUiViewModel()
		{
			// Seed a few points so you immediately see something
			for (int i = 0; i < 50; i++)
				Values.Add(0);

			Series =
			[
				new LineSeries<double>
				{
					Values = Values,
					Fill = null,
					GeometrySize = 0,
					LineSmoothness = 0
				}
			];

			_timer = new DispatcherTimer
			{
				Interval = TimeSpan.FromMilliseconds(100) // 10 Hz
			};
			_timer.Tick += (_, __) => AddNextSample();
			_timer.Start();
		}

		private void AddNextSample()
		{
			const int maxPoints = 200;

			// Simple fake bandwidth-like signal:
			// base + sine + a bit of noise
			double noise = (Random.Shared.NextDouble() - 0.5) * 2.0; // [-1..+1]
			double value = 50.0 + 20.0 * Math.Sin(_t) + 5.0 * Math.Sin(_t * 0.2) + noise;

			Values.Add(value);

			if (Values.Count > maxPoints)
				Values.RemoveAt(0);

			_t += 0.15;
		}
	}
}
