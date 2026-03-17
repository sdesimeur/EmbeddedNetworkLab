const router = require('express').Router();

router.get('/status', (req, res) => {
  const svc = req.services.mqttBrokerService;
  res.json({ isRunning: svc.isRunning, listeningAddresses: svc.listeningAddresses });
});

router.post('/start', async (req, res) => {
  const svc = req.services.mqttBrokerService;
  const { port = 1883, bindIp = '0.0.0.0', username, password } = req.body;
  try {
    await svc.start({ port: parseInt(port, 10), bindIp, username, password });
    res.json({ isRunning: svc.isRunning, listeningAddresses: svc.listeningAddresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stop', async (req, res) => {
  const svc = req.services.mqttBrokerService;
  try {
    await svc.stop();
    res.json({ isRunning: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
