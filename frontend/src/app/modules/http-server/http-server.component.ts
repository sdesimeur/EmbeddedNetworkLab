import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { ConsoleService } from '../../services/console.service';

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
  selectedVideo: Video | null = null;

  private subs: Subscription[] = [];

  constructor(
    private api: ApiService,
    private socket: SocketService,
    private console: ConsoleService,
  ) {}

  async ngOnInit() {
    const status = await this.api.getHttpServerStatus();
    this.isRunning = status.isRunning;
    this.listeningUrls = status.listeningUrls ?? [];
    this.videos = await this.api.getReceivedVideos();

    this.subs.push(
      this.socket.on<string>('http-server:event').subscribe(msg => {
        this.eventLog.push(msg);
        if (this.eventLog.length > 500) this.eventLog.shift();
        this.console.log(msg, 'HTTP Server');
      }),
      this.socket.on<{ percent: number }>('http-server:upload-progress').subscribe(p => {
        this.uploadProgress = p.percent;
      }),
      this.socket.on<Video>('http-server:video-received').subscribe(v => {
        this.videos.unshift(v);
        this.console.log(`Video received: ${v.fileName}`, 'HTTP Server');
      }),
    );
  }

  async start() {
    this.errorMsg = '';
    try {
      const res = await this.api.startHttpServer({ bindIp: this.bindIp, httpPort: this.httpPort });
      this.isRunning = res.isRunning;
      this.listeningUrls = res.listeningUrls ?? [];
      this.console.log(`Started on ${this.bindIp}:${this.httpPort}`, 'HTTP Server');
    } catch (e: any) {
      this.errorMsg = e?.error?.error ?? 'Failed to start';
      this.console.log(`[ERROR] ${this.errorMsg}`, 'HTTP Server');
    }
  }

  async stop() {
    await this.api.stopHttpServer();
    this.isRunning = false;
    this.listeningUrls = [];
    this.uploadProgress = 0;
    this.console.log('Stopped', 'HTTP Server');
  }

  clearLog() { this.eventLog = []; }
  clearVideos() { this.videos = []; }

  openVideo(v: Video) { this.selectedVideo = v; }
  closeVideo() { this.selectedVideo = null; }
  videoUrl(v: Video) { return `/api/http-server/stream/${encodeURIComponent(v.fileName)}`; }
  downloadUrl(v: Video) { return `/api/http-server/download/${encodeURIComponent(v.fileName)}`; }

  async deleteVideo(v: Video) {
    await this.api.deleteVideo(v.fileName);
    this.videos = this.videos.filter(x => x.fileName !== v.fileName);
    if (this.selectedVideo?.fileName === v.fileName) this.selectedVideo = null;
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
