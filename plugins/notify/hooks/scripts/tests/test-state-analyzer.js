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

  // 测试 1: 检测任务完成（有主动工具）
  const messages1 = [
    {
      role: 'assistant',
      tool_uses: [{ name: 'Write' }],
      content: 'Writing file...'
    },
    {
      role: 'assistant',
      content: 'Task completed'
    }
  ];
  const result1 = analyzer.analyzeMessages(messages1);
  assert(result1 === 'task_complete', '应该检测到任务完成');
  console.log('✅ 测试 1 通过: 检测任务完成');

  // 测试 2: 检测审查完成（只有只读工具）
  const messages2 = [
    {
      role: 'assistant',
      tool_uses: [{ name: 'Read' }, { name: 'Grep' }],
      content: 'After analyzing the code, I found that...'
    },
    {
      role: 'assistant',
      content: 'The implementation looks good. Here are my findings: ' + 'x'.repeat(300)
    }
  ];
  const result2 = analyzer.analyzeMessages(messages2);
  assert(result2 === 'review_complete', '应该检测到审查完成');
  console.log('✅ 测试 2 通过: 检测审查完成');

  // 测试 3: 检测会话限制
  const messages3 = [
    {
      role: 'system',
      content: 'Session limit reached. Please start a new session.'
    }
  ];
  const result3 = analyzer.analyzeMessages(messages3);
  assert(result3 === 'session_limit', '应该检测到会话限制');
  console.log('✅ 测试 3 通过: 检测会话限制');

  // 测试 4: 检测 API 错误
  const messages4 = [
    {
      role: 'system',
      content: 'API Error: 401 Unauthorized. Please run /login to authenticate.'
    }
  ];
  const result4 = analyzer.analyzeMessages(messages4);
  assert(result4 === 'api_error', '应该检测到 API 错误');
  console.log('✅ 测试 4 通过: 检测 API 错误');

  // 测试 5: 无需通知的情况
  const messages5 = [
    {
      role: 'assistant',
      content: 'Hello!'
    }
  ];
  const result5 = analyzer.analyzeMessages(messages5);
  assert(result5 === null, '简单对话不应触发通知');
  console.log('✅ 测试 5 通过: 简单对话不触发通知');

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
