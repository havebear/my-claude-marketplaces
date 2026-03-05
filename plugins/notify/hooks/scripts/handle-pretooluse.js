#!/usr/bin/env node

const HookHandler = require('../../lib/hook-handler');

async function main() {
  try {
    const handler = new HookHandler();
    await handler.initialize();

    const hookData = await handler.readStdin();
    const toolName = hookData.tool_use?.name;
    const sessionId = hookData.session_id || 'default';

    if (toolName === 'ExitPlanMode') {
      await handler.sendNotification('plan_ready', sessionId);
    } else if (toolName === 'AskUserQuestion') {
      await handler.sendNotification('question', sessionId);
    }

    handler.outputPermissionDecision('allow');
  } catch (error) {
    console.error('Error in handle-pretooluse:', error.message);
    const handler = new HookHandler();
    handler.outputPermissionDecision('allow');
  }
}

main();
