import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-mqtt-broker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mqtt-broker.component.html',
  styleUrl: './mqtt-broker.component.scss',
})
export class MqttBrokerComponent implements OnInit, OnDestroy {
  isRunning = false;
  port = 1883;
  bindIp = '0.0.0.0';
  username = '';
  password = '';
  useAuth = false;
  listeningAddresses: string[] = [];
  messages: string[] = [];
  events: string[] = [];
  errorMsg = '';

  private subs: Subscription[] = [];

  constructor(private api: ApiService, private socket: SocketService) {}

  async ngOnInit() {
    const status = await this.api.getMqttStatus();
    this.isRunning = status.isRunning;
    this.listeningAddresses = status.listeningAddresses ?? [];

    this.subs.push(
      this.socket.on<string>('mqtt:message').subscribe(msg => {
        this.messages.push(msg);
        if (this.messages.length > 500) this.messages.shift();
      }),
      this.socket.on<any>('mqtt:event').subscribe(evt => {
        this.events.push(`${evt.time} ${evt.message}`);
        if (this.events.length > 500) this.events.shift();
      }),
    );
  }

  async start() {
    this.errorMsg = '';
    try {
      const body: any = { port: this.port, bindIp: this.bindIp };
      if (this.useAuth && this.username) {
        body.username = this.username;
        body.password = this.password;
      }
      const res = await this.api.startMqtt(body);
      this.isRunning = res.isRunning;
      this.listeningAddresses = res.listeningAddresses ?? [];
    } catch (e: any) {
      this.errorMsg = e?.error?.error ?? 'Failed to start';
    }
  }

  async stop() {
    await this.api.stopMqtt();
    this.isRunning = false;
    this.listeningAddresses = [];
  }

  clearMessages() { this.messages = []; }
  clearEvents()   { this.events = []; }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
