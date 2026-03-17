import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

interface Video { fileName: string; filePath: string; receivedAt: string; }

@Component({
  selector: 'app-http-server',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './http-server.component.html',
  styleUrl: './http-server.component.scss',
})
export class HttpServerComponent implements OnInit, OnDestroy {
  isRunning = false;
  bindIp = '0.0.0.0';
  httpPort = 8081;
  listeningUrls: string[] = [];
  eventLog: string[] = [];
  videos: Video[] = [];
  uploadProgress = 0;
  errorMsg = '';

  private subs: Subscription[] = [];

  constructor(private api: ApiService, private socket: SocketService) {}

  async ngOnInit() {
    const status = await this.api.getHttpServerStatus();
    this.isRunning = status.isRunning;
    this.listeningUrls = status.listeningUrls ?? [];
    this.videos = await this.api.getReceivedVideos();

    this.subs.push(
      this.socket.on<string>('http-server:event').subscribe(msg => {
        this.eventLog.push(msg);
        if (this.eventLog.length > 500) this.eventLog.shift();
      }),
      this.socket.on<{ percent: number }>('http-server:upload-progress').subscribe(p => {
        this.uploadProgress = p.percent;
      }),
      this.socket.on<Video>('http-server:video-received').subscribe(v => {
        this.videos.unshift(v);
      }),
    );
  }

  async start() {
    this.errorMsg = '';
    try {
      const res = await this.api.startHttpServer({ bindIp: this.bindIp, httpPort: this.httpPort });
      this.isRunning = res.isRunning;
      this.listeningUrls = res.listeningUrls ?? [];
    } catch (e: any) {
      this.errorMsg = e?.error?.error ?? 'Failed to start';
    }
  }

  async stop() {
    await this.api.stopHttpServer();
    this.isRunning = false;
    this.listeningUrls = [];
    this.uploadProgress = 0;
  }

  clearLog() { this.eventLog = []; }
  clearVideos() { this.videos = []; }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
