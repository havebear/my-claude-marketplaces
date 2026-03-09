const notifier = require('node-notifier');
const path = require('path');
const fs = require('fs');

class NotificationSender {
  constructor(config, pluginRoot) {
    this.pluginRoot = pluginRoot || process.env.CLAUDE_PLUGIN_ROOT;
    this.config = config || { enabled: true, sound: true, cooldown_seconds: 30, disabled_types: [] };
  }

  /**
   * 获取通知类型的默认设置
   */
  getNotificationDefaults(notificationType) {
    const defaults = {
      task_complete: '✅ 任务完成',
      execution_error: '🔴 执行出错',
      question: '❓️ 发起提问',
      permission: '❗️ 权限请求',
      plan_ready: '📋 计划就绪'
    };

    return defaults[notificationType] || null;
  }

  /**
   * 从工作目录中提取项目名称
   */
  getProjectName() {
    const cwd = process.env.CWD || process.cwd();
    return path.basename(cwd);
  }

  async send(notificationType) {
    // 检查通知是否启用
    if (!this.config.enabled) {
      return;
    }

    // 检查该类型是否被禁用
    if (this.config.disabled_types.includes(notificationType)) {
      return;
    }

    const message = this.getNotificationDefaults(notificationType);
    if (!message) {
      console.error('Unknown notification type:', notificationType);
      return;
    }

    const title = this.getProjectName();
    await this.sendDesktopNotification(title, message);
  }

  async sendDesktopNotification(title, message) {
    return new Promise((resolve, reject) => {
      const options = {
        title: title,
        message: message,
        sound: this.config.sound,
        timeout: this.config.cooldown_seconds * 1000,
      };

      // 添加图标
      const iconPath = path.join(this.pluginRoot, 'assets', 'claude-icon.png');
      if (fs.existsSync(iconPath)) {
        options.icon = iconPath;
      }

      notifier.notify(options, (err, response) => {
        if (err) {
          console.error('Notification error:', err.message);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}

module.exports = NotificationSender;
