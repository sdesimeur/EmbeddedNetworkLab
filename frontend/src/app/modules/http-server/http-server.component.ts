import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { ConsoleService } from '../../services/console.service';

interface Video { fileName: string; filePath: string; receivedAt: string; }
interface UploadProgress { totalRead: number; expected: number; percent: number; }

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
  uploadBytes = 0;
  uploadTotal = 0;
  uploadCompleted = false;
  uploading = false;
  errorMsg = '';
  selectedVideo: Video | null = null;

  private progressResetTimer: ReturnType<typeof setTimeout> | null = null;

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
      this.socket.on<UploadProgress>('http-server:upload-progress').subscribe(p => {
        this.uploadProgress = Math.min(p.percent, 100);
        this.uploadBytes = p.totalRead;
        this.uploadTotal = p.expected;
        this.uploadCompleted = false;
        if (this.progressResetTimer) clearTimeout(this.progressResetTimer);
        if (p.percent >= 100) {
          this.uploadCompleted = true;
          this.progressResetTimer = setTimeout(() => {
            this.uploadProgress = 0;
            this.uploadCompleted = false;
          }, 3000);
        }
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
    this.uploadCompleted = false;
    if (this.progressResetTimer) clearTimeout(this.progressResetTimer);
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

  onFileSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    this.uploadRaw(files[0]);
  }

  uploadRaw(file: File) {
    this.uploading = true;
    this.uploadCompleted = false;
    this.uploadProgress = 0;
    this.uploadBytes = 0;
    this.uploadTotal = file.size;
    this.errorMsg = '';
    if (this.progressResetTimer) clearTimeout(this.progressResetTimer);

    const host = this.bindIp === '0.0.0.0' ? 'localhost' : this.bindIp;
    const url = `http://${host}:${this.httpPort}/upload/raw`;

    const reader = new FileReader();

    reader.onerror = () => {
      this.uploading = false;
      this.errorMsg = 'Impossible de lire le fichier';
    };

    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          this.uploadProgress = (e.loaded / e.total) * 100;
          this.uploadBytes = e.loaded;
        }
      };

      xhr.onload = () => {
        this.uploading = false;
        this.uploadCompleted = true;
        this.uploadProgress = 100;
        this.progressResetTimer = setTimeout(() => {
          this.uploadProgress = 0;
          this.uploadCompleted = false;
        }, 3000);
      };

      xhr.onerror = () => {
        this.uploading = false;
        this.uploadProgress = 0;
        this.errorMsg = `Échec de l'envoi vers ${url}`;
      };

      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));
      xhr.send(buffer);
    };

    reader.readAsArrayBuffer(file);
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.progressResetTimer) clearTimeout(this.progressResetTimer);
  }
}
