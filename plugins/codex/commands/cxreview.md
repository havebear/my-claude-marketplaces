---
name: cxreview
description: 使用 Codex CLI 对代码进行审查，支持未提交变更、特定 commit 和分支对比三种模式
argument-hint: "[uncommitted | commit <sha> | branch <feature> [--base <main>]]"
allowed-tools: ["Bash", "AskUserQuestion"]
---

# Codex Code Review

使用 Codex CLI 对代码进行深度审查。

## 执行流程

### Step 1: 确定审查模式

如果用户没有提供参数，使用 AskUserQuestion 询问审查模式：

```
请选择代码审查模式：
1. 未提交变更 - 审查当前工作区的未提交改动
2. 特定 commit - 审查某个具体的 commit
3. 分支对比 - 对比当前分支与基础分支的所有变更
```

### Step 2: 根据模式调用 Codex

**模式 1：未提交变更**
```bash
codex exec -o review.txt "Review the uncommitted changes in this repository. Run git diff and git diff --cached to see all changes. Provide a code review covering: code quality, potential bugs, security issues, and improvement suggestions." --full-auto &> /dev/null
```

**模式 2：特定 commit**
```bash
codex exec -o review.txt "Review commit <sha>. Run git show <sha> to see the changes. Provide a code review covering: code quality, potential bugs, security issues, and improvement suggestions." --full-auto &> /dev/null
```

**模式 3：分支对比**
```bash
codex exec -o review.txt "Review all changes between the current branch and <base-branch>. Run git diff <base-branch>...HEAD to see the diff. Provide a code review covering: code quality, potential bugs, security issues, and improvement suggestions." --full-auto &> /dev/null
```

### Step 3: 读取并展示审查结果

```bash
cat review.txt
```

将审查结果完整展示给用户，包括：
- 代码质量问题
- 潜在 bug
- 安全风险
- 改进建议

## 参数解析

当用户提供参数时，直接解析并执行：

- `/codex:cxreview uncommitted` → 执行模式 1（未提交变更审查）
- `/codex:cxreview commit abc123` → 执行模式 2，将 `<sha>` 替换为 `abc123`
- `/codex:cxreview branch feature/my-feature` → 执行模式 3（询问 base branch）
- `/codex:cxreview branch feature/my-feature --base develop` → 执行模式 3，将 `<base-branch>` 替换为 `develop`

## 使用示例

```
/codex:cxreview
/codex:cxreview uncommitted
/codex:cxreview commit a1b2c3d
/codex:cxreview branch feature/login --base main
```
