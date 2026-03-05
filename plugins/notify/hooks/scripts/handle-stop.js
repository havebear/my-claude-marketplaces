#!/usr/bin/env node

const fs = require('fs');
const HookHandler = require('../../lib/hook-handler');
const StateAnalyzer = require('../../lib/state-analyzer');

async function main() {
  try {
    const handler = new HookHandler();
    await handler.initialize();

    const hookData = await handler.readStdin();

    if (hookData.stop_hook_active) {
      process.exit(0);
    }

    const sessionId = hookData.session_id || 'default';
    const transcriptFile = hookData.transcript_path;

    if (!transcriptFile || !fs.existsSync(transcriptFile)) {
      process.exit(0);
    }

    // 分析对话状态
    const analyzer = new StateAnalyzer();
    const notificationType = await analyzer.analyzeConversationFile(transcriptFile);

    if (notificationType) {
      await handler.sendNotification(notificationType, sessionId);
      handler.dedup.cleanup();
    }
  } catch (error) {
    console.error('Error in handle-stop:', error.message);
    process.exit(0);
  }
}

main();
