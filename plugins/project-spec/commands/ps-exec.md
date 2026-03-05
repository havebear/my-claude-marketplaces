---
name: ps-exec
description: 执行 /ps-plan 创建的计划，支持分阶段执行、subAgent 协调和进度追踪
argument-hint: 可选 计划文件路径

---

# 计划执行命令

此命令用于执行 `/ps-plan` 创建的计划文档，支持智能分阶段执行、subAgent 协调和进度追踪。

## 使用方法

```bash
/ps-exec [可选：计划文件路径]
```

**示例：**
```bash
/ps-exec docs/spec/user-auth-20251229.md
/ps-exec  # 自动选择最新的计划文件或继续未完成任务
```

## 核心功能

- **分离 task.md 文件** - 执行记录独立存储，不修改原始计划文件
- **优先续执未完成任务** - 自动检测并优先继续最近未完成的任务
- **TODO 列表驱动** - task.md 是带执行时序的 TODO 列表，可直接续执
- **主 Agent 持续执行** - 主 Agent 始终有任务在执行，不停下来等待
- **subAgent 并行加速** - 简单独立任务启动 subAgent 后台执行，主 Agent 立即继续下一任务
- **智能执行顺序** - 优化任务顺序，让耗时独立任务提前执行，最大化并行效果
- **多层验证** - 实时验证 + 阶段验证 + 最终验证
- **自动修复** - 验证失败时尝试自动修复

---

## 执行指令

当此命令被调用时，按照以下流程执行：

### 第一步：检查未完成任务

**优先检查是否有未完成的任务文件：**

1. 使用 Glob 工具搜索 `docs/spec/*.task.md` 文件
2. 读取每个 task.md 文件的 frontmatter，提取 `status` 和 `updated` 字段
3. 筛选 `status` 为 `进行中` 或 `已暂停` 的文件
4. 按 `updated` 时间降序排序（最近更新的优先）
5. 如果找到未完成任务：
   - 显示未完成任务信息（任务名称、来源计划、进度、最后更新时间）
   - 自动选择最近更新的任务继续执行
   - 如果 task.md frontmatter 中已有 `worktree` 字段，跳过第二步半（Worktree 已存在）
   - 跳转到**第四步：执行任务**（直接按 TODO 列表执行，无需重新分析）
6. 如果没有未完成任务，进入第二步

**frontmatter 解析格式：**
```yaml
---
source: docs/spec/xxx.md
status: 进行中 | 已完成 | 已暂停
created: 2025-01-03T10:00:00
updated: 2025-01-03T12:30:00
branch: feature/user-auth-20251229
worktree: /absolute/path/to/project-feature-user-auth-20251229
base_branch: main
---
```

### 第二步：定位计划文件

1. 如果用户提供了计划文件路径，直接使用该路径
2. 如果没有提供，使用 Glob 工具搜索 `docs/spec/*.md` 文件
3. **排除 `*.task.md` 文件**（这些是执行文件，不是计划文件）
4. 如果找到多个计划文件，使用 AskUserQuestion 让用户选择
5. 如果没有找到计划文件，提示用户先运行 `/ps-plan` 创建计划

### 第二步半：Worktree 创建流程

**目标：为本次执行创建隔离的 Git Worktree，避免直接修改主分支。**

#### 2.5.1 前置检查

1. **续执跳过**：如果第一步检测到未完成任务且 task.md frontmatter 中已有 `worktree` 字段，
   跳过本步，直接进入第三步。

2. **Git 环境检查**：
   ```bash
   git rev-parse --is-inside-work-tree
   ```
   - 检查失败（非 git 仓库或 git 不可用）→ 使用 AskUserQuestion 询问用户：
     - 继续执行（跳过 worktree，直接在当前目录修改文件）
     - 中止执行
   - 如果用户选择继续：跳过 2.5.2 ~ 2.5.4，task.md 中 worktree 相关字段留空

3. **记录当前分支**（作为 base_branch）：
   ```bash
   git branch --show-current
   ```

#### 2.5.2 生成分支名和 Worktree 路径

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PROJECT_DIR=$(basename "$PROJECT_ROOT")
# PLAN_BASENAME = 计划文件名去除扩展名，例如 user-auth-20251229
BRANCH_NAME="feature/${PLAN_BASENAME}"
WORKTREE_PATH="${PROJECT_ROOT}/../${PROJECT_DIR}-${PLAN_BASENAME}"
```

- **分支名格式**：`feature/<计划文件名去除扩展名>`
- **Worktree 路径**：与项目目录同级，名称为 `<项目目录名>-<计划文件名>`

#### 2.5.3 创建 Worktree

```bash
git worktree add "${WORKTREE_PATH}" -b "${BRANCH_NAME}"
```

**失败处理：**
- 分支名已存在 → 自动重试（不带 -b）：`git worktree add "${WORKTREE_PATH}" "${BRANCH_NAME}"`
- 其他失败 → 使用 AskUserQuestion 询问：跳过 worktree 继续 / 中止执行

**验证：**
```bash
git worktree list
```

#### 2.5.3.5 Worktree 环境初始化

**目标：在新创建的 Worktree 中安装依赖和配置环境，确保代码可构建、可测试。**

**⚠️ 此步骤仅在首次创建 Worktree 时执行。续执场景（第一步检测到已有 worktree）自动跳过。**

##### 1. 读取 worktree.yaml

在 `${PROJECT_ROOT}` 下检测 `worktree.yaml` 文件：

- **存在** → 读取并按配置执行下述步骤 2~3
- **不存在** → 手动分析项目类型并执行初始化

##### 2. 执行 copy

将 `worktree.yaml` 中 `copy` 列表的文件从 `${PROJECT_ROOT}` 复制到 `${WORKTREE_PATH}`：

```bash
# 逐项复制，文件不存在则静默跳过
for file in <copy 列表>; do
  [ -f "${PROJECT_ROOT}/${file}" ] && cp "${PROJECT_ROOT}/${file}" "${WORKTREE_PATH}/"
done
```

##### 3. 执行 post_create

在 `${WORKTREE_PATH}` 下按序执行 `post_create` 列表中的命令：

```bash
cd "${WORKTREE_PATH}"
# 按序执行每条命令，timeout: 600000（10分钟）
```

- 命令失败 → 使用 AskUserQuestion 询问用户：继续执行 / 中止执行

#### 2.5.4 暂存信息供第三步写入

将以下变量暂存到执行上下文，第三步创建 task.md 时写入 frontmatter：
- `BRANCH_NAME`
- `WORKTREE_PATH`（绝对路径）
- `BASE_BRANCH`（当前分支名）

### 第三步：创建 task.md 文件（生成 TODO 列表）

**从计划文件创建对应的任务执行文件：**

1. **确定文件名**：将计划文件名的 `.md` 替换为 `.task.md`
   - 例如：`user-auth-20251229.md` → `user-auth-20251229.task.md`
2. **确定存储位置**：与计划文件同目录（docs/spec/）
3. **读取计划文件**，提取以下信息：
   - 任务名称（从标题提取）
   - 执行步骤（从"## 方案 > ### 执行步骤"章节提取）
   - 注意事项（从"### 注意事项"章节提取）
4. **解析步骤依赖，生成 TODO 列表**：
   - 解析"### 步骤依赖"章节，建立步骤依赖图（哪些步骤可并行，哪些需等待）
   - 解析所有步骤和任务，按步骤依赖顺序排列
5. **创建 task.md 文件**（TODO 列表格式）

**步骤依赖解析：**
- 读取"### 步骤依赖"章节的表格
- 依赖为 `-` 的步骤：无前置依赖，可与其他无依赖步骤并行执行
- 依赖为步骤名的步骤：必须等列出的步骤全部完成后才能开始
- 步骤内部的任务始终顺序执行


**task.md 模板：**
```markdown
---
source: [计划文件路径]
status: 进行中
created: [当前时间]
updated: [当前时间]
branch: [分支名，如 feature/user-auth-20251229；无 worktree 则留空]
worktree: [worktree 绝对路径；无 worktree 则留空]
base_branch: [基础分支名，如 main；无 worktree 则留空]
---

# 任务执行：[任务名称]

## 📋 概览

| 项目 | 值 |
|------|-----|
| 来源计划 | [计划文件名] |
| 总任务数 | [N] |
| 已完成 | 0/[N] |

---

## 📝 TODO 列表

### 步骤 1：[步骤名称]

| 状态 | 编号 | 任务 | 文件 | 执行方式 |
|------|------|------|------|----------|
| ⏳ | 1.1 | [任务描述] | `path/to/file` | 待分配 |
| ⏳ | 1.2 | [任务描述] | `path/to/file` | 待分配 |
| ⏳ | 1.3 | [任务描述] | `path/to/file` | 待分配 |

---

### 步骤 2：[步骤名称]（依赖：步骤 1）

| 状态 | 编号 | 任务 | 文件 | 执行方式 |
|------|------|------|------|----------|
| ⏳ | 2.1 | [任务描述] | `path/to/file` | 待分配 |
| ⏳ | 2.2 | [任务描述] | `path/to/file` | 待分配 |

---

## 📊 统计

| 指标 | 值 |
|------|-----|
| 开始时间 | [当前时间] |
| 当前耗时 | 0min |
| subAgent 次数 | 0 |
```

**状态标记：**
- ⏳ 待执行
- 🔄 执行中
- ✅ 已完成
- ❌ 失败

### 第四步：执行任务

**核心原则：所有前置依赖已完成的步骤，同时并行执行。**

#### 4.1 执行规则

1. 从 task.md 读取步骤依赖图
2. 找出所有前置依赖已完成（或无依赖）的步骤，作为当前批次
3. 当前批次的步骤同时执行：
   - 主 Agent 执行其中一个步骤（顺序执行步骤内的任务）
   - 其余步骤各启动一个 implement subAgent 后台执行
   - 只有一个可执行步骤时，主 Agent 直接执行
4. 当前批次全部完成后，重新检查依赖图，找出下一批可执行步骤
5. 重复直到所有步骤完成

#### 4.2 主 Agent 执行流程

1. 更新 task.md：任务状态 → 🔄，执行方式 → 主Agent
2. 读取相关文件，执行修改
3. 每个任务完成后立即更新 task.md：状态 → ✅

#### 4.3 subAgent 执行流程

使用 Task tool 启动 implement agent（后台运行），传入以下参数：

- **计划文件路径**（plan.md 的绝对路径）
- **任务文件路径**（task.md 的绝对路径）
- 步骤内所有任务的描述和文件路径
- worktree 路径（如有）
- 当前分支名（如有）

**关键：同一批次的所有 subAgent 必须在单个响应中同时启动。**

```
Task tool:
- subagent_type: "implement"
- description: "执行步骤 N：[步骤名称]"
- prompt: |
    计划文件：[plan.md 绝对路径]
    任务文件：[task.md 绝对路径]
    worktree 路径：[worktree 绝对路径，如有]
    当前分支：[分支名，如有]

    请执行以下步骤的任务：
    [步骤内所有任务的描述和文件路径]
- run_in_background: true
```

启动后：
- 更新 task.md：该步骤所有任务状态 → 🔄，执行方式 → subAgent
- 主 Agent 立即继续执行自己负责的步骤，不等待

#### 4.4 subAgent 状态检查

- 主 Agent 每完成一个步骤后，非阻塞检查（TaskOutput block=false）所有运行中的 subAgent
- subAgent 完成后立即更新 task.md 对应任务状态（✅ 或 ❌）
- 当没有可执行步骤且有 subAgent 运行中时，阻塞等待所有 subAgent 完成（超时 10 分钟）

### 第五步：验证与完成

#### 5.1 最终验证

所有阶段完成后：

1. **确定验证命令**：
   - 如果 `worktree.yaml` 存在且有 `verify` 字段 → 执行 `verify` 列表中的所有命令
   - 否则 → AI 自动推断：检测 package.json scripts 中的 lint/typecheck/test/build 命令并执行

2. **运行验证**：
   - 在 `${WORKTREE_PATH}`（或当前目录）下按序执行验证命令
   - 所有命令返回 0 才算验证通过

3. **生成验证报告**（输出到控制台）：
```
✅ Lint 检查：通过
✅ 类型检查：通过
✅ 单元测试：通过 (X/Y)
✅ 构建：成功
```

4. **手动验证指导**（如果需要）：
```
请手动验证以下功能：
- [ ] 功能 A 正常工作
- [ ] 功能 B 正常工作
```

#### 5.2 更新 task.md 最终状态

```markdown
---
source: [计划文件路径]
status: 已完成
created: [创建时间]
updated: [当前时间]
---
```


---

### 第六步：独立 Review 流程

**核心原则：Review 必须在独立上下文中执行——主 Agent 不参与质量评判。**

#### 6.1 检测外部 Review CLI

按顺序检测是否安装以下工具：
```bash
which codex 2>/dev/null && echo "codex available"
```

#### 6.2 启动独立 Review

如过已经安装 codex，那么**必须使用 codex** 进行代码 review

```bash
mkdir -p tmp
REVIEW="tmp/codex-review-$RANDOM.txt"
codex exec -o "$REVIEW" "[PROMPT]" --full-auto &> /dev/null
cat "$REVIEW"
```

未安装 codex，使用独立 subAgent

启动一个全新的 general-purpose subAgent（不携带主 Agent 上下文）：
```
Task tool:
- subagent_type: "general-purpose"
- description: "独立 Review：计划与实现对比"
- prompt: [PROMPT]
```

Review 提示词(PROMPT)示例：
```markdown
你是一个独立的代码审查员，请对以下任务的实现进行 review。

    **步骤1：读取计划文件**
    文件路径：<计划文件绝对路径>
    了解预期要实现的功能和步骤

    **步骤2：读取执行记录**
    文件路径：<task.md 绝对路径>
    了解实际执行情况（✅/❌ 统计）

    **步骤3：查看代码变更**
    在目录 <worktree绝对路径> 中使用 git 命令查看变更内容：
    git status
    git diff HEAD

    **步骤4：评估以下维度**
    a. 计划完整性：计划中的所有任务是否都已实现？有无遗漏？
    b. 实现质量：代码是否清晰、有无明显问题、边界情况处理？
    c. 验证状态：lint/类型检查/测试是否全部通过？
    d. 文档同步：代码变更涉及的相关文档是否已同步更新？
    e. 代码整洁：是否存在冗余代码、未使用的变量/导入/文件？

    **步骤5：输出 review 报告**
    - 总体评估（通过 / 有问题需修改）
    - 计划完成情况（已实现 / 遗漏的功能点）
    - 代码质量问题（如有，附具体文件和行号）
    - 文档同步状态（已更新 / 缺失的文档）
    - 冗余代码（未清理的残留代码）
    - 改进建议（如有）
```

#### 6.3 展示 Review 结果并询问用户

主 Agent 展示 review 报告后，使用 AskUserQuestion 询问下一步：
- A. 合并到基础分支
- B. 创建 Pull Request
- C. 先修复问题（标记任务为待修复，保留 worktree）
- D. 暂不处理（保留 worktree，更新 task.md status = 已暂停）

#### 6.4 执行用户选择

**选项 A：合并到基础分支**
```bash
git checkout "${BASE_BRANCH}"
git merge --no-ff "${BRANCH_NAME}" -m "feat: merge ${BRANCH_NAME}"
# 合并冲突 → 进入错误处理
```

**选项 B：创建 Pull Request**
```bash
cd "${WORKTREE_PATH}"
git push -u origin "${BRANCH_NAME}"
gh pr create \
  --title "[任务名称]" \
  --body "$(cat << 'EOF'
## 变更说明
[来自 review 报告的摘要]

## 计划完成情况
[来自 task.md 的统计]
EOF
)" \
  --base "${BASE_BRANCH}" \
  --head "${BRANCH_NAME}"
```

**选项 C：先修复问题**
提示用户：修复完成后再次运行 /ps-exec 续执，或手动修复后运行 /ps-exec 重新触发 review

**选项 D：暂不处理**
更新 task.md 状态为"已暂停"，告知用户 worktree 路径和分支名

---

## 错误处理

### 计划文件不存在
```
❌ 找不到计划文件：[路径]

请先运行 /ps-plan 创建计划，或指定正确的计划文件路径。

可用的计划文件：
- docs/spec/xxx.md
- docs/spec/yyy.md
```

### 验证失败
```
⚠️ 验证失败：[错误类型]

错误信息：
[详细错误信息]

尝试自动修复...
[修复结果]

如果问题持续，请手动检查以下文件：
- [文件列表]
```

### subAgent 执行失败
```
❌ subAgent 执行失败

任务：[任务描述]
错误信息：
[错误详情]

建议操作：
1. 检查错误信息
2. 手动修复问题
3. 运行 /ps-exec 继续执行
```

### Git 不可用
```
⚠️ Git 环境检查失败

当前目录不是 Git 仓库，或 Git 未安装。

选项：
- 继续执行（跳过 Worktree 隔离，直接在当前目录修改文件）
- 中止执行
```

### Worktree 创建失败
```
⚠️ Worktree 创建失败

错误信息：
[详细错误信息]

自动重试中...（分支可能已存在，尝试不带 -b 参数）

如果重试失败：
- 跳过 Worktree，直接在当前目录执行
- 中止执行
```

### PR 创建失败
```
❌ Pull Request 创建失败

错误信息：
[详细错误信息]

请手动操作：
1. 检查 GitHub 认证状态：gh auth status
2. 确认远程仓库可访问：git remote -v
3. 手动推送分支：git push -u origin [分支名]
4. 在浏览器中创建 PR：访问仓库页面
```

### 合并冲突
```
❌ 合并冲突

冲突文件：
[冲突文件列表]

解决步骤：
1. 手动解决冲突文件
2. git add [已解决的文件]
3. git merge --continue

或中止合并：
git merge --abort
```

---

## 注意事项

1. **优先续执未完成任务**：
   - 命令启动时首先检查是否有未完成的 task.md 文件
   - 按更新时间排序，自动选择最近的任务继续执行
   - 续执时直接按 TODO 列表执行，无需重新分析

2. **task.md 是 TODO 列表**：
   - task.md 是带执行时序的 TODO 列表，不是分析文档
   - 包含：任务编号、描述、文件、执行方式、状态
   - 标记并行组，方便直接执行

3. **分离 task.md 文件**：
   - 执行记录独立存储在 task.md 文件中
   - 原始计划文件（plan.md）保持只读
   - task.md 与 plan.md 同目录，命名格式：`{plan-name}.task.md`

4. **断点续执**：
   - 如果执行中断，可以从上次中断处继续
   - 执行状态保存在 task.md 文件中
   - 下次运行 /ps-exec 时自动检测并续执
   - 找到第一个 ⏳ 状态的任务继续执行

5. **实时更新 task.md**：
   - 每个任务完成后必须立即更新 task.md 文档
   - 不要批量更新，不要延迟更新
   - 更新包括：任务状态、执行方式、已完成计数、时间戳
   - 实时更新是断点续执和进度追踪的基础

6. **Worktree 隔离原则**：
   - task.md 始终存储在原始项目的 `docs/spec/` 目录，不在 worktree 中
   - 代码修改在 worktree 中进行，与主分支隔离
   - worktree 路径和分支名记录在 task.md frontmatter 中

7. **续执时的 Worktree 处理**：
   - 检测 task.md frontmatter 中的 `worktree` 字段
   - 如果已有值，说明 worktree 已存在，跳过第二步半
   - 如果为空，说明是无 worktree 降级模式，继续在当前目录执行

8. **Review 独立性要求**：
   - Review 必须在独立 subAgent 或外部 CLI 中执行
   - 主 Agent 不直接评判自己的实现质量
   - Review 结果由独立上下文生成，确保客观性

9. **分支名规范**：
   - 格式：`feature/<计划文件名去除扩展名>`
   - 计划文件名中的特殊字符（空格、中文等）替换为连字符
   - 示例：`feature/user-auth-20251229`

10. **Worktree 环境初始化**：
    - 优先读取项目根目录的 `worktree.yaml` 配置文件驱动初始化
    - `worktree.yaml` 由 `/ps-init` 自动生成，用户可手动编辑定制
    - 续执时不重新初始化（Worktree 已存在 = 环境已初始化）
    - 如需重新初始化环境，删除 Worktree 后重新运行 /ps-exec
    - 依赖安装使用较长超时（10分钟），大型项目安装耗时较长
