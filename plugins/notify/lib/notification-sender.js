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
      task_complete: {
        title: '✅ 任务完成',
        message: 'Claude 已完成任务'
      },
      review_complete: {
        title: '🔍 审查完成',
        message: 'Claude 已完成代码审查'
      },
      question: {
        title: '❓ Claude 有问题',
        message: 'Claude 需要你的回答'
      },
      plan_ready: {
        title: '📋 计划就绪',
        message: 'Claude 已准备好实施计划'
      },
      session_limit: {
        title: '⏱️ 会话限制',
        message: '会话已达到限制'
      },
      api_error: {
        title: '🔴 API 错误',
        message: '需要重新登录'
      }
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

  async send(notificationType, customMessage = null) {
    // 检查通知是否启用
    if (!this.config.enabled) {
      return;
    }

    // 检查该类型是否被禁用
    if (this.config.disabled_types.includes(notificationType)) {
      return;
    }

    const defaults = this.getNotificationDefaults(notificationType);
    if (!defaults) {
      console.error('Unknown notification type:', notificationType);
      return;
    }

    // 发送桌面通知（声音由 node-notifier 处理）
    const projectName = this.getProjectName();
    const message = customMessage || defaults.message;
    const title = `${defaults.title} · ${projectName}`;
    await this.sendDesktopNotification(title, message);
  }

  async sendDesktopNotification(title, message) {
    return new Promise((resolve, reject) => {
      const options = {
        title: title,
        message: message,
        sound: this.config.sound,
        wait: false
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
