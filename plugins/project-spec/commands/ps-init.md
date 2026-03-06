---
name: ps-init
description: 初始化项目文档结构，生成 CLAUDE.md 和 docs/ 目录
---

# 项目文档初始化命令

此命令用于快速初始化项目的文档结构，自动生成 CLAUDE.md 和 docs/ 目录下的各类文档。

## 使用方法

```bash
/ps-init
```

## 功能特性

- **智能项目识别**：自动识别项目类型（前端/后端/Python/数据分析/Claude插件等）
- **动态文档生成**：根据项目类型推荐合适的文档清单
- **文档分层设计**：CLAUDE.md 只包含高频使用内容，详细文档放到 docs/
- **增量更新支持**：检测已存在文件，避免覆盖用户内容
- **复杂模块检测**：识别需要专门文档的复杂模块

## 执行流程

当你运行此命令时，将执行以下步骤：

### 1. 项目分析
- 扫描项目配置文件（package.json、requirements.txt 等）
- 分析项目目录结构
- 识别项目类型和技术栈
- 检测复杂模块

### 2. 文档推荐
根据项目类型推荐文档清单：

**前端项目**：ARCHITECTURE.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md, COMPONENTS.md, THEME.md

**Node.js 后端**：ARCHITECTURE.md, API.md, DATABASE.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md, DEPLOYMENT.md

**Python 后端**：ARCHITECTURE.md, API.md, DATABASE.md, TESTING.md, DEVELOPMENT.md, DEPLOYMENT.md

**Web3 项目**：ARCHITECTURE.md, WALLET_AUTH_IMPLEMENTATION.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md

**数据分析**：DATA_SOURCES.md, ANALYSIS_WORKFLOW.md, MODELS.md, TESTING.md

**Claude 插件**：PLUGIN_STRUCTURE.md, COMMANDS.md, SKILLS.md, HOOKS.md, TESTING.md

**通用项目**：ARCHITECTURE.md, TESTING.md, DEVELOPMENT.md

### 3. 交互确认
- 展示识别结果
- 询问用户选择需要的文档
- 确认复杂模块是否需要专门文档

### 4. 文档生成
- 生成精简的 CLAUDE.md（<500行）
- 生成选定的 docs/ 文档
- 检测文件冲突，询问处理方式

### 5. 后续指导
- 显示生成的文档清单
- 提供后续建议

## 生成的文档结构

```
项目根目录/
├── CLAUDE.md              # 精简版项目文档
└── docs/
    ├── ARCHITECTURE.md    # 架构设计（按需）
    ├── TESTING.md         # 测试规范（按需）
    ├── API.md             # API 文档（按需）
    ├── CONTRIBUTING.md    # 贡献指南（按需）
    └── ...                # 其他文档（按需）
```

## CLAUDE.md 内容

生成的 CLAUDE.md 包含：
- 项目概述（1-2句话）
- 技术栈
- 项目结构（简略）
- 常用命令
- 编码规范（核心规则）
- 📚 详细文档索引（Reference 机制）

## Reference 机制

CLAUDE.md 中会包含详细文档索引，引导 AI 在需要时读取对应文档：

```markdown
## 📚 详细文档索引

当需要了解以下内容时，请阅读对应文档：

- **架构设计和技术选型** → 请阅读 `docs/ARCHITECTURE.md`
- **测试策略和测试用例编写** → 请阅读 `docs/TESTING.md`
- **API 接口定义和使用** → 请阅读 `docs/API.md`

⚠️ **重要**：在开始实现功能前，如果涉及以上领域，请先使用 Read 工具阅读相关文档。
```

## 增量更新

如果检测到文件已存在，会询问处理方式：
- **覆盖**：用新内容替换现有文件
- **跳过**：保留现有文件，不生成新文件
- **合并**：尝试合并内容（仅限部分文件）

## 注意事项

- 生成的文档是模板，需要根据项目实际情况补充完善
- CLAUDE.md 应保持精简，避免占用过多上下文
- 详细内容应放到 docs/ 目录，通过 Reference 机制引用
- 建议定期使用 doc-sync skill 检查文档是否需要更新

## 相关资源

- 详细实施计划：`docs/spec/ps-init-command-20251226.md`
- 文档更新检测：使用 doc-sync skill（开发中）

---

## 执行指令

**重要：** 当此命令被调用时，执行以下步骤：

### 步骤 1：项目分析

使用以下工具分析项目：

1. **读取配置文件**
   - 使用 Read 工具读取 package.json（如果存在）
     * 提取：name, description, dependencies, devDependencies, scripts
     * 识别包管理器：检测 yarn.lock → yarn, pnpm-lock.yaml → pnpm, package-lock.json → npm
   - 使用 Read 工具读取 requirements.txt（如果存在）
   - 使用 Read 工具读取 .claude-plugin/plugin.json（如果存在）

2. **识别项目特征**
   - **项目类型识别**：
     * Next.js: 检测 next.config.js/next.config.mjs + next 依赖
     * React: 检测 react + react-dom 依赖
     * Vue: 检测 vue 依赖
     * Node.js后端: 检测 express/koa/fastify 依赖
     * Python后端: 检测 fastapi/django/flask 依赖
     * Web3项目: 检测 wagmi/ethers/web3/viem/@reown/appkit 依赖
     * Claude插件: 检测 .claude-plugin/plugin.json

   - **测试框架识别**：
     * Jest: 检测 jest 依赖
     * Vitest: 检测 vitest 依赖
     * Playwright: 检测 @playwright/test 依赖

   - **UI框架识别**：
     * MUI: 检测 @mui/material 依赖
     * Ant Design: 检测 antd 依赖
     * Tailwind: 检测 tailwindcss 依赖

   - **开发命令提取**：
     * 从 package.json 的 scripts 提取：dev/start/build/test/lint/type-check 等命令

3. **扫描目录结构**
   - 使用 Glob 扫描主要目录（src/, app/, components/, features/, common/, layouts/ 等）
   - 统计各目录的文件数量
   - 生成目录树（用于 ARCHITECTURE.md）
   - 识别复杂模块（文件数 ≥ 5 的目录）

4. **输出分析结果**
   通知用户识别结果：
   ```
   检测到这是一个 [项目类型] 项目
   - 框架：[框架列表]
   - 测试工具：[测试框架]
   - UI框架：[UI框架]（如有）
   - 包管理器：[npm/yarn/pnpm]
   - 主要目录：[目录列表]
   ```

### 步骤 2：推荐文档清单

根据识别的项目类型，推荐文档清单：

```
前端项目 → ARCHITECTURE.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md, COMPONENTS.md, THEME.md
Node.js后端 → ARCHITECTURE.md, API.md, DATABASE.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md, DEPLOYMENT.md
Python后端 → ARCHITECTURE.md, API.md, DATABASE.md, TESTING.md, DEVELOPMENT.md, DEPLOYMENT.md
Web3项目 → ARCHITECTURE.md, WALLET_AUTH_IMPLEMENTATION.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md
数据分析 → DATA_SOURCES.md, ANALYSIS_WORKFLOW.md, MODELS.md, TESTING.md
Claude插件 → PLUGIN_STRUCTURE.md, COMMANDS.md, SKILLS.md, HOOKS.md, TESTING.md
通用项目 → ARCHITECTURE.md, TESTING.md, DEVELOPMENT.md
```

**核心文档（所有项目必需）**：
- CLAUDE.md - AI开发指南（包含开发流程、文档索引、TDD规范）
- ARCHITECTURE.md - 项目架构和目录结构
- TESTING.md - 测试规范和覆盖率要求
- DEVELOPMENT.md - 开发命令和工作流程

**可选文档（根据项目类型）**：
- TECH_STACK.md - 技术栈详细说明（有 package.json 的项目）
- THEME_USAGE.md - 主题使用指南（检测到 UI 框架时）
- WALLET_AUTH_IMPLEMENTATION.md - 钱包认证实现（Web3 项目）
- API.md - API 接口文档（后端项目）
- DATABASE.md - 数据库设计（后端项目）

### 步骤 3：交互确认

1. **智能推断项目类型**（无需询问）
   - 根据配置文件和依赖自动识别
   - 输出通知："检测到这是一个 [项目类型] 项目（基于 [检测依据]）"
   - 只在无法识别或检测到多种类型特征时询问用户

2. **智能推荐文档清单**
   - 根据项目类型自动选择推荐文档
   - 使用 AskUserQuestion 提供两个选项：
     * "使用推荐配置"（默认选项，推荐）
     * "自定义选择文档"
   - 只有选择"自定义"时才展开多选列表
   - 推荐配置规则：
     * 前端项目 → ARCHITECTURE.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md
     * Node.js后端 → ARCHITECTURE.md, API.md, DATABASE.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md
     * Python后端 → ARCHITECTURE.md, API.md, DATABASE.md, TESTING.md, DEVELOPMENT.md
     * Web3项目 → ARCHITECTURE.md, WALLET_AUTH_IMPLEMENTATION.md, TESTING.md, DEVELOPMENT.md, TECH_STACK.md
     * Claude插件 → PLUGIN_STRUCTURE.md, COMMANDS.md, SKILLS.md, TESTING.md
     * 通用项目 → ARCHITECTURE.md, TESTING.md, DEVELOPMENT.md

3. **自动判断复杂模块**（无需询问）
   - 使用 Glob 扫描并统计文件数
   - 文件数 ≥ 5 → 自动生成专门文档
   - 输出通知："检测到 [模块名] 模块较复杂（[文件数]个文件），将生成 [文档名].md"

### 步骤 4：生成文档

1. **智能检测文件冲突和合并策略**
   - 使用 Read 工具检测文件是否存在
   - 如果文件存在，检查是否包含生成标识：
     `<!-- Generated by /ps-init on YYYY-MM-DD -->`
   - 处理逻辑：
     * 首次运行（文件不存在） → 直接生成
     * 包含生成标识 → 智能合并（保留用户自定义内容，更新模板部分）
     * 不包含生成标识 → 询问用户是否合并
   - 在生成的所有文档顶部添加标识注释

2. **生成 CLAUDE.md**（完整模板，自动填充）

   使用 Write 工具生成，内容结构如下：

   a) **文件头部**：
   ```markdown
   <!-- Generated by /ps-init on {当前日期} -->
   <!-- Last updated: {当前日期} -->

   # {从 package.json 提取的项目名称}

   ## 项目概述

   {从 package.json 提取的 description，如果没有则使用默认描述}
   ```

   b) **核心开发流程**：
   ```markdown
   ## 核心开发流程 (必须严格遵循)

   ### 阶段零：按需查阅文档

   **⚠️ 在开始任何开发任务前，必须先使用 Read 工具读取相关文档，禁止凭记忆或猜测开发！**

   #### 文档索引与适用场景

   {根据项目类型和生成的文档列表动态生成表格}

   示例（前端项目）：
   | 领域 | 文档 | 何时必读 |
   |------|------|---------|
   | 项目架构 | `docs/ARCHITECTURE.md` | 新增模块、修改目录结构前 |
   | 测试规范 | `docs/TESTING.md` | 编写任何测试代码前 |
   | 开发命令 | `docs/DEVELOPMENT.md` | 需要运行命令前 |
   | 技术栈 | `docs/TECH_STACK.md` | 了解依赖版本、升级依赖前 |

   示例（Web3项目额外添加）：
   | 钱包/认证 | `docs/WALLET_AUTH_IMPLEMENTATION.md` | 涉及钱包连接、签名前 |

   示例（后端项目额外添加）：
   | API 接口 | `docs/API.md` | 新增/修改接口前 |
   | 数据库 | `docs/DATABASE.md` | 修改数据模型前 |

   #### 文档读取检查清单

   - [ ] 至少阅读了一个文档
   - [ ] 理解了文档中的约束和规范
   - [ ] 确认当前任务不与文档中的设计冲突
   ```

   c) **TDD 流程**：
   ```markdown
   ### 阶段一：TDD 流程 (硬性要求，不可跳过)

   **🚫 禁止直接修改源代码！必须先写测试！**

   **违反此规则的任何代码变更都是无效的，必须回滚重做。**

   #### TDD 三步循环 (Red-Green-Refactor)

   | 步骤 | 操作 | 验证命令 | 预期结果 |
   |------|------|---------|---------|
   | 1. Red | 先写测试代码 | `{从 scripts 提取的测试命令}` | ❌ 测试失败 |
   | 2. Green | 再写实现代码 | `{从 scripts 提取的测试命令}` | ✅ 测试通过 |
   | 3. Refactor | 检查需求完成情况、优化代码 | `{从 scripts 提取的测试命令}` | ✅ 测试仍通过 |

   {测试命令示例：yarn test / npm test / pnpm test}

   #### 强制检查清单 (每次代码变更前必须确认)

   - [ ] 我已经先编写了测试用例
   - [ ] 我已经运行测试确认失败 (Red)
   - [ ] 只有在测试失败后，我才开始写实现代码

   #### 目录级覆盖率要求

   {根据扫描的目录结构动态生成表格}

   示例：
   | 目录 | 覆盖率要求 | 测试类型 |
   |------|-----------|---------|
   | `common/` | 90%+ | 单元测试 |
   | `components/` | 80%+ | 单元测试 |
   | `features/` | 80%+ | 单元测试 |
   | `app/` | 70%+ | 集成测试 |

   {根据实际存在的目录生成，如果目录不存在则不包含该行}

   #### 例外情况 (仅以下情况可跳过 TDD)

   - 纯配置文件修改
   - 纯样式修改
   - 文档更新
   - 依赖升级
   ```

   d) **质量检查**：
   ```markdown
   ### 阶段二：质量检查与收尾

   **修改代码后必须运行：**
   ```bash
   {从 scripts 提取的类型检查命令，如 yarn tsc}  # 类型检查，必须全部通过
   {从 scripts 提取的 lint 命令，如 yarn lint:fix}  # 代码规范检查，必须全部通过
   ```
   ```

   e) **文档同步**：
   ```markdown
   ### 阶段三：文档同步 (强制执行)

   **⚠️ 完成代码变更后，必须检查是否需要更新文档，不得遗漏！**

   #### 需要同步更新的文档

   {根据生成的文档列表动态生成映射表}

   示例：
   | 代码变更类型 | 需要更新的文档 |
   |------------|--------------|
   | 修改目录结构、新增核心模块 | `docs/ARCHITECTURE.md` |
   | 新增/修改测试工具或规范 | `docs/TESTING.md` |
   | 新增/修改开发命令或构建流程 | `docs/DEVELOPMENT.md` |
   | 升级主要依赖版本 | `docs/TECH_STACK.md` |

   {如果是 Web3 项目，添加：}
   | 修改钱包连接或登录认证流程 | `docs/WALLET_AUTH_IMPLEMENTATION.md` |

   {如果是后端项目，添加：}
   | 新增/修改 API 端点 | `docs/API.md` |
   | 修改数据模型 | `docs/DATABASE.md` |

   #### 文档更新检查清单

   - [ ] 已检查上表中的所有触发条件
   - [ ] 如有匹配项，已更新对应文档
   - [ ] 文档更新内容准确反映了代码变更
   ```

   f) **技术栈和项目结构**：
   ```markdown
   ## 技术栈

   {从 package.json 提取核心依赖，列出前 5-8 个主要框架和库}

   示例：
   - 框架：Next.js 15, React 19
   - UI 库：MUI
   - 状态管理：Zustand
   - Web3：wagmi, viem
   - 测试：Jest, React Testing Library
   - 包管理器：Yarn v4.9.2

   详见 `docs/TECH_STACK.md`

   ## 项目结构

   {生成简略的目录树，只显示主要目录}

   示例：
   ```
   项目根目录/
   ├── src/
   │   ├── app/          # Next.js 页面
   │   ├── components/   # 可复用组件
   │   ├── features/     # 功能模块
   │   └── common/       # 通用工具
   ├── docs/             # 项目文档
   └── __tests__/        # 测试文件
   ```

   详见 `docs/ARCHITECTURE.md`

   ## 常用命令

   {从 package.json scripts 生成命令表}

   示例：
   | 命令 | 说明 |
   |------|------|
   | `{包管理器} dev` | 启动开发服务器 |
   | `{包管理器} build` | 构建生产版本 |
   | `{包管理器} test` | 运行测试 |
   | `{包管理器} lint` | 代码检查 |
   | `{包管理器} tsc` | 类型检查 |

   ## 编码规范

   {根据项目类型提供基础编码规范，3-5条核心规则}

   示例（前端项目）：
   - 使用 TypeScript 严格模式
   - 组件使用函数式组件 + Hooks
   - 使用路径别名 `@/` 引用模块
   - 遵循 ESLint 和 Prettier 配置

   示例（后端项目）：
   - 使用 async/await 处理异步操作
   - API 路由遵循 RESTful 规范
   - 错误处理使用统一的错误中间件
   - 数据验证使用 Zod/Joi
   ```

   **长度控制**：确保 CLAUDE.md 总长度 <500 行，通过表格和简洁描述实现。

3. **生成 docs/ 文档**
   - 使用 Bash 工具创建 docs/ 目录（如果不存在）
   - 根据用户选择，使用 Write 工具生成各类文档
   - 在每个文档顶部添加生成标识：
     ```markdown
     <!-- Generated by /ps-init on YYYY-MM-DD -->
     <!-- Last updated: YYYY-MM-DD -->
     ```

   a) **ARCHITECTURE.md**（架构文档）

   ```markdown
   # 项目架构文档

   本文档描述 {项目名称} 的应用程序架构和目录结构。

   > **最后更新**: {当前日期}

   ## 目录结构概览

   ```
   {使用 Glob 扫描生成的实际目录树，显示前 3 层}
   ```

   ## 各目录职责说明

   | 目录 | 职责 | 放置规则 |
   |------|------|---------|
   {根据实际扫描的目录生成，示例：}
   | `src/app/` | Next.js 页面路由 | 页面组件和路由定义 |
   | `src/components/` | 可复用 UI 组件 | 独立的、可复用的组件 |
   | `src/features/` | 功能模块 | 按业务功能组织的代码 |
   | `src/common/` | 通用工具和类型 | 工具函数、常量、类型定义 |

   ## 详细目录结构

   {为每个主要目录提供详细说明}

   ### `src/app/` - 页面路由

   {描述该目录的作用和组织方式}

   ### `src/components/` - UI 组件

   {描述组件的组织方式和命名规范}

   ## 重要实现说明

   - **路径别名**: {如果检测到 tsconfig.json 中的 paths 配置，说明路径别名}
   - **模块导入**: {说明模块导入的规范}

   ## 维护此文档

   当进行以下变更时，请更新本文档：

   - 新增目录或文件（添加到相应结构部分）
   - 删除目录或文件（从相应结构部分移除）
   - 重命名或移动目录/文件（更新相应路径）
   - 重构代码组织结构（更新描述和层次结构）

   **关键原则**: 本文档应始终准确反映当前的目录结构，作为代码库架构的真实来源。
   ```

   b) **TESTING.md**（测试规范）

   ```markdown
   # 测试规范

   本文档用于保障测试代码质量，所有新增/修改代码必须遵循。

   ## 测试策略：金字塔模型

   ```
           /\
          /  \      E2E 测试（少量）
         /____\     验证关键业务流程
        /      \
       /        \   集成测试（丰富）
      /__________\  页面级功能验证
     /            \
    /              \ 单元测试（大量）
   /________________\ 工具函数、纯逻辑、独立组件
   ```

   ### 各层级定位

   | 测试类型 | 数量比例 | 覆盖范围 | 核心价值 |
   |---------|---------|---------|---------|\n   | **单元测试** | 70% | 工具函数、纯逻辑、独立组件 | 快速反馈、精准定位问题 |
   | **集成测试** | 25% | 页面内部协作 | 确保页面功能完整性 |
   | **E2E 测试** | 5% | 关键多页面业务流程 | 顶层验收、用户体验保障 |

   ## 技术栈与基础设置

   {根据检测到的测试框架生成}

   - 测试框架：{Jest/Vitest/Playwright}
   - UI 测试：{React Testing Library/Vue Test Utils}
   - 断言扩展：{@testing-library/jest-dom}

   ## 目录与命名

   - 位置：与被测文件同级的 `__tests__` 目录
   - 命名：`<文件名>.test.{ts|tsx|js|jsx}`
   - 数据：若需要固定数据，放在同级 `__fixtures__`

   ## 编写原则

   - **TDD**：先写测试再实现，遵循"红-绿-重构"循环
   - **AAA**：Arrange（准备） → Act（执行） → Assert（断言）
   - **查询优先级**：优先用语义查询，`data-testid` 仅在无语义可用时使用
   - **交互**：使用真实用户行为模拟工具
   - **异步**：使用 `findBy*` 或 `waitFor`，避免人为等待
   - **mock 策略**：
     - 仅 mock 不可控/慢速边界（网络请求、外部服务、时间、随机数）
     - 集成测试不 mock 应用内部模块，应使用真实的内部模块和依赖，确保模块间的交互被真正验证
     - 单元测试可按需 mock 内部依赖，以隔离被测单元
     - 组件内依赖的外部模块用 `jest.mock`
     - 使用 `jest.spyOn` 观察函数调用
   - **副作用清理（强制执行）**：
     - 每个测试必须清理自己产生的副作用
     - 必须清理：Mock 函数、定时器、DOM 操作、全局状态、事件监听器
     - 推荐在 `afterEach` 钩子中统一清理

   ## 覆盖率与质量门槛

   ### 目录级覆盖率要求

   {根据扫描的目录结构生成}

   | 目录 | 覆盖率要求 | 测试类型 | 说明 |
   |------|-----------|---------|------|
   | `common/` | 90%+ | 单元测试 | 纯函数、通用工具，必须高覆盖 |
   | `components/` | 80%+ | 单元测试 | UI 组件，覆盖渲染和交互 |
   | `features/` | 80%+ | 单元测试 | 业务逻辑核心 |
   | `app/` | 70%+ | 集成测试 | 页面组件，覆盖页面级功能 |

   ### 覆盖率检查

   ```bash
   {测试命令}              # 运行测试并检查覆盖率阈值
   {测试命令} --coverage   # 生成详细覆盖率报告
   ```

   ## 提交前检查清单

   - [ ] `{测试命令}`：所有测试通过
   - [ ] 变更代码时：`{类型检查命令}` 必须通过
   - [ ] 变更代码时：`{Lint命令}` 必须通过
   - [ ] 新增/修改页面时：必须补充对应的集成测试

   ## 常用命令

   ```bash
   {测试命令}                    # 运行所有测试
   {测试命令} <文件路径>         # 运行单个文件
   {测试命令} -t "<描述>"        # 运行匹配描述的用例
   {测试命令} --watch            # 监听模式
   {测试命令} --coverage         # 生成覆盖率报告
   ```

   ## 简要示例

   ### 工具函数

   {根据项目技术栈生成实际可运行的示例}

   ```typescript
   import { formatNumber } from '@/common/utils/format';

   describe('formatNumber', () => {
     it('格式化数字并保留两位小数', () => {
       expect(formatNumber(1234.567)).toBe('1,234.57');
     });

     it('处理空值为 0', () => {
       expect(formatNumber(null)).toBe('0');
     });
   });
   ```

   ### React 组件

   {根据测试框架生成对应示例}

   ```typescript
   import { render, screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { Button } from '@/components/Button';

   describe('Button', () => {
     it('点击按钮触发回调', async () => {
       const handleClick = jest.fn();
       render(<Button onClick={handleClick}>点击</Button>);

       await userEvent.click(screen.getByRole('button'));
       expect(handleClick).toHaveBeenCalledTimes(1);
     });
   });
   ```

   ### 副作用清理示例

   ```typescript
   describe('Component with side effects', () => {
     afterEach(() => {
       jest.restoreAllMocks();
       jest.clearAllTimers();
     });

     it('测试示例', () => {
       // 测试代码
     });
   });
   ```

   ## 维护此文档

   当进行以下变更时，请更新本文档：

   - 添加或修改测试工具
   - 变更测试策略或覆盖率要求
   - 更新测试命令
   - 添加新的测试类型或示例
   ```

   c) **DEVELOPMENT.md**（开发指南）

   ```markdown
   # 开发指南

   本文档描述项目的开发命令、工作流程和最佳实践。

   > **最后更新**: {当前日期}

   ## 开发命令

   ### 启动开发服务器

   ```bash
   {从 scripts 提取的 dev 命令}
   ```

   ### 构建和部署

   ```bash
   {从 scripts 提取的 build 命令}  # 构建生产版本
   {从 scripts 提取的 start 命令}  # 启动生产服务器（如有）
   ```

   ### 代码质量

   ```bash
   {从 scripts 提取的 lint 命令}        # 运行 Lint 检查
   {从 scripts 提取的 lint:fix 命令}    # 自动修复 Lint 问题
   {从 scripts 提取的 format 命令}      # 格式化代码（如有）
   {从 scripts 提取的 type-check 命令}  # TypeScript 类型检查
   ```

   ### 测试

   ```bash
   {从 scripts 提取的 test 命令}              # 运行全部测试
   {从 scripts 提取的 test:watch 命令}        # 监听模式（如有）
   {从 scripts 提取的 test:coverage 命令}     # 生成覆盖率报告（如有）
   ```

   ## 代码质量检查流程

   **重要**：在完成任何功能实现后，必须执行以下检查命令：

   ### 1. TypeScript 类型检查

   ```bash
   {类型检查命令}
   ```

   - 检查整个项目的类型错误
   - 必须全部通过，无类型错误

   ### 2. 代码格式化

   ```bash
   {格式化命令或 lint:fix 命令}
   ```

   **注意**：只需要验证/格式化本次修改的文件。

   ### 检查时机

   - ✅ 功能完成后立即执行
   - ✅ 提交代码之前
   - ✅ 创建 Pull Request 之前

   ## 开发工作流程

   ### 1. 开始新功能

   1. 理解需求（查阅相关文档）
   2. 按 TDD 流程实现功能
   3. 运行代码质量检查
   4. 提交代码

   ### 2. TDD 开发流程规范

   - 必须遵循红-绿-重构循环
   - 每个功能点开发前必须先编写失败的测试
   - 测试覆盖率要求：详见 `docs/TESTING.md`

   #### 实施步骤

   1. 先编写测试用例
   2. 编写最小实现使测试转绿
   3. 进行代码重构优化，保持测试全部通过
   4. 提交前确保本地全部测试通过

   #### TDD 实施示例

   {根据项目技术栈生成实际示例}

   测试（先写失败的测试）：

   ```typescript
   describe('calculateTotal', () => {
     it('计算商品总价', () => {
       const items = [{ price: 10, quantity: 2 }, { price: 5, quantity: 3 }];
       expect(calculateTotal(items)).toBe(35);
     });
   });
   ```

   最小实现（让测试通过）：

   ```typescript
   export function calculateTotal(items: Item[]): number {
     return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
   }
   ```

   ### 3. 查阅项目文档

   根据任务类型，查阅相应文档：

   | 任务类型 | 推荐文档 |
   |---------|---------|\n   {根据生成的文档列表动态生成}

   ### 4. 编码规范

   {根据项目类型提供编码规范}

   ### 5. 更新文档

   如果你的变更影响了以下内容，需要更新相应文档：

   | 变更类型 | 需要更新的文档 |
   |---------|--------------|\n   {根据生成的文档列表动态生成}

   **关键原则**：文档应与代码同步更新，作为同一提交的一部分。

   ## 常见问题

   {可以留空或提供基础的 FAQ}

   ## 维护此文档

   当进行以下变更时，请更新本文档：

   - 添加或修改开发命令
   - 变更代码质量检查流程
   - 更新编码规范
   - 修改开发工作流程
   - 添加新的常见问题
   ```

   d) **TECH_STACK.md**（技术栈文档）

   ```markdown
   # 技术栈文档

   本文档描述 {项目名称} 使用的核心技术和依赖。

   > **最后更新**: {当前日期}

   ## 核心框架

   {从 dependencies 提取核心框架，示例：}

   - **{框架名称}**: {版本号}
     - 用途：{简要说明}

   ## UI 框架

   {如果检测到 UI 框架，列出}

   - **{UI框架名称}**: {版本号}
     - 用途：UI 组件库

   ## 状态管理

   {如果检测到状态管理库，列出}

   ## 工具库

   {列出主要的工具库}

   ## 开发工具

   {从 devDependencies 提取主要开发工具}

   - **TypeScript**: {版本号}
   - **{测试框架}**: {版本号}
   - **ESLint**: {版本号}
   - **Prettier**: {版本号}（如有）

   ## 包管理器

   - **{npm/yarn/pnpm}**: {版本号}（如果能检测到）

   ## 维护此文档

   当进行以下变更时，请更新本文档：

   - 升级主要依赖版本
   - 添加或移除核心技术栈
   - 修改配置
   - 更新包管理器版本

   **关键原则**：本文档应准确反映当前使用的技术栈和版本信息。
   ```

   **实现要点**：
   - 所有文档都从实际项目分析中提取信息
   - 使用占位符 `{变量}` 标记需要动态填充的内容
   - 根据项目类型和检测结果调整文档内容
   - 确保示例代码与项目技术栈匹配

### 步骤 4.5：生成 worktree.yaml

**目标：** 生成 Worktree 环境初始化配置文件，供 `/ps-exec` 读取执行。基于步骤 1 已有的项目检测结果自动生成。

1. **生成 `copy` 字段** — 读取 `.gitignore` 文件，将被忽略的配置文件（如 `.env.local`）加入列表：
2. **生成 `post_create` 字段** — 基于步骤 1 检测到的包管理器/lock file，映射安装命令：

   | 检测到 | 命令 |
   |--------|------|
   | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` |
   | `yarn.lock` | `yarn install --frozen-lockfile` |
   | `package-lock.json` | `npm ci` |
   | `bun.lockb` | `bun install --frozen-lockfile` |
   | `package.json`（无 lock file） | `npm install` |
   | `uv.lock` | `uv sync` |
   | `poetry.lock` | `poetry install` |
   | `Pipfile.lock` | `pipenv install` |
   | `requirements.txt` | `pip install -r requirements.txt` |
   | `go.sum` / `go.mod` | `go mod download` |
   | `Cargo.lock` / `Cargo.toml` | `cargo fetch` |
   | `gradlew` | `./gradlew dependencies` |
   | `mvnw` / `pom.xml` | `mvn dependency:resolve` |
   | `Gemfile.lock` | `bundle install` |
   | `composer.lock` | `composer install` |
   | `*.sln` / `*.csproj` | `dotnet restore` |

   - 全栈项目同时匹配多种 → 全部加入列表
   - 按检测到的优先级排序

3. **生成 `verify` 字段** — 从项目配置中提取验证命令：

   **JS/TS 项目**（从 package.json scripts 提取）：
   - 有 `lint` script → `{pm} lint`
   - 有 `typecheck` 或 `type-check` script → `{pm} typecheck`（或 `{pm} type-check`）
   - 有 `test` script → `{pm} test`
   - 有 `build` script → `{pm} build`
   - `{pm}` 为步骤 1 检测到的包管理器（pnpm/yarn/npm）

   **其他语言项目**：
   - Go → `go vet ./...`, `go test ./...`
   - Rust → `cargo check`, `cargo test`
   - Python（有 pyproject.toml） → `pytest`（如检测到 pytest 依赖）
   - Java/Kotlin（Gradle） → `./gradlew check`
   - Java/Kotlin（Maven） → `mvn verify`

4. **冲突检测**：与步骤 4 其他文档相同策略：
   - 首次运行（文件不存在） → 直接生成
   - 包含生成标识 `# Generated by /ps-init` → 智能合并（保留用户自定义内容）
   - 不包含生成标识 → 询问用户是否覆盖

5. **使用 Write 工具生成 `worktree.yaml`**：

   ```yaml
   # Generated by /ps-init on {当前日期}
   # Worktree 环境初始化配置，可手动编辑

   # 需要从原项目复制到 worktree 的文件
   copy:
     - .env.local

   # worktree 创建后执行的命令（按序执行）
   post_create:
     - pnpm install --frozen-lockfile

   # 验证命令（全部返回 0 才放行）
   verify:
     - pnpm lint
     - pnpm typecheck
     - pnpm test
   ```

   **注意**：以上为示例，实际内容基于步骤 1 的检测结果动态填充。

### 步骤 5：后续指导

输出生成清单和后续建议：

```
✅ 文档初始化完成！

生成的文档：
- CLAUDE.md
- docs/ARCHITECTURE.md
- docs/TESTING.md
- docs/API.md
- worktree.yaml（Worktree 环境初始化配置）

后续建议：
1. 根据项目实际情况补充完善文档内容
2. 确保 CLAUDE.md 保持精简（<500行）
3. 详细内容放到 docs/ 目录
4. 定期检查文档是否需要更新
5. 检查 worktree.yaml 配置是否符合项目需求，可手动编辑调整
```

## 实现注意事项

- 使用 Read 工具读取文件前，先用 Glob 检查文件是否存在
- 生成文档时使用模板，确保格式统一
- Reference 索引应根据实际生成的文档动态调整
- 复杂模块检测可以基于目录名称和文件数量进行简单判断
- 所有交互都应使用 AskUserQuestion 工具，确保用户参与决策