const fs = require('fs');
const readline = require('readline');

class StateAnalyzer {
  constructor() {
    this.activeTools = ['Write', 'Edit', 'Bash', 'NotebookEdit'];
    this.readTools = ['Read', 'Grep', 'Glob'];
  }

  async analyzeConversationFile(filePath) {
    const messages = await this.parseJSONL(filePath);
    return this.analyzeMessages(messages);
  }

  async parseJSONL(filePath) {
    const messages = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line);
          messages.push(msg);
        } catch (error) {
          // 忽略解析错误的行
        }
      }
    }

    return messages;
  }

  analyzeMessages(messages) {
    // 1. 检查 Session Limit
    if (this.detectSessionLimit(messages)) {
      return 'session_limit';
    }

    // 2. 检查 API Error
    if (this.detectAPIError(messages)) {
      return 'api_error';
    }

    // 3. 分析工具使用模式
    const toolUsage = this.analyzeToolUsage(messages);

    // 4. 判断任务类型
    if (toolUsage.hasActiveTools) {
      // 有 Write/Edit/Bash 等主动工具
      return 'task_complete';
    } else if (toolUsage.hasReadTools && toolUsage.longResponse) {
      // 只有 Read/Grep/Glob 且回复较长
      return 'review_complete';
    }

    return null;
  }

  detectSessionLimit(messages) {
    // 检查最后3条消息中是否包含 "Session limit reached"
    const recentMessages = messages.slice(-3);
    return recentMessages.some(msg => {
      if (msg.content) {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return content.includes('Session limit reached') || content.includes('会话限制');
      }
      return false;
    });
  }

  detectAPIError(messages) {
    // 检查最后3条消息中是否包含 "API Error: 401"
    const recentMessages = messages.slice(-3);
    return recentMessages.some(msg => {
      if (msg.content) {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return (content.includes('API Error: 401') || content.includes('API Error')) &&
               (content.includes('Please run /login') || content.includes('登录'));
      }
      return false;
    });
  }

  analyzeToolUsage(messages) {
    let hasActiveTools = false;
    let hasReadTools = false;
    let responseLength = 0;

    // 分析最后15条消息
    const recentMessages = messages.slice(-15);

    for (const msg of recentMessages) {
      // 检查工具使用
      if (msg.tool_uses && Array.isArray(msg.tool_uses)) {
        for (const tool of msg.tool_uses) {
          if (this.activeTools.includes(tool.name)) {
            hasActiveTools = true;
          }
          if (this.readTools.includes(tool.name)) {
            hasReadTools = true;
          }
        }
      }

      // 计算回复长度
      if (msg.role === 'assistant' && msg.content) {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        responseLength += content.length;
      }
    }

    return {
      hasActiveTools,
      hasReadTools,
      longResponse: responseLength > 200
    };
  }
}

module.exports = StateAnalyzer;
