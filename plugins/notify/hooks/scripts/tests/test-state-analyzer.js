#!/usr/bin/env node

/**
 * 单元测试 - StateAnalyzer
 */

const StateAnalyzer = require('../../../lib/state-analyzer');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`);
  }
}

function testStateAnalyzer() {
  console.log('测试 StateAnalyzer...');

  const analyzer = new StateAnalyzer();

  // ---- normalizeEntry ----

  // 测试 1: 跳过非消息条目
  const snapshot = { type: 'file-history-snapshot', messageId: 'abc', snapshot: {} };
  assert(analyzer.normalizeEntry(snapshot) === null, '应跳过 file-history-snapshot');
  console.log('✅ 测试 1 通过: 跳过非消息条目');

  // 测试 2: assistant 消息含 tool_use
  const norm2 = analyzer.normalizeEntry({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        { type: 'tool_use', id: 'toolu_1', name: 'Edit', input: {} },
        { type: 'text', text: 'Editing the file...' }
      ]
    }
  });
  assert(norm2.role === 'assistant', 'role 应为 assistant');
  assert(norm2.tool_uses.length === 1 && norm2.tool_uses[0].name === 'Edit', '工具名应为 Edit');
  assert(norm2.content === 'Editing the file...', '文本内容应正确提取');
  console.log('✅ 测试 2 通过: 解析 assistant 消息含 tool_use');

  // 测试 3: assistant 纯文本（忽略 thinking）
  const norm3 = analyzer.normalizeEntry({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        { type: 'thinking', thinking: 'Let me think...' },
        { type: 'text', text: 'Here is my answer.' }
      ]
    }
  });
  assert(!norm3.tool_uses, '不应有工具使用');
  assert(norm3.content === 'Here is my answer.', '应只提取 text block');
  console.log('✅ 测试 3 通过: 解析 assistant 纯文本（忽略 thinking）');

  // 测试 4: system 消息（content 在顶层）
  const norm4 = analyzer.normalizeEntry({
    type: 'system',
    subtype: 'info',
    content: 'Session limit reached.'
  });
  assert(norm4.role === 'system', 'role 应为 system');
  assert(norm4.content === 'Session limit reached.', '应提取 content');
  console.log('✅ 测试 4 通过: 解析 system 消息');

  // ---- analyzeMessages（使用规范化后的消息） ----

  // 测试 5: 单次工具调用触发任务完成（阈值 >= 1）
  const rawEntries5 = [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Write', input: {} }] } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Done.' }] } }
  ];
  const msgs5 = rawEntries5.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs5, rawEntries5) === 'task_complete', '单次工具调用应触发任务完成');
  console.log('✅ 测试 5 通过: 单次工具调用触发任务完成');

  // 测试 6: 读取工具现在应该触发任务完成（新规则：统计所有工具）
  const rawEntries6 = [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't2', name: 'Read', input: {} }, { type: 'tool_use', id: 't3', name: 'Grep', input: {} }] } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Analysis: ' + 'x'.repeat(300) }] } }
  ];
  const msgs6 = rawEntries6.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs6, rawEntries6) === 'task_complete', '有读取工具应触发任务完成');
  console.log('✅ 测试 6 通过: 读取工具应触发任务完成（新规则）');

  // 测试 7-8: 已删除（detectSessionLimit 和 detectAPIError 方法已移除）
  // 相关场景已被测试 10-11 覆盖（基于 detectAPIErrorFromEntry）

  // 测试 9: 简单对话不触发通知
  const msgs9 = [
    { type: 'user', message: { role: 'user', content: 'Hello' } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Hi!' }] } }
  ].map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  const rawEntries9 = [
    { type: 'user', message: { role: 'user', content: 'Hello' } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Hi!' }] } }
  ];
  assert(analyzer.analyzeMessages(msgs9, rawEntries9) === null, '简单对话不应触发通知');
  console.log('✅ 测试 9 通过: 简单对话不触发通知');

  // ---- 新增测试：API 错误消息检测 ----

  // 测试 10: API 错误消息（isApiErrorMessage 标志）
  const rawEntries10 = [
    {
      type: 'assistant',
      isApiErrorMessage: true,
      message: {
        model: '<synthetic>',
        stop_reason: 'stop_sequence',
        content: [{ type: 'text', text: 'API Error: 503 {"error":{"message":"No available accounts","type":"api_error"},"type":"error"}' }]
      },
      error: 'unknown'
    }
  ];
  const msgs10 = rawEntries10.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs10, rawEntries10) === 'execution_error', 'API 错误消息（isApiErrorMessage）应返回 execution_error');
  console.log('✅ 测试 10 通过: API 错误消息（isApiErrorMessage 标志）');

  // 测试 11: 合成消息（model: '<synthetic>'）
  const rawEntries11 = [
    {
      type: 'assistant',
      message: {
        model: '<synthetic>',
        content: [{ type: 'text', text: 'Some error occurred' }]
      },
      error: 'unknown'
    }
  ];
  const msgs11 = rawEntries11.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs11, rawEntries11) === 'execution_error', '合成消息应返回 execution_error');
  console.log('✅ 测试 11 通过: 合成消息（model: "<synthetic>"）');

  // 测试 12: 只有查询工具现在应该触发任务完成（新规则：统计所有工具）
  const rawEntries12 = [
    {
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 't1', name: 'Read', input: {} },
          { type: 'tool_use', id: 't2', name: 'Grep', input: {} }
        ]
      }
    },
    {
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Analysis complete.' }]
      }
    }
  ];
  const msgs12 = rawEntries12.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs12, rawEntries12) === 'task_complete', '有查询工具应触发任务完成');
  console.log('✅ 测试 12 通过: 查询工具应触发任务完成（新规则）');

  // 测试 13: 有执行工具应触发任务完成
  const rawEntries13 = [
    {
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 't1', name: 'Write', input: {} }
        ]
      }
    },
    {
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'File created.' }]
      }
    }
  ];
  const msgs13 = rawEntries13.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs13, rawEntries13) === 'task_complete', '有执行工具应触发任务完成');
  console.log('✅ 测试 13 通过: 有执行工具应触发任务完成');

  // 测试 14: 混合工具（有执行工具）应触发任务完成
  const rawEntries14 = [
    {
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 't1', name: 'Read', input: {} },
          { type: 'tool_use', id: 't2', name: 'Edit', input: {} }
        ]
      }
    }
  ];
  const msgs14 = rawEntries14.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs14, rawEntries14) === 'task_complete', '混合工具（有执行工具）应触发任务完成');
  console.log('✅ 测试 14 通过: 混合工具（有执行工具）应触发任务完成');

  // 测试 15: error 字段存在应返回 execution_error
  const rawEntries15 = [
    {
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        content: [{ type: 'text', text: 'Something went wrong' }]
      },
      error: 'timeout'
    }
  ];
  const msgs15 = rawEntries15.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs15, rawEntries15) === 'execution_error', 'error 字段存在应返回 execution_error');
  console.log('✅ 测试 15 通过: error 字段存在应返回 execution_error');

  // 测试 16: AskUserQuestion 现在应该触发任务完成（新规则：统计所有工具）
  const rawEntries16 = [
    {
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-6',
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 't1', name: 'AskUserQuestion', input: {} }
        ]
      }
    }
  ];
  const msgs16 = rawEntries16.map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs16, rawEntries16) === 'task_complete', 'AskUserQuestion 应触发任务完成');
  console.log('✅ 测试 16 通过: AskUserQuestion 应触发任务完成（新规则）');

  console.log('');
  console.log('✅ StateAnalyzer 所有测试通过！');
}

// 运行测试
try {
  testStateAnalyzer();
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
}
