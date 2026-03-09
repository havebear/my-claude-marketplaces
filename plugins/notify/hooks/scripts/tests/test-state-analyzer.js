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

  // 测试 5: 单次工具调用不触发通知（阈值 >= 2）
  const msgs5 = [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Write', input: {} }] } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Done.' }] } }
  ].map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs5) === null, '单次工具调用不应触发通知');
  console.log('✅ 测试 5 通过: 单次工具调用不触发通知');

  // 测试 5b: 多次工具调用触发任务完成
  const msgs5b = [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Read', input: {} }, { type: 'tool_use', id: 't2', name: 'Edit', input: {} }] } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Done editing.' }] } }
  ].map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs5b) === 'task_complete', '多次工具调用应触发任务完成');
  console.log('✅ 测试 5b 通过: 多次工具调用触发任务完成');

  // 测试 6: 读取工具也算任务完成（>= 2 次调用）
  const msgs6 = [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't2', name: 'Read', input: {} }, { type: 'tool_use', id: 't3', name: 'Grep', input: {} }] } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Analysis: ' + 'x'.repeat(300) }] } }
  ].map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs6) === 'task_complete', '应检测到任务完成（含读取工具）');
  console.log('✅ 测试 6 通过: 读取工具也算任务完成');

  // 测试 7: Session Limit → 执行出错
  const msgs7 = [
    { type: 'system', content: 'Session limit reached. Please start a new session.' }
  ].map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs7) === 'execution_error', '应检测到执行出错（Session Limit）');
  console.log('✅ 测试 7 通过: Session Limit → 执行出错');

  // 测试 8: API Error → 执行出错
  const msgs8 = [
    { type: 'system', content: 'API Error: 401 Unauthorized. Please run /login to authenticate.' }
  ].map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs8) === 'execution_error', '应检测到执行出错（API Error）');
  console.log('✅ 测试 8 通过: API Error → 执行出错');

  // 测试 9: 简单对话不触发通知
  const msgs9 = [
    { type: 'user', message: { role: 'user', content: 'Hello' } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Hi!' }] } }
  ].map(e => analyzer.normalizeEntry(e)).filter(Boolean);
  assert(analyzer.analyzeMessages(msgs9) === null, '简单对话不应触发通知');
  console.log('✅ 测试 9 通过: 简单对话不触发通知');

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
