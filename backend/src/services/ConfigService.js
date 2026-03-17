const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const SERIAL_COMMANDS_PATH = path.join(DATA_DIR, 'serial_commands.json');
const SIMULATOR_COMMANDS_PATH = path.join(DATA_DIR, 'simulator_centrale_commands.json');

class ConfigService {
  constructor() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    this._ensureDefaults();
  }

  _ensureDefaults() {
    if (!fs.existsSync(SERIAL_COMMANDS_PATH)) {
      const defaults = Array.from({ length: 10 }, (_, i) => ({ name: `Cmd ${i + 1}`, text: '' }));
      fs.writeFileSync(SERIAL_COMMANDS_PATH, JSON.stringify(defaults, null, 2));
    }
    if (!fs.existsSync(SIMULATOR_COMMANDS_PATH)) {
      const defaults = Array.from({ length: 10 }, (_, i) => ({ name: `Cmd ${i + 1}`, text: '' }));
      fs.writeFileSync(SIMULATOR_COMMANDS_PATH, JSON.stringify(defaults, null, 2));
    }
  }

  loadSerialCommands() {
    try {
      return JSON.parse(fs.readFileSync(SERIAL_COMMANDS_PATH, 'utf-8'));
    } catch {
      return [];
    }
  }

  saveSerialCommands(commands) {
    fs.writeFileSync(SERIAL_COMMANDS_PATH, JSON.stringify(commands, null, 2));
  }

  loadSimulatorCommands() {
    try {
      return JSON.parse(fs.readFileSync(SIMULATOR_COMMANDS_PATH, 'utf-8'));
    } catch {
      return [];
    }
  }

  saveSimulatorCommands(commands) {
    fs.writeFileSync(SIMULATOR_COMMANDS_PATH, JSON.stringify(commands, null, 2));
  }
}

module.exports = ConfigService;
