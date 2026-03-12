---
name: ps-exec
description: 执行 /ps-plan 创建的计划，支持分阶段执行、subAgent 协调和进度追踪
argument-hint: 可选 计划文件路径

---

# 计划执行命令

此命令用于执行 `/ps-plan` 创建的计划文件。目标不是“自己写代码”，而是**稳定编排执行、持续写回 task.md、完成全局验证和独立 review，再做收尾**。

## 使用方法

```bash
/ps-exec [可选：计划文件路径]
```

示例：

```bash
/ps-exec docs/spec/20260311-1030-user-auth.md
/ps-exec
```

## 执行铁律

1. **优先续执**：先检查 `docs/spec/*.task.md`，有 `进行中` 或 `已暂停` 的任务时，优先继续最近更新的那个。
2. **主 Agent 只负责编排与收口**：主 Agent 负责选计划、建 worktree、维护 task.md、做全局验证、发起独立 review、处理 merge/PR/暂停。
3. **`project-spec:implement` 只做局部验证**：subAgent 只能验证与当前步骤改动直接相关的 lint、typecheck、测试，不做全量验证。
4. **`ps-exec` 必做全局验证**：所有步骤完成后，主 Agent 必须运行项目级完整验证链路。
5. **失败步骤阻断后续依赖**：任一步骤失败或局部验证失败时，**不得**解锁依赖它的后续步骤；只能重试该步骤或暂停。
6. **task.md 必须实时写回**：步骤状态、全局验证记录、独立 Review 记录都要立即写回；不要批量补写。
7. **`已完成` 只能最后写**：只有全局验证通过、独立 review 结束、并且收尾动作成功或用户明确选择“标记执行完成”后，才能把 task.md 写成 `已完成`。
8. **原地执行模式不做自动 Git 收尾**：没有 worktree / branch 信息时，可以执行实现、验证、review，但**不执行自动 merge 或自动创建 PR**。
9. **后台任务必须全部等待完成**：启动 `run_in_background: true` 的 subAgent 或 Bash 后，必须对每个 `task_id` 调用 `TaskOutput(block: true)` 等待返回，**禁止在所有后台任务完成前结束当前 turn**。

---

## 标准执行主路径

### 1. 续执检查与计划定位

1. 搜索 `docs/spec/*.task.md`
2. 读取 frontmatter 中的 `status`、`updated`
3. 如果有 `进行中` 或 `已暂停` 的任务：
   - 选择最近更新的 task.md
   - 直接进入“第 4 步：批次执行步骤”
4. 如果没有未完成 task.md：
   - 如果用户传入了计划路径，直接使用
   - 否则搜索 `docs/spec/*.md`，并排除 `*.task.md`
   - 如果找到多个未开始的计划文件，使用 `AskUserQuestion` 让用户选择
   - 如果一个也没有，提示用户先运行 `/ps-plan`

### 2. 确定执行目录

目标：优先在隔离 worktree 中执行；无法使用 Git 时，允许降级到原地执行模式。

#### 2.1 已有 worktree 的续执

- 如果续执的 task.md frontmatter 里已有 `worktree`，直接复用该 worktree
- 如果 `worktree` 为空，说明之前就是原地执行模式，本次继续在当前项目目录执行

#### 2.2 新任务的 worktree 判定

1. 运行：

```bash
git rev-parse --is-inside-work-tree
```

2. 如果 Git 可用：
   - 记录当前分支：

```bash
git branch --show-current
```

   - 用 `git rev-parse --show-toplevel` 获取项目根目录
   - 分支名：`feature/<计划文件名去掉 .md>`
   - worktree 路径：`<项目根目录同级>/<项目目录名>-<计划文件名去掉 .md>`
   - 创建 worktree：

```bash
git worktree add "<WORKTREE_PATH>" -b "<BRANCH_NAME>"
```

   - 如果分支已存在，重试：

```bash
git worktree add "<WORKTREE_PATH>" "<BRANCH_NAME>"
```

   - 创建后运行：

```bash
git worktree list
```

3. 如果 Git 不可用或 worktree 创建失败：
   - 使用 `AskUserQuestion` 询问：继续执行 / 中止执行
   - 用户选择继续时，进入**原地执行模式**
   - 原地执行模式下 `branch`、`worktree`、`base_branch` 留空

#### 2.3 worktree 初始化

仅在**首次创建 worktree**时执行：

- 有 `worktree.yaml`：执行 `copy` 和 `post_create`
- 没有 `worktree.yaml`：按项目类型完成最小必要初始化
- `post_create` 默认超时 `600000ms`
- 任一命令失败时，使用 `AskUserQuestion` 询问：继续执行 / 中止执行

### 3. 初始化或读取 task.md

如果是新任务，创建与计划文件同目录的 `.task.md` 文件。

来源计划最少读取：

- `## 5. 执行步骤`
- `### 步骤依赖`
- `## 8. 注意事项`

task.md 至少包含以下结构：

```markdown
---
source: [计划文件路径]
status: 进行中
created: [当前时间]
updated: [当前时间]
branch: [分支名；原地执行模式留空]
worktree: [worktree 绝对路径；原地执行模式留空]
base_branch: [基础分支；原地执行模式留空]
---

# 任务执行：[任务名称]

## 📋 概览

| 项目 | 值 |
|------|-----|
| 来源计划 | [计划文件名] |
| 总任务数 | [N] |
| 已完成 | 0/[N] |

## 📝 TODO 列表

### 步骤 1：[步骤名称]

| 状态 | 编号 | 任务 | 文件 |
|------|------|------|------|
| ⏳ | 1.1 | [任务描述] | `path/to/file` |

## 📊 统计

| 指标 | 值 |
|------|-----|
| 开始时间 | [当前时间] |
| 当前耗时 | 0min |
| subAgent 次数 | 0 |

## ✅ 全局验证记录

- 状态：待执行
- 执行目录：-
- 执行命令：-
- 结果摘要：-

## 🧾 独立 Review 记录

- 状态：待执行
- Review 方式：-
- 结果摘要：-
- 后续动作：-
```

状态标记：

- `⏳` 待执行
- `🔄` 执行中
- `✅` 已完成
- `❌` 失败

### 4. 批次执行步骤

#### 4.1 启动当前批次

当前批次 = 所有前置依赖都已满足的步骤。

**同一批次的所有步骤必须在同一个响应里同时启动 subAgent。**

使用 `project-spec:implement` subAgent，传入：

- 计划文件绝对路径
- task.md 绝对路径
- worktree 路径（如有）
- 当前分支（如有）
- 当前步骤内所有任务描述和文件路径
- 一条明确要求：**只做与本步骤改动直接相关的局部验证，并写清验证范围**

示例：

```text
Agent(
  subagent_type: "project-spec:implement",
  description: "执行步骤N：[步骤名称]",
  prompt: "
    计划文件：[plan.md 绝对路径]
    任务文件：[task.md 绝对路径]
    worktree 路径：[worktree 绝对路径，如有]
    当前分支：[分支名，如有]

    请执行以下步骤的任务：
    [步骤内所有任务的描述和文件路径]

    只运行与本步骤改动直接相关的局部验证，并在结果中写明验证范围。
  ",
  run_in_background: true
)
```

- 启动后把步骤状态更新为 `🔄`
- 记录当前批次全部 `task_id`

#### 4.2 等待并汇总当前批次

对当前批次的每个 `task_id` 依次调用：

```text
TaskOutput(task_id: "<task_id>", block: true, timeout: 600000)
```

⚠️ **严格要求：必须对当前批次每个 `task_id` 都调用 `TaskOutput(block: true)`，全部返回后才能继续。禁止在所有 `TaskOutput` 返回前结束当前 turn 或输出任何收尾文字。**

#### 4.3 批次门禁

读取结果后：

1. 更新任务状态
2. 检查局部验证结果
3. 汇总失败原因并写回 task.md

**门禁清单：**

- 当前批次所有步骤都成功了吗？
- 局部验证都通过了吗？
- 失败原因都写回 task.md 了吗？

如果全部通过：

- 解锁下一批步骤
- 重复第 4 步直到所有步骤完成

如果任一步骤失败：

- **不得**解锁依赖它的后续步骤
- 使用 `AskUserQuestion` 询问：重试失败步骤 / 暂停执行
- 选择重试时，只重跑失败步骤
- 选择暂停时，把 task.md 状态写为 `已暂停`

### 5. 全局验证

**重复提醒：这里是项目级完整验证，不是 subAgent 的局部验证。**

#### 5.1 确定验证命令

**这是全局验证入口，不能沿用 subAgent 的局部验证思路。**

1. 如果 `worktree.yaml` 存在且包含 `verify`：
   - 直接执行 `verify` 列表中的所有命令
2. 否则，按项目入口推断全局验证命令，至少检查：
   - `package.json`
   - `pyproject.toml`
   - `Cargo.toml`
   - `go.mod`
   - `Makefile`
3. 如果仍无法推断出可靠命令：
   - 明确告知用户
   - 使用 `AskUserQuestion` 询问：提供验证命令 / 跳过全局验证

#### 5.2 运行全局验证

**不要跳过这一步。只要步骤执行完了，主 Agent 就必须亲自做全局验证。**

在 `<WORKTREE_PATH>` 或当前项目目录中运行完整验证链路：

- 不能只跑单一步骤相关子集
- 所有命令返回 0 才算通过
- 有人工验证项时，给出待验证列表

#### 5.3 写回 `## ✅ 全局验证记录`

全局验证结束后，**必须立即**更新 task.md 中的 `## ✅ 全局验证记录`：

- 状态：通过 / 失败 / 已跳过
- 执行目录：`<WORKTREE_PATH>` 或当前项目目录
- 执行命令：按实际顺序逐条列出
- 结果摘要：记录各命令结果和关键错误
- 手动验证项：记录已完成项或待办项

如果全局验证失败：

- 先写回失败记录
- 再决定是否进入修复
- **此时不要写 `已完成`**

#### 5.4 全局验证门禁

**门禁清单：**

- 是否已经写入 `## ✅ 全局验证记录`？
- 是否已经确认这是全量验证而不是局部验证？
- 全局验证失败时，是否阻止了 `已完成` 状态？

### 6. 独立 Review

**重复提醒：Review 必须独立执行；主 Agent 不直接评判自己的实现质量。**

#### 6.1 启动独立 Review

**Review 提示词里必须显式包含 plan 文件路径和 task 文件路径，否则视为不合格 review。**

1. 如果安装了 `codex`：

```bash
codex --version
```

   - 优先使用 `codex exec`
   - 在**本次执行目录**下写入临时输出文件，例如 `tmp/codex-review.txt`
   - **提示词里必须显式包含 plan 文件路径和 task 文件路径**
   - 完整示例：

```bash
mkdir -p tmp
REVIEW_FILE="tmp/codex-review.txt"
codex exec -o "$REVIEW_FILE" "
你是一个独立的代码审查员，请 review 本次计划执行结果。

计划文件：<plan.md 绝对路径>
任务文件：<task.md 绝对路径>
执行目录：<本次执行目录绝对路径；有 worktree 时为 worktree，无 worktree 时为当前项目目录>

请按以下顺序执行：
1. 读取计划文件，确认预期目标、执行步骤、验收要求。
2. 读取任务文件，确认实际完成状态、全局验证记录、独立 Review 记录。
3. 在执行目录中查看代码变更：
   - git status
   - git diff HEAD
4. 评估：
   - 计划是否完整落地
   - 代码是否有明显缺陷或遗漏
   - 全局验证是否充分且结果可信
   - 文档是否需要同步
   - 是否存在冗余代码
5. 输出 review 报告：
   - 总体评估（通过 / 有问题需修改）
   - 主要问题列表（带文件路径和行号，如有）
   - 是否需要修复
" --full-auto
```

2. 如果 `codex` 不可用：
   - 如果环境支持**不继承主 Agent 上下文**的独立 review subAgent，则使用该 subAgent
   - 如果环境不支持，则使用 `AskUserQuestion` 询问：暂停等待人工 review / 跳过独立 review

独立 subAgent 示例：

```text
Agent(
  subagent_type: "[环境支持的独立 review Agent 类型]",
  description: "独立Review：计划与实现对比",
  prompt: "[PROMPT]"
)
```

独立 review subAgent 的提示词也必须至少包含：

- plan 文件绝对路径
- task 文件绝对路径
- 执行目录绝对路径
- 计划完成性、代码质量、全局验证、文档同步、冗余代码这 5 类检查点

#### 6.2 写回 `## 🧾 独立 Review 记录`

**拿到 review 结果后立刻写回，不要等到收尾阶段再补。**

拿到 review 结果后，**必须立即**更新 task.md 中的 `## 🧾 独立 Review 记录`：

- 状态：通过 / 有问题需修复 / 已跳过 / 无法执行
- Review 方式：`codex` / 独立 review subAgent / 人工 review
- 结果摘要：核心结论和主要问题
- 后续动作：自动修复 / 人工确认 / 无需处理

#### 6.3 Review 后的分流

如果 review 通过：

- 直接进入“第 7 步：收尾”

如果 review 发现问题：

- 提取问题列表
- 必要时启动 `project-spec:implement` subAgent 修复
- 修复后必须重新执行第 5 步全局验证和第 6 步独立 Review
- 并刷新 `## ✅ 全局验证记录` 与 `## 🧾 独立 Review 记录`

如果主 Agent 判断 review 意见不正确：

- 必须有明确代码或验证证据
- 必须把跳过理由写入 `## 🧾 独立 Review 记录`
- 如果无法证明，则暂停并询问用户

#### 6.4 Review 门禁

**门禁清单：**

- 是否已经写入 `## 🧾 独立 Review 记录`？
- review 有问题时，是否重新跑了全局验证？
- 没有独立 review 结果时，是否阻止了 `已完成` 状态？

### 7. 收尾与状态写回

#### 7.1 询问下一步

**只有在全局验证和独立 review 都落账后，才能进入这一步。**

有 worktree / 分支信息时：`合并到基础分支 / 创建 Pull Request / 暂不处理`

原地执行模式时：`标记本次执行完成 / 暂停处理`

#### 7.2 执行收尾动作

**这里是收尾，不是补验证或补 review 的地方。前置门禁没过时，不得继续。**

有 worktree / 分支信息时：

- 合并到基础分支：
  - 在原项目根目录切换到 `<BASE_BRANCH>`
  - 执行 `git merge --no-ff "<BRANCH_NAME>" -m "feat: merge <BRANCH_NAME>"`
  - 成功后把 task.md 写为 `已完成`
- 创建 Pull Request：
  - 在 `<WORKTREE_PATH>` 下执行 `git push -u origin "<BRANCH_NAME>"`
  - 执行 `gh pr create ...`
  - 成功后把 task.md 写为 `已完成`
- 暂不处理：
  - task.md 写为 `已暂停`

原地执行模式时：

- 标记执行完成：
  - 不执行 merge / push / PR
  - task.md 写为 `已完成`
  - 明确告知用户当前目录仍保留本地改动
- 暂停处理：
  - task.md 写为 `已暂停`

#### 7.3 最终门禁

**写 `已完成` 前必须再次确认：**

- 全局验证已经通过或被用户明确允许跳过
- 独立 review 已完成或被用户明确允许跳过
- `## ✅ 全局验证记录` 已更新
- `## 🧾 独立 Review 记录` 已更新
- 当前收尾动作已经成功，或用户明确选择“标记执行完成”

---

## 附录：异常与降级处理

### A. 计划文件不存在

- 提示用户先运行 `/ps-plan` 或指定正确路径

### B. Git 不可用

处理规则：

- 可询问用户是否继续
- 用户继续时进入原地执行模式
- 原地执行模式下**不执行自动 merge / PR**

### C. worktree 创建失败

处理顺序：

1. 如果是分支已存在，先重试不带 `-b`
2. 仍失败时，询问：继续原地执行 / 中止执行

### D. 全局验证失败

处理规则：

- 先写 `## ✅ 全局验证记录`
- 再决定是否修复
- 没修复前**不得**写 `已完成`

### E. 独立 Review 无法执行

处理规则：

- 询问：暂停等待人工 review / 跳过独立 review
- 如果跳过，必须把原因写入 `## 🧾 独立 Review 记录`
- 没有记录就**不得**收尾

### F. PR 或 merge 失败

处理规则：

- 保留当前 worktree / 分支
- 把 task.md 写为 `已暂停`
- 输出失败原因和建议的人工处理方式

---

## 注意事项

1. 主路径优先，附录兜底；不要在正常流程里反复展开软件工程常识。
2. 只详细写本命令特有规则、状态机、task.md 契约和容易忽略的门禁。
3. 不要在 task.md 中只写结论；要写清验证命令、review 方式、失败原因和后续动作。
