const fs = require('fs');
const readline = require('readline');

class StateAnalyzer {
  constructor() {
    // 构造函数现在为空，保留以便将来扩展
  }

  async analyzeConversationFile(filePath) {
    const { messages, rawEntries } = await this.parseJSONL(filePath);
    return this.analyzeMessages(messages, rawEntries);
  }

  async parseJSONL(filePath, maxMessages = 20) {
    const rawEntries = [];
    const messages = [];

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // 从后往前解析
    let buffer = '';
    let braceCount = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 从后往前累积（需要反转顺序）
      buffer = line + '\n' + buffer;

      // 反向计算大括号（从后往前，{ 减少，} 增加）
      for (const char of trimmed) {
        if (char === '{') braceCount--;
        if (char === '}') braceCount++;
      }

      // 当大括号平衡时（braceCount 回到 0），说明找到了一个完整的 JSON 对象
      if (braceCount === 0 && buffer.trim()) {
        try {
          const entry = JSON.parse(buffer);

          // 只保存 assistant 类型的消息
          if (entry.type === 'assistant') {
            rawEntries.unshift(entry); // 添加到开头，保持时间顺序

            const msg = this.normalizeEntry(entry);
            if (msg) {
              messages.unshift(msg);
            }

            // 找到足够的消息后停止
            if (rawEntries.length >= maxMessages) {
              break;
            }
          }

          buffer = '';
        } catch (error) {
          // 解析失败，继续累积
        }
      }
    }

    return { messages, rawEntries };
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

  /**
   * 从原始条目检测 API 错误消息
   *
   * @param {Object} entry - 原始 transcript 条目
   * @returns {boolean} 是否为 API 错误消息
   */
  detectAPIErrorFromEntry(entry) {
    if (!entry || entry.type !== 'assistant') {
      return false;
    }

    // 方法 A: 检查 isApiErrorMessage 标志（最可靠）
    if (entry.isApiErrorMessage === true) {
      return true;
    }

    // 方法 B: 检查是否为合成消息
    if (entry.message && entry.message.model === '<synthetic>') {
      return true;
    }

    // 方法 C: 检查 error 字段
    if (entry.error && entry.error !== '') {
      return true;
    }

    return false;
  }

  analyzeMessages(messages, rawEntries = []) {
    // 1. 获取最后一个 assistant 消息（已经按时间排序）
    const lastAssistantEntry = rawEntries[rawEntries.length - 1];

    // 2. 检查是否为 API 错误消息
    if (lastAssistantEntry && this.detectAPIErrorFromEntry(lastAssistantEntry)) {
      return 'execution_error';
    }

    // 3. 分析工具使用（所有工具）
    const toolUsage = this.analyzeToolUsage(messages);

    // 4. 判断任务完成
    if (toolUsage.hasTools && toolUsage.toolCount >= 1) {
      return 'task_complete';
    }

    return null;
  }

  analyzeToolUsage(messages) {
    let hasTools = false;
    let toolCount = 0;

    // messages 已经是最近的 20 条，不需要 slice
    for (const msg of messages) {
      if (msg.tool_uses && Array.isArray(msg.tool_uses)) {
        hasTools = true;
        toolCount += msg.tool_uses.length;
      }
    }

    return {
      hasTools,
      toolCount
    };
  }
}

module.exports = StateAnalyzer;
