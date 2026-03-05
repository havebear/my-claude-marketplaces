---
description: 初始化 Claude Notifications 插件
allowed-tools: [Bash, Read, Write, AskUserQuestion]
---

# 初始化 Claude Notifications 插件

你需要执行以下步骤来初始化插件：

## 步骤 1: 检查 Node.js

首先检查 Node.js 是否已安装（需要 v14 或更高版本）：

```bash
node --version
```

如果未安装或版本过低，请提示用户安装 Node.js。

## 步骤 2: 安装依赖

进入插件目录并安装 npm 依赖：

```bash
cd ${CLAUDE_PLUGIN_ROOT}
npm install
```

## 步骤 3: 配置选项（可选）

使用 AskUserQuestion 询问用户是否需要自定义配置：

- 是否启用声音？（默认：是）
- 冷却时间？（选项：15秒/30秒/60秒，默认：30秒）
- 是否禁用某些通知类型？（默认：全部启用）

如果用户选择默认配置，跳过此步骤。

如果用户需要自定义，更新 `${CLAUDE_PLUGIN_ROOT}/config/config.json`：

```json
{
  "enabled": true,
  "sound": true,
  "volume": 1.0,
  "cooldown_seconds": 30,
  "disabled_types": []
}
```

## 步骤 4: 验证依赖安装

运行依赖检查脚本验证安装：

```bash
node ${CLAUDE_PLUGIN_ROOT}/lib/check-dependencies.js
```

如果检查通过，说明插件已准备就绪。

**注意**：如果用户需要测试通知功能，可以告知他们 `test-notification.js` 是可选的开发工具，需要从源码目录手动复制。

## 步骤 5: 显示使用说明

初始化完成后，向用户显示以下信息：

```
✅ Claude Notifications 插件初始化完成！

🔔 支持的通知类型：
  ✅ 任务完成 (Task Complete)
  🔍 审查完成 (Review Complete)
  ❓ Claude 有问题 (Question)
  📋 计划就绪 (Plan Ready)
  ⏱️ 会话限制 (Session Limit Reached)
  🔴 API 错误 (API Error)

💡 提示：
  - 通知会在关键事件发生时自动触发
  - 默认启用 30 秒冷却时间，防止重复通知
  - 声音文件和图标已内置，无需下载
  - 如需自定义配置，可编辑 config/config.json

📝 可选：测试通知功能
  如果用户想要测试通知，可以运行：
  ```bash
  # 需要先确保 test-notification.js 文件存在
  node ${CLAUDE_PLUGIN_ROOT}/test-notification.js
  ```
  注意：test-notification.js 是开发工具，默认不包含在安装中。
```
