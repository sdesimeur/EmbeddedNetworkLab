const EventEmitter = require('events');
const express = require('express');
const multer = require('multer');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = path.join(__dirname, '../../../received_videos');

class HttpServerService extends EventEmitter {
  constructor() {
    super();
    this._server = null;
    this.isRunning = false;
    this.listeningUrls = [];
  }

  async start({ bindIp = '0.0.0.0', httpPort = 8081 }) {
    if (this.isRunning) return;

    fs.mkdirSync(VIDEOS_DIR, { recursive: true });

    const app = express();

    // Multer storage: save to received_videos with original filename
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, VIDEOS_DIR),
      filename: (_req, file, cb) => cb(null, file.originalname),
    });
    const upload = multer({ storage });

    // Multipart upload endpoint
    app.post('/upload', upload.single('file'), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'no file' });
      }
      const clientIp = req.ip;
      const ts = new Date().toLocaleTimeString();
      this.emit('event', `[${ts}] [MULTIPART START] ${req.file.originalname} from ${clientIp}`);

      const video = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        receivedAt: new Date().toISOString(),
      };
      this.emit('video-received', video);

      const sizeKb = (req.file.size / 1024).toFixed(1);
      this.emit('event', `[${ts}] [UPLOAD] ${req.file.originalname} — ${sizeKb} KB — from ${clientIp}`);

      res.json({ status: 'uploaded' });
    });

    // Raw stream upload endpoint
    app.post('/upload/raw', (req, res) => {
      const fileName = `video_${Date.now()}.mp4`;
      const savePath = path.join(VIDEOS_DIR, fileName);
      const expected = parseInt(req.headers['content-length'] || '0', 10);
      const clientIp = req.ip;
      const ts = new Date().toLocaleTimeString();

      this.emit('event', `[${ts}] [UPLOAD START] ${fileName} from ${clientIp} size=${expected} bytes`);

      // Log headers
      for (const [key, val] of Object.entries(req.headers)) {
        this.emit('event', `[${ts}] [HEADER] ${key}: ${val}`);
      }

      const ws = fs.createWriteStream(savePath);
      let totalRead = 0;
      const startMs = Date.now();

      req.on('data', (chunk) => {
        ws.write(chunk);
        totalRead += chunk.length;
        if (expected > 0) {
          const percent = (totalRead / expected) * 100;
          this.emit('upload-progress', { totalRead, expected, percent });
        }
      });

      req.on('end', () => {
        ws.end();
        const duration = Math.max((Date.now() - startMs) / 1000, 0.001);
        const rateMbps = ((totalRead * 8) / 1_000_000 / duration).toFixed(2);
        const doneTs = new Date().toLocaleTimeString();
        this.emit('event', `[${doneTs}] [UPLOAD DONE] ${fileName} ${totalRead} bytes in ${duration.toFixed(2)}s (${rateMbps} Mbps)`);

        this.emit('video-received', {
          fileName,
          filePath: savePath,
          receivedAt: new Date().toISOString(),
        });

        res.json({ status: 'uploaded' });
      });

      req.on('error', (err) => {
        ws.end();
        this.emit('event', `[ERROR] raw upload: ${err.message}`);
        res.status(500).json({ error: err.message });
      });
    });

    // Delete video endpoint
    app.delete('/videos/:fileName', (req, res) => {
      const filePath = path.join(VIDEOS_DIR, path.basename(req.params.fileName));
      const clientIp = req.ip;
      const ts = new Date().toLocaleTimeString();
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }
      fs.unlinkSync(filePath);
      this.emit('event', `[${ts}] [DELETE] ${req.params.fileName} from ${clientIp}`);
      res.json({ status: 'deleted' });
    });

    // Catch-all: log all requests
    app.use((req, res) => {
      const ts = new Date().toLocaleTimeString();
      this.emit('event', `[${ts}] [REQUEST] ${req.method} ${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''} from ${req.ip}`);
      res.json({ status: 'ok', server: 'EmbeddedNetworkLab' });
    });

    return new Promise((resolve, reject) => {
      this._server = http.createServer(app);
      this._server.listen(httpPort, bindIp === '0.0.0.0' ? undefined : bindIp, () => {
        this.isRunning = true;
        this.listeningUrls = [`http://${bindIp}:${httpPort}/`];
        const ts = new Date().toLocaleTimeString();
        this.emit('event', `[${ts}] [START] Listening on ${this.listeningUrls.join(', ')}`);
        resolve();
      });
      this._server.on('error', (err) => {
        this.isRunning = false;
        this.emit('event', `[ERROR] Failed to start: ${err.message}`);
        reject(err);
      });
    });
  }

  async stop() {
    if (!this.isRunning || !this._server) return;
    return new Promise((resolve) => {
      this._server.close(() => {
        this.isRunning = false;
        this._server = null;
        this.listeningUrls = [];
        const ts = new Date().toLocaleTimeString();
        this.emit('event', `[${ts}] [STOP] Server stopped`);
        resolve();
      });
    });
  }

  getReceivedVideos() {
    try {
      if (!fs.existsSync(VIDEOS_DIR)) return [];
      return fs.readdirSync(VIDEOS_DIR)
        .filter(f => /\.(mp4|avi|mkv|mov|h264|bin)$/i.test(f))
        .map(f => ({
          fileName: f,
          filePath: path.join(VIDEOS_DIR, f),
          receivedAt: fs.statSync(path.join(VIDEOS_DIR, f)).mtime.toISOString(),
        }))
        .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    } catch {
      return [];
    }
  }
}

module.exports = HttpServerService;
