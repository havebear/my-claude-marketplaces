#!/usr/bin/env node

/**
 * 单元测试 - DedupManager
 */

const DedupManager = require('../../../lib/dedup-manager');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`);
  }
}

async function testDedupManager() {
  console.log('测试 DedupManager...');

  // 创建测试实例（2秒冷却时间）
  const dedup = new DedupManager(2);

  const sessionId = 'test-session';
  const notificationType = 'task_complete';

  // 测试 1: 第一次不应该跳过
  const result1 = dedup.shouldSkip(notificationType, sessionId);
  assert(result1 === false, '第一次不应该跳过');
  dedup.record(notificationType, sessionId);
  console.log('✅ 测试 1 通过: 第一次允许发送');

  // 测试 2: 冷却期内应该跳过
  const result2 = dedup.shouldSkip(notificationType, sessionId);
  assert(result2 === true, '冷却期内应该跳过');
  console.log('✅ 测试 2 通过: 冷却期内阻止发送');

  // 测试 3: 等待冷却时间后不应该跳过
  console.log('等待 2.5 秒...');
  await sleep(2500);
  const result3 = dedup.shouldSkip(notificationType, sessionId);
  assert(result3 === false, '冷却期后不应该跳过');
  dedup.record(notificationType, sessionId);
  console.log('✅ 测试 3 通过: 冷却期后允许发送');

  // 测试 4: 不同通知类型应该独立（不跳过）
  const result4 = dedup.shouldSkip('review_complete', sessionId);
  assert(result4 === false, '不同通知类型不应该跳过');
  console.log('✅ 测试 4 通过: 不同通知类型独立');

  // 测试 5: 清理功能
  dedup.cleanup();
  console.log('✅ 测试 5 通过: 清理功能正常');

  console.log('');
  console.log('✅ DedupManager 所有测试通过！');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
testDedupManager().catch(error => {
  console.error('❌ 测试失败:', error.message);
  process.exit(1);
});
