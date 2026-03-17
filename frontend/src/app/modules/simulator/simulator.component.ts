import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

interface CommandItem { name: string; text: string; }

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simulator.component.html',
  styleUrl: './simulator.component.scss',
})
export class SimulatorComponent implements OnInit, OnDestroy {
  ports: string[] = [];
  baudRates: number[] = [];
  selectedPort = '';
  selectedBaud = 460800;
  isOpen = false;
  statusText = '';
  commands: CommandItem[] = [];
  log: string[] = [];
  errorMsg = '';

  private subs: Subscription[] = [];
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private api: ApiService, private socket: SocketService) {}

  async ngOnInit() {
    await this.refreshPorts();
    this.baudRates = await this.api.getBaudRates();
    const status = await this.api.getSerialStatus();
    this.isOpen = status.isOpen;
    if (status.portName) this.selectedPort = status.portName;

    const saved = await this.api.getSimulatorCommands();
    this.commands = saved.length
      ? saved
      : Array.from({ length: 10 }, (_, i) => ({ name: `Cmd ${i + 1}`, text: '' }));

    this.subs.push(
      this.socket.on<string>('serial:log').subscribe(msg => {
        const ts = new Date().toLocaleTimeString();
        this.log.push(`[${ts}] ${msg.trim()}`);
        if (this.log.length > 500) this.log.shift();
        if (msg.length < 300) this.statusText = msg.trim();
      }),
    );

    // Poll ports every 2s
    const interval = setInterval(() => this.refreshPorts(), 2000);
    this.subs.push(new Subscription(() => clearInterval(interval)));
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
    } catch (e: any) {
      this.errorMsg = e?.error?.error ?? 'Failed to close';
    }
  }

  async send(cmd: CommandItem) {
    if (!cmd.text.trim() || !this.isOpen) return;
    try {
      await this.api.sendSerial(cmd.text);
    } catch (e: any) {
      this.log.push(`[ERROR] ${e?.error?.error ?? 'Send failed'}`);
    }
  }

  onCommandChanged() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveCommands(), 1000);
  }

  async saveCommands() {
    try {
      await this.api.saveSimulatorCommands(this.commands);
    } catch {}
  }

  clearLog() { this.log = []; }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }
}
