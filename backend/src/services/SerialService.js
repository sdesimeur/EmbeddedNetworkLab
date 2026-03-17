const EventEmitter = require('events');
const { SerialPort } = require('serialport');

const BAUD_RATES = [110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

class SerialService extends EventEmitter {
  constructor() {
    super();
    this._port = null;
    this.isOpen = false;
    this.portName = null;
    this.baudRate = 460800;
  }

  async listPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(p => p.path).sort();
    } catch {
      return [];
    }
  }

  getBaudRates() {
    return BAUD_RATES;
  }

  open(portName, baudRate) {
    return new Promise((resolve, reject) => {
      if (this.isOpen) {
        return reject(new Error('Port already open'));
      }

      const port = new SerialPort({ path: portName, baudRate, autoOpen: false });

      port.open((err) => {
        if (err) return reject(err);
        this._port = port;
        this.isOpen = true;
        this.portName = portName;
        this.baudRate = baudRate;

        const ts = new Date().toLocaleTimeString();
        this.emit('log', `Opened ${portName} @ ${baudRate} baud.`);

        port.on('data', (data) => {
          const text = data.toString();
          this.emit('data', text);
          this.emit('log', text);
        });

        port.on('error', (err) => {
          this.emit('log', `[ERROR] ${err.message}`);
        });

        port.on('close', () => {
          this.isOpen = false;
          this.portName = null;
          this._port = null;
          this.emit('log', 'Port closed.');
        });

        resolve();
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (!this._port || !this.isOpen) {
        this.isOpen = false;
        return resolve();
      }
      this._port.close((err) => {
        this.isOpen = false;
        this.portName = null;
        this._port = null;
        if (err) return reject(err);
        resolve();
      });
    });
  }

  send(text) {
    if (!this._port || !this.isOpen) {
      throw new Error('Serial port is not open');
    }
    return new Promise((resolve, reject) => {
      this._port.write(text + '\n', (err) => {
        if (err) return reject(err);
        this.emit('log', `Sent: ${text}`);
        resolve();
      });
    });
  }

  setBaudRate(baudRate) {
    if (!this._port || !this.isOpen) return;
    this._port.update({ baudRate }, (err) => {
      if (!err) {
        this.baudRate = baudRate;
        this.emit('log', `Baudrate updated to ${baudRate} baud.`);
      }
    });
  }
}

module.exports = SerialService;
