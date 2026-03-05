# My Claude Marketplaces

Claude Code 插件集合，提供项目规范管理、AI Agent 设计模式知识库、文件保护、Codex 集成和智能通知功能。

## 包含的插件

### 1. Project Spec（项目规范管理）

通过交互式多轮对话帮助创建详细、可执行的实施计划，并提供项目文档结构初始化功能。

**核心特性：**
- 5层次需求框架（Why/What/How/Constraints/EdgeCases）
- MoSCoW 范围确认机制，防止需求跑偏
- 6维度边界情况矩阵
- 灵活的3-5轮对话流程，提高信息密度
- 自动生成结构化计划文档
- 支持分阶段执行和进度追踪

**命令：**
- `/ps-init` - 初始化项目文档结构
- `/ps-plan` - 启动交互式计划制定流程
- `/ps-exec` - 执行计划

[查看详细文档 →](./plugins/project-spec/README.md)

### 2. File Guard（文件保护插件）

防止 Claude Code 意外修改和删除当前项目目录之外的文件。

**核心特性：**
- Edit 工具保护 - 拦截对项目外文件的编辑操作
- Bash rm 保护 - 拦截对项目外文件的删除命令
- 智能判断 - 基于 LLM 的路径分析
- 用户确认 - 检测到项目外操作时询问用户
- 零配置 - 自动复用 Claude Code 的工作目录机制

[查看详细文档 →](./plugins/file-guard/README.md)

### 3. Codex CLI 集成

集成 Codex CLI 工具，提供代码审查和调试功能。

**命令：**
- `/cxreview` - 手动触发代码审查

### 4. Knowledge Base（知识库管理）

提供知识条目管理和自动检索功能。

**命令：**
- `/kb-add`、`/kb-search`、`/kb-index` - 知识条目管理

### 5. Notify（智能通知系统）

在关键事件发生时发送桌面通知，提升 Claude Code 使用效率。

**核心特性：**
- 6种通知类型（任务完成、审查完成、问题提示、计划就绪、会话限制、API错误）
- 跨平台桌面通知（Windows/macOS/Linux）
- 自定义声音支持
- 智能去重机制

**命令：**
- `/notifications-init` - 初始化插件
- `/notifications-settings` - 配置通知选项

[查看详细文档 →](./plugins/notify/README.md)

## 快速开始

### 方式一：添加 Marketplace（推荐）

一次性添加所有插件：

```bash
claude plugin marketplace add https://github.com/qqabcv520/my-claude-marketplaces.git
```

添加后，所有插件会自动安装并可用。

### 方式二：安装单个插件

```bash
# 安装项目规范管理插件
claude plugin install ./plugins/project-spec

# 安装文件保护插件
claude plugin install ./plugins/file-guard

# 安装 Codex 集成插件
claude plugin install ./plugins/codex

# 安装知识库管理插件
claude plugin install ./plugins/knowledge-base

# 安装智能通知插件
claude plugin install ./plugins/notify
```

## 使用指南

### Project Spec

**初始化项目文档：**
```bash
/ps-init
```

**创建实施计划：**
```bash
/ps-plan 添加用户认证功能
```

或使用自然语言触发：
- "帮我制定实现计划"
- "创建开发计划"
- "分析需求并设计方案"

**执行计划：**
```bash
/ps-exec
```

### File Guard

插件会自动拦截对项目外文件的编辑和删除操作，无需手动触发。

### Notify

**初始化插件：**
```bash
/notify:init
```

## 项目结构

```
my-claude-marketplaces/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace 配置
├── plugins/
│   ├── project-spec/             # 项目规范管理插件
│   ├── file-guard/               # 文件保护插件
│   ├── codex/                    # Codex CLI 集成插件
│   ├── knowledge-base/           # 知识库管理插件
│   └── notify/                   # 智能通知插件
├── docs/                         # 共享文档
├── CLAUDE.md                     # AI 指导文档
├── LICENSE                       # MIT 许可证
└── README.md                     # 本文件
```

## 相关链接

- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)
- [插件开发指南](https://docs.anthropic.com/claude-code/plugins)
- [问题反馈](https://github.com/qqabcv520/my-claude-marketplaces/issues)

## 许可证

本项目采用 [MIT 许可证](./LICENSE)。

---

**维护者：** mifan
