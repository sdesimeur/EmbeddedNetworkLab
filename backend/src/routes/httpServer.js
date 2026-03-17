const router = require('express').Router();

router.get('/status', (req, res) => {
  const svc = req.services.httpServerService;
  res.json({ isRunning: svc.isRunning, listeningUrls: svc.listeningUrls });
});

router.post('/start', async (req, res) => {
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
  const svc = req.services.httpServerService;
  try {
    await svc.stop();
    res.json({ isRunning: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/videos', (req, res) => {
  const svc = req.services.httpServerService;
  res.json(svc.getReceivedVideos());
});

module.exports = router;
