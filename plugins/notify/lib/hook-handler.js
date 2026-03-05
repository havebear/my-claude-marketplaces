const path = require('path');
const fs = require('fs');
const checkDependencies = require('./check-dependencies');
const NotificationSender = require('./notification-sender');
const DedupManager = require('./dedup-manager');

/**
 * 公共 Hook 处理器
 * 提取所有 Hook 脚本的公共逻辑
 */
class HookHandler {
  constructor() {
    this.pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
    this.config = null;
    this.sender = null;
    this.dedup = null;
  }

  /**
   * 初始化处理器
   * - 检查依赖
   * - 加载配置
   * - 初始化组件
   */
  async initialize() {
    // 检查依赖
    const depsOk = checkDependencies();
    if (!depsOk) {
      this.outputPermissionDecision('allow');
      process.exit(0);
    }

    // 加载配置
    const configPath = path.join(this.pluginRoot, 'config', 'config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configContent);
    } else {
      this.config = this.getDefaultConfig();
    }

    // 初始化组件
    this.sender = new NotificationSender(this.config, this.pluginRoot);
    this.dedup = new DedupManager(this.config.cooldown_seconds);
  }

  /**
   * 读取 stdin 输入
   */
  async readStdin() {
    return new Promise((resolve) => {
      let data = '';
      process.stdin.on('data', (chunk) => {
        data += chunk;
      });
      process.stdin.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({});
        }
      });
    });
  }

  /**
   * 发送通知
   * @param {string} type - 通知类型
   * @param {string} sessionId - 会话 ID
   * @param {string} customMessage - 自定义消息（可选）
   */
  async sendNotification(type, sessionId, customMessage = null) {
    // 检查去重
    if (this.dedup.shouldSkip(type, sessionId)) {
      return;
    }

    // 发送通知
    await this.sender.send(type, customMessage);

    // 记录去重
    this.dedup.record(type, sessionId);
  }

  /**
   * 输出权限决策
   * @param {string} decision - 'allow' 或 'deny'
   * @param {string} message - 可选的消息
   */
  outputPermissionDecision(decision, message = null) {
    const output = {
      decision: decision
    };
    if (message) {
      output.message = message;
    }
    console.log(JSON.stringify(output));
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      enabled: true,
      sound: true,
      volume: 1.0,
      cooldown_seconds: 30,
      disabled_types: []
    };
  }
}

module.exports = HookHandler;
