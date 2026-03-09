#!/usr/bin/env node

/**
 * 集成测试 - handle-stop.js
 * 使用真实 hookData 结构和 transcript 格式
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const HANDLE_STOP_SCRIPT = path.join(__dirname, '..', 'handle-stop.js');
const PLUGIN_ROOT = path.join(__dirname, '..', '..', '..');
const TMP_DIR = path.join(os.tmpdir(), 'notify-test');

let testCount = 0;
let passCount = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`);
  }
}

function setup() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

function cleanup() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
}

/**
 * 创建模拟 transcript JSONL 文件（使用真实格式）
 */
function createTranscript(filename, entries) {
  const filePath = path.join(TMP_DIR, filename);
  const lines = entries.map(e => JSON.stringify(e)).join('\n');
  fs.writeFileSync(filePath, lines, 'utf-8');
  return filePath;
}

/**
 * 构造 hookData（基于真实抓取的结构）
 */
function buildHookData(overrides = {}) {
  return {
    session_id: 'test-session-' + Date.now(),
    transcript_path: '',
    cwd: process.cwd(),
    permission_mode: 'default',
    hook_event_name: 'Stop',
    stop_hook_active: false,
    last_assistant_message: 'Task completed.',
    ...overrides
  };
}

/**
 * 运行 handle-stop.js 脚本，通过 stdin 传入 hookData
 */
function runHandleStop(hookData, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [HANDLE_STOP_SCRIPT], {
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT
      },
      shell: true,
      timeout: timeoutMs
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.stdin.write(JSON.stringify(hookData));
    child.stdin.end();
  });
}

async function runTest(name, fn) {
  testCount++;
  try {
    await fn();
    passCount++;
    console.log(`✅ 测试 ${testCount} 通过: ${name}`);
  } catch (error) {
    console.error(`❌ 测试 ${testCount} 失败: ${name}`);
    console.error(`   ${error.message}`);
  }
}

// ============================================================
// 测试用例
// ============================================================

async function testNoTranscriptPath() {
  const hookData = buildHookData({ transcript_path: '' });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testNonExistentTranscript() {
  const hookData = buildHookData({
    transcript_path: path.join(TMP_DIR, 'non-existent.jsonl')
  });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testStopHookActive() {
  const transcriptPath = createTranscript('active.jsonl', [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Write', input: {} }] } }
  ]);
  const hookData = buildHookData({
    transcript_path: transcriptPath,
    stop_hook_active: true
  });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testTaskComplete() {
  const transcriptPath = createTranscript('task-complete.jsonl', [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Read', input: {} }, { type: 'tool_use', id: 't2', name: 'Write', input: {} }] } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'File written successfully.' }] } }
  ]);
  const hookData = buildHookData({ transcript_path: transcriptPath });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testReviewComplete() {
  const transcriptPath = createTranscript('review-complete.jsonl', [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 't2', name: 'Read', input: {} }, { type: 'tool_use', id: 't3', name: 'Grep', input: {} }] } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Analysis findings: ' + 'x'.repeat(300) }] } }
  ]);
  const hookData = buildHookData({ transcript_path: transcriptPath });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testSessionLimit() {
  const transcriptPath = createTranscript('session-limit.jsonl', [
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Working...' }] } },
    { type: 'system', content: 'Session limit reached. Please start a new session.' }
  ]);
  const hookData = buildHookData({ transcript_path: transcriptPath });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testApiError() {
  const transcriptPath = createTranscript('api-error.jsonl', [
    { type: 'system', content: 'API Error: 401 Unauthorized. Please run /login to authenticate.' }
  ]);
  const hookData = buildHookData({ transcript_path: transcriptPath });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testSimpleConversationNoNotify() {
  const transcriptPath = createTranscript('simple.jsonl', [
    { type: 'user', message: { role: 'user', content: 'Hello' } },
    { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Hi!' }] } }
  ]);
  const hookData = buildHookData({ transcript_path: transcriptPath });
  const result = await runHandleStop(hookData);
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

async function testEmptyStdin() {
  const result = await runHandleStop({});
  assert(result.code === 0, `期望退出码 0，实际: ${result.code}`);
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('handle-stop.js 集成测试');
  console.log('='.repeat(60));

  setup();

  try {
    await runTest('transcript_path 为空时正常退出', testNoTranscriptPath);
    await runTest('transcript 文件不存在时正常退出', testNonExistentTranscript);
    await runTest('stop_hook_active 为 true 时正常退出', testStopHookActive);
    await runTest('任务完成场景正常处理', testTaskComplete);
    await runTest('读取工具场景正常处理（归为任务完成）', testReviewComplete);
    await runTest('Session Limit 场景正常处理（归为执行出错）', testSessionLimit);
    await runTest('API Error 场景正常处理（归为执行出错）', testApiError);
    await runTest('简单对话不触发通知', testSimpleConversationNoNotify);
    await runTest('空 stdin 时正常退出', testEmptyStdin);
  } finally {
    cleanup();
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ 通过: ${passCount}/${testCount}`);
  if (passCount < testCount) {
    console.log(`❌ 失败: ${testCount - passCount}`);
    process.exit(1);
  } else {
    console.log('✅ 所有集成测试通过！');
  }
}

main().catch(error => {
  console.error('测试运行器错误:', error);
  process.exit(1);
});
