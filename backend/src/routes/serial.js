const router = require('express').Router();

router.get('/ports', async (req, res) => {
  const svc = req.services.serialService;
  const ports = await svc.listPorts();
  res.json(ports);
});

router.get('/baud-rates', (req, res) => {
  const svc = req.services.serialService;
  res.json(svc.getBaudRates());
});

router.get('/status', (req, res) => {
  const svc = req.services.serialService;
  res.json({ isOpen: svc.isOpen, portName: svc.portName, baudRate: svc.baudRate });
});

router.post('/open', async (req, res) => {
  const svc = req.services.serialService;
  const { portName, baudRate = 460800 } = req.body;
  if (!portName) return res.status(400).json({ error: 'portName required' });
  try {
    await svc.open(portName, parseInt(baudRate, 10));
    res.json({ isOpen: true, portName, baudRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/close', async (req, res) => {
  const svc = req.services.serialService;
  try {
    await svc.close();
    res.json({ isOpen: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send', async (req, res) => {
  const svc = req.services.serialService;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    await svc.send(text);
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/baud-rate', (req, res) => {
  const svc = req.services.serialService;
  const { baudRate } = req.body;
  if (!baudRate) return res.status(400).json({ error: 'baudRate required' });
  svc.setBaudRate(parseInt(baudRate, 10));
  res.json({ baudRate });
});

module.exports = router;
