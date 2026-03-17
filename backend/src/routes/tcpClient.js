const router = require('express').Router();

router.post('/reach', async (req, res) => {
  const svc = req.services.tcpReachabilityService;
  const { address, port, timeoutMs = 2000 } = req.body;
  if (!address || !port) return res.status(400).json({ error: 'address and port required' });
  const result = await svc.tryConnect(address, parseInt(port, 10), timeoutMs);
  res.json(result);
});

router.post('/throughput/start', (req, res) => {
  const svc = req.services.tcpThroughputService;
  const { address, port, samplePeriodMs = 200 } = req.body;
  if (!address || !port) return res.status(400).json({ error: 'address and port required' });
  svc.start({ address, port: parseInt(port, 10), samplePeriodMs });
  res.json({ started: true });
});

router.post('/throughput/stop', (req, res) => {
  const svc = req.services.tcpThroughputService;
  svc.stop();
  res.json({ stopped: true });
});

module.exports = router;
