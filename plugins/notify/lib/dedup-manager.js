const fs = require('fs');
const path = require('path');
const os = require('os');

class DedupManager {
  constructor(cooldownSeconds = 30) {
    this.stateDir = path.join(os.tmpdir(), 'notify');
    this.stateFile = path.join(this.stateDir, 'dedup-state.json');
    this.cooldownSeconds = cooldownSeconds;
  }

  ensureStateDir() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load dedup state:', error.message);
    }
    return {};
  }

  saveState(state) {
    try {
      this.ensureStateDir();
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Failed to save dedup state:', error.message);
    }
  }

  shouldSkip(notificationType, sessionId) {
    const state = this.loadState();
    const key = `${sessionId}:${notificationType}`;
    const now = Date.now();

    if (state[key]) {
      const lastSent = state[key].timestamp;
      const elapsed = (now - lastSent) / 1000;

      if (elapsed < this.cooldownSeconds) {
        return true; // 在冷却期内，跳过
      }
    }

    return false; // 不在冷却期内，不跳过
  }

  record(notificationType, sessionId) {
    const state = this.loadState();
    const key = `${sessionId}:${notificationType}`;
    state[key] = { timestamp: Date.now() };
    this.saveState(state);
  }

  cleanup() {
    // 清理超过24小时的旧状态
    const state = this.loadState();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let cleaned = false;
    for (const key in state) {
      if (now - state[key].timestamp > oneDayMs) {
        delete state[key];
        cleaned = true;
      }
    }

    if (cleaned) {
      this.saveState(state);
    }
  }
}

module.exports = DedupManager;
