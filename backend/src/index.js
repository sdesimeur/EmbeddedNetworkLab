const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const httpServerRoutes = require('./routes/httpServer');
const mqttBrokerRoutes = require('./routes/mqttBroker');
const tcpClientRoutes = require('./routes/tcpClient');
const serialRoutes = require('./routes/serial');
const configRoutes = require('./routes/config');

const HttpServerService = require('./services/HttpServerService');
const MqttBrokerService = require('./services/MqttBrokerService');
const TcpThroughputService = require('./services/TcpThroughputService');
const TcpReachabilityService = require('./services/TcpReachabilityService');
const SerialService = require('./services/SerialService');
const ConfigService = require('./services/ConfigService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Instantiate services
const configService = new ConfigService();
const httpServerService = new HttpServerService();
const mqttBrokerService = new MqttBrokerService();
const tcpThroughputService = new TcpThroughputService();
const tcpReachabilityService = new TcpReachabilityService();
const serialService = new SerialService();

// Wire services to socket.io events
httpServerService.on('event', (msg) => io.emit('http-server:event', msg));
httpServerService.on('upload-progress', (progress) => io.emit('http-server:upload-progress', progress));
httpServerService.on('video-received', (video) => io.emit('http-server:video-received', video));

mqttBrokerService.on('message', (msg) => io.emit('mqtt:message', msg));
mqttBrokerService.on('broker-event', (evt) => io.emit('mqtt:event', evt));

tcpThroughputService.on('rate', (rate) => io.emit('tcp:rate', rate));

serialService.on('data', (data) => io.emit('serial:data', data));
serialService.on('log', (msg) => io.emit('serial:log', msg));

// Attach services to request context
app.use((req, _res, next) => {
  req.services = {
    configService,
    httpServerService,
    mqttBrokerService,
    tcpThroughputService,
    tcpReachabilityService,
    serialService,
  };
  next();
});

// Routes
app.use('/api/http-server', httpServerRoutes);
app.use('/api/mqtt', mqttBrokerRoutes);
app.use('/api/tcp', tcpClientRoutes);
app.use('/api/serial', serialRoutes);
app.use('/api/config', configRoutes);

// Serve received_videos as static files
app.use('/videos', express.static(path.join(__dirname, '../../received_videos')));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[EmbeddedNetworkLab] Backend running on http://localhost:${PORT}`);
});
