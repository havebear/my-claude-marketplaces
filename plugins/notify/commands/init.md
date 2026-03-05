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

## 步骤 3: 配置选项

依次使用 AskUserQuestion 询问用户以下配置项，每个问题将默认值作为第一个选项并标注「推荐」：

### 3.1 声音设置

询问：是否启用系统提示音？
- ✅ 开启（推荐）
- ❌ 关闭

### 3.2 冷却时间

询问：通知冷却时间（防止短时间内重复通知）？
- 30秒（推荐）
- 15秒
- 60秒

### 3.3 禁用通知类型

询问：是否需要禁用某些通知类型？
- 全部启用（推荐）
- 自定义禁用（如选择此项，进一步列出所有类型供用户多选：task_complete / review_complete / question / plan_ready / session_limit / api_error）

根据用户选择，更新 `${CLAUDE_PLUGIN_ROOT}/config/config.json`：

```json
{
  "enabled": true,
  "sound": true,
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
  - 声音使用系统提示音，无需额外文件
  - 如需自定义配置，可编辑 config/config.json

📝 可选：测试通知功能
  如果用户想要测试通知，可以运行：
  ```bash
  # 需要先确保 test-notification.js 文件存在
  node ${CLAUDE_PLUGIN_ROOT}/test-notification.js
  ```
  注意：test-notification.js 是开发工具，默认不包含在安装中。
```
