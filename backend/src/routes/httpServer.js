const router = require('express').Router();

router.get('/status', (req, res) => {
  console.log('httpServer/status');
  const svc = req.services.httpServerService;
  res.json({ isRunning: svc.isRunning, listeningUrls: svc.listeningUrls });
});

router.post('/start', async (req, res) => {
  console.log('httpServer/start');
  const svc = req.services.httpServerService;
  const { bindIp = '0.0.0.0', httpPort = 8081 } = req.body;
  try {
    await svc.start({ bindIp, httpPort: parseInt(httpPort, 10) });
    res.json({ isRunning: svc.isRunning, listeningUrls: svc.listeningUrls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stop', async (req, res) => {
  console.log('httpServer/stop');
  const svc = req.services.httpServerService;
  try {
    await svc.stop();
    res.json({ isRunning: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/videos', (req, res) => {
  console.log('httpServer/videos');
  const svc = req.services.httpServerService;
  res.json(svc.getReceivedVideos());
});

router.get('/stream/:fileName', (req, res) => {
  console.log('httpServer/stream/' + req.params.fileName);
  const path = require('path');
  const fs = require('fs');
  const VIDEOS_DIR = path.join(__dirname, '../../../received_videos');
  const filePath = path.join(VIDEOS_DIR, path.basename(req.params.fileName));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

router.get('/download/:fileName', (req, res) => {
  console.log('httpServer/download/' + req.params.fileName);
  const path = require('path');
  const fs = require('fs');
  const VIDEOS_DIR = path.join(__dirname, '../../../received_videos');
  const filePath = path.join(VIDEOS_DIR, path.basename(req.params.fileName));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.download(filePath, req.params.fileName);
});

router.delete('/videos/:fileName', (req, res) => {
  console.log('httpServer/videos/' + req.params.fileName);
  const path = require('path');
  const fs = require('fs');
  const VIDEOS_DIR = path.join(__dirname, '../../../received_videos');
  const filePath = path.join(VIDEOS_DIR, path.basename(req.params.fileName));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ status: 'deleted' });
});

module.exports = router;
