---
name: ps-plan
description: 启动交互式计划制定流程，通过多轮对话创建详细的实施计划
argument-hint: 可选 Plan 说明

---

# 交互式计划制定命令

此命令启动交互式计划制定流程，帮助你创建详细、可执行的实施计划。

## 使用方法

```bash
/ps-plan [可选：功能描述]
```

**示例：**
```bash
/ps-plan 添加用户认证功能
/ps-plan 实现深色模式
/ps-plan
```

## 执行流程

当你运行此命令时，将自动调用 project-spec:planning skill，该 skill 会：

1. **第1轮：需求全貌挖掘**
    - 使用5层次框架深度澄清需求（Why/What/How/Constraints/EdgeCases）
    - 使用 MoSCoW 矩阵确认范围（Must/Should/Could/Won't Have）

2. **第2轮：方案设计与细化**
    - 技术方案评估和权衡
    - 实施步骤分解（具体任务、文件路径、依赖关系）
    - 边界情况矩阵（数据/网络/并发/权限/业务规则/特殊用户）

3. **第3轮：风险测试与最终审查**
    - 风险评估和缓解措施
    - 验证方法（验证标准、检验方式、反馈机制）
    - 最终完整性检查

对于复杂功能，可能会扩展到5轮对话。

## 输出

计划文档将保存到：`docs/spec/[功能名称]-[时间戳].md`

## 后续操作

计划创建完成后，可以使用 `/ps-exec` 命令执行计划：

```bash
/ps-exec docs/spec/[功能名称]-[时间戳].md
```

或直接运行 `/ps-exec`，系统会自动选择最新的计划文件。

---

## 执行指令

**重要：** 当此命令被调用时，必须立即使用 Skill tool 调用 `planning` skill。

使用以下方式调用：
```
Skill tool:
- skill: "planning"
- args: [用户提供的功能描述，如果有的话]
```

如果用户提供了功能描述参数，将其作为 args 传递给 skill。如果没有提供，则不传递 args 参数，让 skill 自行询问。
