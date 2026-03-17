import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale);

const MAX_POINTS = 120;

@Component({
  selector: 'app-tcp-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tcp-client.component.html',
  styleUrl: './tcp-client.component.scss',
})
export class TcpClientComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvasRef!: ElementRef<HTMLCanvasElement>;

  targetAddress = '192.168.1.110';
  targetPort = '8080';
  isRunning = false;
  isReaching = false;
  reachedStatus = '';
  currentRate = 0;
  errorMsg = '';

  private chart: Chart | null = null;
  private throughputData: number[] = Array(MAX_POINTS).fill(0);
  private subs: Subscription[] = [];

  constructor(private api: ApiService, private socket: SocketService) {}

  ngOnInit() {
    this.subs.push(
      this.socket.on<number>('tcp:rate').subscribe(rate => {
        this.currentRate = +rate.toFixed(2);
        this.throughputData.push(rate);
        if (this.throughputData.length > MAX_POINTS) this.throughputData.shift();
        this.updateChart();
      }),
    );
  }

  ngAfterViewInit() {
    this.chart = new Chart(this.chartCanvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: Array(MAX_POINTS).fill(''),
        datasets: [{
          data: [...this.throughputData],
          borderColor: '#89b4fa',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0,
          fill: false,
        }],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: {
            min: 0,
            ticks: { color: '#a6adc8', font: { size: 11 } },
            grid: { color: '#313244' },
            title: { display: true, text: 'Mbps', color: '#89b4fa', font: { size: 11 } },
          },
        },
      },
    });
  }

  private updateChart() {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [...this.throughputData];
    this.chart.update('none');
  }

  async reach() {
    const port = parseInt(this.targetPort, 10);
    if (!this.targetAddress || isNaN(port)) return;
    this.isReaching = true;
    this.reachedStatus = 'Reaching...';
    try {
      const res = await this.api.reachServer({ address: this.targetAddress, port });
      this.reachedStatus = res.ok ? '✓ OK' : '✗ FAIL';
    } catch {
      this.reachedStatus = '✗ FAIL';
    } finally {
      this.isReaching = false;
    }
  }

  async startThroughput() {
    const port = parseInt(this.targetPort, 10);
    if (!this.targetAddress || isNaN(port)) return;
    try {
      await this.api.startThroughput({ address: this.targetAddress, port });
      this.isRunning = true;
    } catch (e: any) {
      this.errorMsg = e?.error?.error ?? 'Failed to start';
    }
  }

  async stopThroughput() {
    await this.api.stopThroughput();
    this.isRunning = false;
    this.currentRate = 0;
  }

  get isInputValid() {
    const port = parseInt(this.targetPort, 10);
    return !!this.targetAddress && !isNaN(port) && port >= 1 && port <= 65535;
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.chart?.destroy();
  }
}
