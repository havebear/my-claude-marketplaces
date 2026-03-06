const path = require('path');
const fs = require('fs');
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
   * - 加载配置
   * - 初始化组件
   */
  async initialize() {
    // 加载配置
    const configPath = path.join(this.pluginRoot, 'config', 'config.json');
    try {
      this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      this.config = this.getDefaultConfig();
    }

    // 懒加载 NotificationSender，依赖缺失时捕获 MODULE_NOT_FOUND 错误
    try {
      const NotificationSender = require('./notification-sender');
      this.sender = new NotificationSender(this.config, this.pluginRoot);
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        console.error('[notify] 依赖缺失，请运行 /notify:init 初始化插件');
        process.exit(0);
      }
      throw e;
    }

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
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      enabled: true,
      sound: true,
      cooldown_seconds: 30,
      disabled_types: []
    };
  }
}

module.exports = HookHandler;
