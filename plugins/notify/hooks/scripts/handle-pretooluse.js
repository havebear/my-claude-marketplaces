#!/usr/bin/env node

const HookHandler = require('../../lib/hook-handler');

async function main() {
  const handler = new HookHandler();

  try {
    await handler.initialize();
  } catch (error) {
    console.error('Error in handle-pretooluse init:', error.message);
    handler.outputPermissionDecision('allow');
    return;
  }

  const hookData = await handler.readStdin();
  const toolName = hookData.tool_use?.name;
  const sessionId = hookData.session_id || 'default';

  // 先输出权限决策，不阻塞 hook 响应
  handler.outputPermissionDecision('allow');

  // 异步发送通知，不等待结果
  try {
    if (toolName === 'ExitPlanMode') {
      await handler.sendNotification('plan_ready', sessionId);
    } else if (toolName === 'AskUserQuestion') {
      await handler.sendNotification('question', sessionId);
    }
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
}

main();
