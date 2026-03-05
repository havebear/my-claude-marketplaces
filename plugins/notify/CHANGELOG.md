# Changelog

## [0.2.3] - 2026-03-04

### Fixed

- 修复 `check-dependencies.js` 导出方式：从对象导出改为直接导出函数，修复所有 hook 静默失败的问题
- 修复 `DedupManager` 构造参数：传入 `cooldown_seconds` 而非路径字符串，修复去重机制失效的问题
- 修复 `test-dedup-manager.js` 测试：使用正确的 `shouldSkip()` + `record()` API

### Removed

- 移除 `SubagentStop` hook（与 `Stop` hook 功能重复）
- 移除 `package.json` 中无效的 `"main": "index.js"` 字段
- 移除 `NotificationSender` 中重复的 `getDefaultConfig()` 方法

### Changed

- 统一 `package.json` 和 `plugin.json` 版本号至 v0.2.3

## [0.2.0] - 2026-02-03

### Changed

- **精简配置文件** - 配置文件从 65 行减少到 7 行（减少 90%）
- **重构 Hook 脚本** - 创建公共 HookHandler 类，代码量减少 65%
- **合并 Command 文件** - 将 notifications-init 和 notifications-settings 合并为单个 init 命令
- **内置资源文件** - 声音文件和图标文件已内置，无需手动下载

### Added

- 新增 `lib/hook-handler.js` - 公共 Hook 处理器
- 内置 6 个声音文件（task-complete.mp3, review-complete.mp3, question.mp3, plan-ready.mp3, alert.mp3, error.mp3）
- 内置 Claude 官方图标（claude-icon.png）

### Removed

- 删除 `commands/notifications-settings.md`（功能合并到 init.md）
- 删除 `assets/README.md` 和 `sounds/README.md`（资源文件已内置）

### Improved

- 简化初始化流程 - 只需运行 `/init` 一个命令
- 更清晰的配置结构 - 只保留用户可能修改的选项
- 更好的代码维护性 - 减少重复代码，集中管理公共逻辑

## [0.1.0] - 2024-01-XX

### Added

- 6 种通知类型（任务完成、审查完成、问题提示、计划就绪、会话限制、API 错误）
- 跨平台桌面通知支持（Windows/macOS/Linux）
- 自定义声音支持
- 智能去重机制（30秒冷却时间）
- 智能状态分析
- 交互式配置向导
- 初始化命令

