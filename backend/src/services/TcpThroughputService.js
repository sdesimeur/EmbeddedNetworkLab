const EventEmitter = require('events');
const net = require('net');

class TcpThroughputService extends EventEmitter {
  constructor() {
    super();
    this._socket = null;
    this._running = false;
    this._samplePeriodMs = 200;
  }

  start({ address, port, samplePeriodMs = 200 }) {
    if (this._running) return;
    this._running = true;
    this._samplePeriodMs = samplePeriodMs;
    this._connect(address, port);
  }

  stop() {
    this._running = false;
    if (this._socket) {
      this._socket.destroy();
      this._socket = null;
    }
    this.emit('rate', 0);
  }

  _connect(address, port) {
    const socket = net.createConnection({ host: address, port }, () => {
      // Protocol byte: throughput mode (0x02)
      socket.write(Buffer.from([0x02]));

      const buffer = Buffer.alloc(4096);
      // Fill with random-ish data
      for (let i = 0; i < buffer.length; i++) buffer[i] = Math.floor(Math.random() * 256);

      let bytesSent = 0;
      let lastBytes = 0;
      let lastTime = Date.now();

      const sendLoop = () => {
        if (!this._running) return;
        socket.write(buffer, () => {
          bytesSent += buffer.length;
          const now = Date.now();
          if (now - lastTime >= this._samplePeriodMs) {
            const deltaBytes = bytesSent - lastBytes;
            const seconds = (now - lastTime) / 1000;
            const mbps = (deltaBytes * 8) / 1_000_000 / seconds;
            this.emit('rate', mbps);
            lastBytes = bytesSent;
            lastTime = now;
          }
          if (this._running) setImmediate(sendLoop);
        });
      };

      sendLoop();
    });

    socket.on('error', () => {
      this._running = false;
      this.emit('rate', 0);
    });

    socket.on('close', () => {
      if (this._running) {
        this._running = false;
        this.emit('rate', 0);
      }
    });

    this._socket = socket;
  }
}

module.exports = TcpThroughputService;
