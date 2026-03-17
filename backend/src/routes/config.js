const router = require('express').Router();

router.get('/serial-commands', (req, res) => {
  const svc = req.services.configService;
  res.json(svc.loadSerialCommands());
});

router.post('/serial-commands', (req, res) => {
  const svc = req.services.configService;
  const { commands } = req.body;
  if (!Array.isArray(commands)) return res.status(400).json({ error: 'commands array required' });
  svc.saveSerialCommands(commands);
  res.json({ saved: true });
});

router.get('/simulator-commands', (req, res) => {
  const svc = req.services.configService;
  res.json(svc.loadSimulatorCommands());
});

router.post('/simulator-commands', (req, res) => {
  const svc = req.services.configService;
  const { commands } = req.body;
  if (!Array.isArray(commands)) return res.status(400).json({ error: 'commands array required' });
  svc.saveSimulatorCommands(commands);
  res.json({ saved: true });
});

module.exports = router;
