# Claude Notifications

在关键事件发生时发送桌面通知，提升 Claude Code 使用效率。

## 功能

- ✅ **任务完成** - Claude 完成任务时通知
- 🔴 **执行出错** - 会话限制或 API 错误时通知
- ❓ **问题提示** - Claude 需要回答时通知
- 📋 **计划就绪** - 计划准备好时通知

## 快速开始

### 1. 初始化插件

在 Claude Code 中运行：

```bash
/init
```

该命令会：
- 检查 Node.js 版本
- 安装依赖
- 询问配置选项（可选）

### 2. 测试通知功能（可选）

如果需要测试通知是否正常工作，可以运行：

```bash
# 在源码目录测试
cd plugins/notify
node test-notification.js

# 或在安装目录测试（需要先复制测试文件）
cd C:\Users\<your-username>\.claude\plugins\cache\my-claude-marketplaces\notify\0.2.0
node test-notification.js
```

**注意**：`test-notification.js` 是开发测试工具，默认不包含在插件安装中。如需使用，请从源码目录复制到安装目录。

### 3. 开始使用

插件会自动在以下事件触发通知：
- Claude 完成任务（工具调用 >= 2 次）
- Claude 提出问题
- 计划制定完成
- 会话限制或 API 错误（执行出错）

## 配置

配置文件位于 `config/config.json`：

```json
{
  "enabled": true,
  "sound": true,
  "cooldown_seconds": 30,
  "disabled_types": []
}
```

### 配置选项

- `enabled` - 是否启用通知（默认：true）
- `sound` - 是否播放系统提示音（默认：true）
- `cooldown_seconds` - 冷却时间，防止重复通知（默认：30秒）
- `disabled_types` - 禁用的通知类型数组（默认：[]）

### 禁用特定通知类型

如果你不想收到某些类型的通知，可以添加到 `disabled_types`：

```json
{
  "disabled_types": ["execution_error"]
}
```

可用的通知类型：
- `task_complete`
- `execution_error`
- `question`
- `plan_ready`

## 资源文件

插件已内置以下资源文件：

### 声音文件（sounds/）
- task-complete.mp3
- review-complete.mp3
- question.mp3
- plan-ready.mp3
- alert.mp3
- error.mp3

### 图标文件（assets/）
- claude-icon.png

### 自定义资源

如果你想使用自己的声音文件或图标：

1. 替换 `sounds/` 目录中的 MP3 文件
2. 替换 `assets/claude-icon.png`
3. 保持文件名不变

## 故障排除

### 通知不显示

```bash
# 检查依赖
node lib/check-dependencies.js

# 测试通知
node test-notification.js
```

### 测试特定通知类型

```bash
node test-notification.js task_complete
node test-notification.js question
node test-notification.js plan_ready
```

### 依赖未安装

如果看到"依赖未安装"错误，运行：

```bash
cd plugins/notify
npm install
```

### 系统通知权限

确保系统允许 Node.js 发送通知：
- **Windows**: 检查"设置 > 系统 > 通知"
- **macOS**: 检查"系统偏好设置 > 通知"
- **Linux**: 检查通知守护进程是否运行

## 技术栈

- **node-notifier** - 跨平台桌面通知
- **sound-play** - 跨平台音频播放（Windows + macOS）
- **Node.js** >= 14.0.0

## 许可证

MIT License
