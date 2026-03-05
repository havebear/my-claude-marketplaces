# codex exec 详细用法

## 命令格式

```bash
codex exec "<prompt>" [options]
```

## 常用选项

| 选项 | 说明 |
|------|------|
| `--full-auto` | 全自动模式，无需确认直接执行 |
| `-o <file>` / `--output-last-message <file>` | 将最终结果写入指定文件（推荐用于自动化场景） |
| `--model <model>` | 指定使用的模型（默认 o4-mini） |

> **说明**：`codex exec` 默认将进度信息输出到 stderr，最终消息输出到 stdout。使用 `-o` 可以将最终消息直接写入文件，配合 `&> /dev/null` 可以完全静默执行。

## 使用场景

### Debug 代码错误

```bash
codex exec -o result.txt "以下代码报错 TypeError: xxx。
代码：
\`\`\`javascript
// 粘贴相关代码
\`\`\`
请分析原因并提供修复方案。" --full-auto &> /dev/null
cat result.txt
```

### 分析代码逻辑

```bash
codex exec -o result.txt "分析这段代码的时间复杂度，并建议优化方案：
\`\`\`python
# 粘贴代码
\`\`\`" --full-auto &> /dev/null
cat result.txt
```

### 解释错误信息

```bash
codex exec -o result.txt "解释这个错误信息的含义和解决方法：
ECONNREFUSED 127.0.0.1:5432" --full-auto &> /dev/null
cat result.txt
```

## Prompt 编写技巧

好的 debug prompt 应包含：

1. **问题描述**：发生了什么，期望什么
2. **错误信息**：完整的错误消息和堆栈跟踪
3. **相关代码**：触发问题的代码片段
4. **环境信息**：语言版本、框架版本（如有必要）

### 示例模板

```
问题：[简短描述问题]

错误信息：
[粘贴完整错误]

相关代码：
\`\`\`[语言]
[粘贴代码]
\`\`\`

期望行为：[描述期望的正确行为]

请分析原因并提供修复方案。
```
