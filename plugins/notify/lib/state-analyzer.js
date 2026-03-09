const fs = require('fs');
const readline = require('readline');

class StateAnalyzer {
  constructor() {
    this.tools = ['Write', 'Edit', 'Bash', 'NotebookEdit', 'Read', 'Grep', 'Glob'];
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
          const entry = JSON.parse(line);
          const msg = this.normalizeEntry(entry);
          if (msg) {
            messages.push(msg);
          }
        } catch (error) {
          // 忽略解析错误的行
        }
      }
    }

    return messages;
  }

  /**
   * 将 transcript 条目规范化为统一的消息格式
   *
   * 真实 transcript 格式:
   *   { type: 'assistant', message: { role: 'assistant', content: [{type: 'tool_use', name: '...'}, {type: 'text', text: '...'}] } }
   *   { type: 'system', content: '...' }
   *
   * 规范化为:
   *   { role: 'assistant', content: '...', tool_uses: [{name: '...'}] }
   *   { role: 'system', content: '...' }
   */
  normalizeEntry(entry) {
    if (!entry.type || !['user', 'assistant', 'system'].includes(entry.type)) {
      return null;
    }

    // 系统消息：content 可能在顶层
    if (entry.type === 'system') {
      const content = entry.content || (entry.message && entry.message.content) || '';
      return {
        role: 'system',
        content: typeof content === 'string' ? content : JSON.stringify(content)
      };
    }

    // user/assistant 消息：content 在 entry.message 中
    const message = entry.message;
    if (!message) return null;

    const role = message.role || entry.type;
    const result = { role };

    if (typeof message.content === 'string') {
      result.content = message.content;
    } else if (Array.isArray(message.content)) {
      const textParts = [];
      const toolUses = [];

      for (const block of message.content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolUses.push({ name: block.name });
        }
      }

      result.content = textParts.join('\n');
      if (toolUses.length > 0) {
        result.tool_uses = toolUses;
      }
    } else {
      result.content = '';
    }

    return result;
  }

  analyzeMessages(messages) {
    // 1. 检查异常状态
    if (this.detectSessionLimit(messages) || this.detectAPIError(messages)) {
      return 'execution_error';
    }

    // 2. 分析工具使用
    const toolUsage = this.analyzeToolUsage(messages);

    // 3. 判断任务完成（工具调用次数 >= 2）
    if (toolUsage.hasTools && toolUsage.toolCount >= 2) {
      return 'task_complete';
    }

    return null;
  }

  detectSessionLimit(messages) {
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
    let hasTools = false;
    let toolCount = 0;

    const recentMessages = messages.slice(-15);

    for (const msg of recentMessages) {
      if (msg.tool_uses && Array.isArray(msg.tool_uses)) {
        for (const tool of msg.tool_uses) {
          if (this.tools.includes(tool.name)) {
            hasTools = true;
            toolCount++;
          }
        }
      }
    }

    return {
      hasTools,
      toolCount
    };
  }
}

module.exports = StateAnalyzer;
