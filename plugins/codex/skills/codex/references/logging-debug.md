# Codex CLI 日志与调试

## 日志文件位置

Codex CLI 会自动记录所有执行日志：

- **默认日志路径**：`~/.codex/log/codex-tui.log`
- **会话存储路径**：`~/.codex/sessions/`

## 查看日志

### 实时监控日志

```bash
# 实时查看日志输出
tail -F ~/.codex/log/codex-tui.log

# 只看最近 100 行
tail -n 100 ~/.codex/log/codex-tui.log

# 搜索特定关键词
grep "error" ~/.codex/log/codex-tui.log
```

### 自定义日志目录

```bash
# 将日志输出到当前目录
codex exec "<prompt>" -c log_dir=./.codex-log
```

## 控制日志级别

使用 `RUST_LOG` 环境变量控制日志详细程度：

```bash
# 启用 debug 级别日志
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
RUST_LOG=debug codex exec -o "$RESULT" "<prompt>" --full-auto &> /dev/null

# 只看特定模块的日志
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
RUST_LOG=codex_core=debug codex exec -o "$RESULT" "<prompt>" --full-auto &> /dev/null

# 多模块日志
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
RUST_LOG=codex_core=info,codex_tui=debug codex exec -o "$RESULT" "<prompt>" --full-auto &> /dev/null
```

### 日志级别说明

| 级别 | 说明 | 适用场景 |
|------|------|----------|
| `error` | 只显示错误 | 生产环境 |
| `warn` | 显示警告和错误 | 一般使用 |
| `info` | 显示信息、警告、错误（默认） | 日常开发 |
| `debug` | 显示调试信息 | 问题排查 |
| `trace` | 显示所有细节 | 深度调试 |

## 会话管理

### 恢复会话

Codex 会自动保存所有会话，使用 `-o` 输出结果到文件时，完整的执行过程仍然被保存在会话中。

```bash
# 恢复上一次会话（进入交互式模式）
codex resume --last

# 恢复特定会话
codex resume <session-id>

# 恢复命名会话
codex resume my-debug-session

# Fork 会话（从某个点创建新分支）
codex fork --last
```

### 查看会话列表

```bash
# 列出所有保存的会话
ls ~/.codex/sessions/

# 查看会话详情（JSON 格式）
cat ~/.codex/sessions/<session-id>.json
```

## 调试工作流

### 场景1：执行失败，需要查看详细过程

```bash
# 1. 使用 -o 执行（结果写入文件，静默运行）
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
codex exec -o "$RESULT" "分析这个 bug" --full-auto &> /dev/null
cat "$RESULT"

# 2. 如果出现问题，恢复会话查看完整过程
codex resume --last

# 3. 或者查看日志文件
tail -n 200 ~/.codex/log/codex-tui.log
```

### 场景2：需要详细日志进行调试

```bash
# 启用 debug 日志并执行
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
RUST_LOG=debug codex exec -o "$RESULT" "分析这个 bug" --full-auto &> /dev/null

# 同时监控日志
tail -F ~/.codex/log/codex-tui.log
```

### 场景3：保存执行结果到文件

```bash
# 使用 -o 直接将最终结果写入文件（推荐）
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
codex exec -o "$RESULT" "<prompt>" --full-auto &> /dev/null
cat "$RESULT"
```

## 常见问题排查

### 问题：执行卡住没有输出

```bash
# 启用详细日志查看卡在哪里
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
RUST_LOG=debug codex exec -o "$RESULT" "<prompt>" --full-auto &> /dev/null
```

### 问题：想看完整的工具调用过程

```bash
# 恢复会话进入交互式模式
codex resume --last

# 或者不使用 -o 和 &> /dev/null，直接查看完整输出
codex exec "<prompt>" --full-auto
```

### 问题：需要保留完整执行记录

```bash
# 使用自定义日志目录
mkdir -p tmp
RESULT="tmp/codex-result-$RANDOM.txt"
codex exec -o "$RESULT" "<prompt>" --full-auto -c log_dir=./debug-logs &> /dev/null

# 日志会保存到 ./debug-logs/codex-tui.log
```

## 最佳实践

1. **日常使用**：使用 `-o` 将结果写入 `tmp/` 目录文件，配合 `&> /dev/null` 保持输出简洁
2. **出现问题**：使用 `codex resume --last` 查看完整执行过程
3. **深度调试**：启用 `RUST_LOG=debug` 查看详细日志
4. **保留记录**：使用 `-o` 保存结果，使用自定义日志目录保存完整日志
5. **定期清理**：`~/.codex/log/` 和 `~/.codex/sessions/` 会积累大量文件，建议定期清理
