#!/usr/bin/env node

const HookHandler = require('../../lib/hook-handler');

async function main() {
  try {
    const handler = new HookHandler();
    await handler.initialize();

    const hookData = await handler.readStdin();
    const sessionId = hookData.session_id || 'default';

    if (hookData.notification_type === 'permission_prompt') {
      await handler.sendNotification('question', sessionId, '需要你的授权');
    }
  } catch (error) {
    console.error('Error in handle-notification:', error.message);
  }
}

main();
