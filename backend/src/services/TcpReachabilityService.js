const net = require('net');

class TcpReachabilityService {
  /**
   * Try to connect to address:port within timeoutMs.
   * Sends protocol byte 0x01 (reach) on success.
   * Returns { ok: true/false }
   */
  tryConnect(address, port, timeoutMs = 2000) {
    return new Promise((resolve) => {
      const socket = net.createConnection({ host: address, port, timeout: timeoutMs });

      socket.once('connect', () => {
        socket.write(Buffer.from([0x01]));
        socket.destroy();
        resolve({ ok: true });
      });

      socket.once('timeout', () => {
        socket.destroy();
        resolve({ ok: false });
      });

      socket.once('error', () => {
        resolve({ ok: false });
      });
    });
  }
}

module.exports = TcpReachabilityService;
