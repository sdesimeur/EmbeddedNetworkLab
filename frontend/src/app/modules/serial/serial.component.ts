import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-serial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './serial.component.html',
  styleUrl: './serial.component.scss',
})
export class SerialComponent implements OnInit, OnDestroy {
  ports: string[] = [];
  baudRates: number[] = [];
  selectedPort = '';
  selectedBaud = 460800;
  isOpen = false;
  terminalText = '';
  errorMsg = '';

  private subs: Subscription[] = [];

  constructor(private api: ApiService, private socket: SocketService) {}

  async ngOnInit() {
    await this.refreshPorts();
    this.baudRates = await this.api.getBaudRates();
    const status = await this.api.getSerialStatus();
    this.isOpen = status.isOpen;
    if (status.portName) this.selectedPort = status.portName;
    if (status.baudRate) this.selectedBaud = status.baudRate;

    this.subs.push(
      this.socket.on<string>('serial:data').subscribe(data => {
        this.terminalText += data;
        // Keep last ~5000 chars
        if (this.terminalText.length > 5000) {
          this.terminalText = this.terminalText.slice(-5000);
        }
      }),
    );
  }

  async refreshPorts() {
    this.ports = await this.api.listPorts();
    if (this.ports.length && !this.ports.includes(this.selectedPort)) {
      this.selectedPort = this.ports[0];
    }
  }

  async open() {
    this.errorMsg = '';
    try {
      await this.api.openSerial({ portName: this.selectedPort, baudRate: this.selectedBaud });
      this.isOpen = true;
    } catch (e: any) {
      this.errorMsg = e?.error?.error ?? 'Failed to open';
    }
  }

  async close() {
    try {
      await this.api.closeSerial();
      this.isOpen = false;
      this.terminalText = '';
    } catch (e: any) {
      this.errorMsg = e?.error?.error ?? 'Failed to close';
    }
  }

  async onBaudChange() {
    if (this.isOpen) {
      await this.api.setSerialBaudRate(this.selectedBaud);
    }
  }

  clearTerminal() { this.terminalText = ''; }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
