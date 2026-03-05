# 代码审查用法（通过 codex exec -o 实现）

## 核心模式

代码审查统一通过 `codex exec -o` 实现，将 review 指令作为 prompt 传入，结果写入文件后读取。

```bash
codex exec -o review.txt "<review prompt>" --full-auto &> /dev/null
cat review.txt
```

## 审查模式

### 模式 1：未提交变更

审查当前工作区中已修改但未提交的代码。

```bash
codex exec -o review.txt "Review the uncommitted changes in this repository. Run git diff and git diff --cached to see all changes. Provide a code review covering: code quality, potential bugs, security issues, and improvement suggestions." --full-auto &> /dev/null
cat review.txt
```

适用场景：
- 提交前的最后检查
- 快速审查当前改动
- 确认没有遗漏的问题

### 模式 2：特定 commit

审查某个具体 commit 引入的变更。

```bash
codex exec -o review.txt "Review commit <sha>. Run git show <sha> to see the changes. Provide a code review covering: code quality, potential bugs, security issues, and improvement suggestions." --full-auto &> /dev/null
cat review.txt
```

示例：
```bash
codex exec -o review.txt "Review commit a1b2c3d. Run git show a1b2c3d to see the changes. Provide a code review." --full-auto &> /dev/null
cat review.txt

codex exec -o review.txt "Review commit HEAD. Run git show HEAD to see the changes. Provide a code review." --full-auto &> /dev/null
cat review.txt
```

适用场景：
- 审查刚刚提交的代码
- 回顾历史 commit 的质量
- 排查某个 commit 引入的问题

### 模式 3：分支对比

对比当前分支与基础分支之间的所有变更。

```bash
codex exec -o review.txt "Review all changes between the current branch and <base-branch>. Run git diff <base-branch>...HEAD to see the diff. Provide a code review covering: code quality, potential bugs, security issues, and improvement suggestions." --full-auto &> /dev/null
cat review.txt
```

示例：
```bash
codex exec -o review.txt "Review all changes between the current branch and main. Run git diff main...HEAD to see the diff. Provide a code review." --full-auto &> /dev/null
cat review.txt

codex exec -o review.txt "Review all changes between the current branch and develop. Run git diff develop...HEAD to see the diff. Provide a code review." --full-auto &> /dev/null
cat review.txt
```

适用场景：
- PR 提交前的完整审查
- 功能分支开发完成后的检查
- 对比 feature 分支与主干的差异

## 审查输出

Codex 的 review 通常会输出：

- **代码质量**：可读性、命名规范、代码结构
- **潜在 bug**：逻辑错误、边界情况、空值处理
- **安全问题**：注入风险、权限问题、敏感信息泄露
- **性能建议**：低效算法、不必要的计算
- **最佳实践**：是否遵循语言/框架的惯例

## 常用工作流

### PR 前审查流程

```bash
# 1. 确认当前分支
git branch

# 2. 审查与 main 的差异
codex exec -o review.txt "Review all changes between the current branch and main. Run git diff main...HEAD to see the diff. Provide a code review." --full-auto &> /dev/null
cat review.txt

# 3. 如果有未提交的改动，也一并审查
codex exec -o review.txt "Review the uncommitted changes in this repository. Run git diff and git diff --cached to see all changes. Provide a code review." --full-auto &> /dev/null
cat review.txt
```

### 提交后快速检查

```bash
git commit -m "feat: add login"
codex exec -o review.txt "Review commit HEAD. Run git show HEAD to see the changes. Provide a code review." --full-auto &> /dev/null
cat review.txt
```
