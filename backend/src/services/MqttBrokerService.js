const EventEmitter = require('events');
const aedes = require('aedes');
const net = require('net');

class MqttBrokerService extends EventEmitter {
  constructor() {
    super();
    this._broker = null;
    this._server = null;
    this.isRunning = false;
    this.listeningAddresses = [];
  }

  async start({ port = 1883, bindIp = '0.0.0.0', username = null, password = null }) {
    if (this.isRunning) return;

    const broker = aedes();

    // Intercept published messages
    broker.on('publish', (packet, client) => {
      if (!client) return; // ignore internal publishes
      const topic = packet.topic;
      const payload = packet.payload ? packet.payload.toString() : '';
      const ts = new Date().toLocaleTimeString();
      this.emit('message', `${ts} [MSG] ${topic}: ${payload}`);
    });

    // Track client connections
    broker.on('client', (client) => {
      const ts = new Date().toLocaleTimeString();
      this.emit('broker-event', {
        time: ts,
        level: 'Info',
        category: 'System',
        message: `[CONNECT] Client ${client.id}`,
      });
    });

    broker.on('clientDisconnect', (client) => {
      const ts = new Date().toLocaleTimeString();
      this.emit('broker-event', {
        time: ts,
        level: 'Info',
        category: 'System',
        message: `[DISCONNECT] Client ${client.id}`,
      });
    });

    // Optional authentication
    if (username && password) {
      broker.authenticate = (_client, user, pass, callback) => {
        const authorized = user && user.toString() === username &&
                           pass && pass.toString() === password;
        callback(null, authorized);
      };
    }

    const server = net.createServer(broker.handle);

    return new Promise((resolve, reject) => {
      const host = bindIp === '0.0.0.0' ? undefined : bindIp;
      server.listen(port, host, () => {
        this._broker = broker;
        this._server = server;
        this.isRunning = true;
        this.listeningAddresses = [`${bindIp}:${port}`];
        resolve();
      });
      server.on('error', (err) => {
        this.isRunning = false;
        reject(err);
      });
    });
  }

  async stop() {
    if (!this.isRunning) return;
    return new Promise((resolve) => {
      this._server.close(() => {
        this._broker.close(() => {
          this.isRunning = false;
          this._broker = null;
          this._server = null;
          this.listeningAddresses = [];
          resolve();
        });
      });
    });
  }
}

module.exports = MqttBrokerService;
