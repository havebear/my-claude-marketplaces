const notifier = require('node-notifier');
const fs = require('fs');
const path = require('path');

class NotificationSender {
  constructor(config, pluginRoot) {
    this.pluginRoot = pluginRoot || process.env.CLAUDE_PLUGIN_ROOT;
    this.config = config || { enabled: true, sound: true, volume: 1.0, cooldown_seconds: 30, disabled_types: [] };
  }

  /**
   * 获取通知类型的默认设置
   */
  getNotificationDefaults(notificationType) {
    const defaults = {
      task_complete: {
        title: '✅ 任务完成',
        message: 'Claude 已完成任务',
        sound: path.join(this.pluginRoot, 'sounds', 'task-complete.mp3')
      },
      review_complete: {
        title: '🔍 审查完成',
        message: 'Claude 已完成代码审查',
        sound: path.join(this.pluginRoot, 'sounds', 'review-complete.mp3')
      },
      question: {
        title: '❓ Claude 有问题',
        message: 'Claude 需要你的回答',
        sound: path.join(this.pluginRoot, 'sounds', 'question.mp3')
      },
      plan_ready: {
        title: '📋 计划就绪',
        message: 'Claude 已准备好实施计划',
        sound: path.join(this.pluginRoot, 'sounds', 'plan-ready.mp3')
      },
      session_limit: {
        title: '⏱️ 会话限制',
        message: '会话已达到限制',
        sound: path.join(this.pluginRoot, 'sounds', 'alert.mp3')
      },
      api_error: {
        title: '🔴 API 错误',
        message: '需要重新登录',
        sound: path.join(this.pluginRoot, 'sounds', 'error.mp3')
      }
    };

    return defaults[notificationType] || null;
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

    // 发送桌面通知
    const message = customMessage || defaults.message;
    await this.sendDesktopNotification(defaults.title, message);

    // 播放声音
    if (this.config.sound && defaults.sound) {
      await this.playSound(defaults.sound);
    }
  }

  async sendDesktopNotification(title, message) {
    return new Promise((resolve, reject) => {
      const options = {
        title: title,
        message: message,
        sound: false, // 我们单独处理声音
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

  async playSound(soundPath) {
    if (!fs.existsSync(soundPath)) {
      console.error('Sound file not found:', soundPath);
      return;
    }

    try {
      const soundPlay = require('sound-play');
      const volume = Math.min(1, Math.max(0, this.config.volume != null ? this.config.volume : 1));
      const absolutePath = path.resolve(soundPath);
      await soundPlay.play(absolutePath, volume);
    } catch (err) {
      console.error('Sound playback error:', err.message);
    }
  }
}

module.exports = NotificationSender;
