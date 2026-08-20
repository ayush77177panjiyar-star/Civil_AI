export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: any;
}

export interface ConversationContext {
  conversationId: string;
  conversationSummary?: string;
  importantFacts: Record<string, any>;
  currentTask?: string;
  recentMessages: ConversationMessage[];
  updatedAt: number;
}

class ContextManager {
  private sessions = new Map<string, ConversationContext>();

  getContext(conversationId: string): ConversationContext {
    let ctx = this.sessions.get(conversationId);
    if (!ctx) {
      ctx = {
        conversationId,
        importantFacts: {},
        recentMessages: [],
        updatedAt: Date.now()
      };
      this.sessions.set(conversationId, ctx);
    }
    return ctx;
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata?: any): ConversationContext {
    const ctx = this.getContext(conversationId);
    ctx.recentMessages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata
    });
    ctx.updatedAt = Date.now();

    // Keep only the most recent 6 messages to avoid latency and token bloat
    if (ctx.recentMessages.length > 6) {
      const excess = ctx.recentMessages.splice(0, ctx.recentMessages.length - 6);
      // Compact summary of earlier turns
      const snippet = excess.map(m => `${m.role}: ${m.content.slice(0, 80)}...`).join(' | ');
      ctx.conversationSummary = ctx.conversationSummary 
        ? `${ctx.conversationSummary} | ${snippet}` 
        : snippet;
    }

    return ctx;
  }

  updateFacts(conversationId: string, facts: Record<string, any>): void {
    const ctx = this.getContext(conversationId);
    ctx.importantFacts = { ...ctx.importantFacts, ...facts };
    ctx.updatedAt = Date.now();
  }

  formatContextPrompt(conversationId: string): string {
    const ctx = this.getContext(conversationId);
    let out = '';
    if (ctx.conversationSummary) {
      out += `Previous Conversation Summary: ${ctx.conversationSummary}\n`;
    }
    if (Object.keys(ctx.importantFacts).length > 0) {
      out += `Known Citizen Facts: ${JSON.stringify(ctx.importantFacts)}\n`;
    }
    if (ctx.recentMessages.length > 0) {
      out += `Recent Messages:\n`;
      ctx.recentMessages.forEach(m => {
        out += `${m.role === 'user' ? 'Citizen' : 'CivicAI'}: ${m.content}\n`;
      });
    }
    return out;
  }

  clearSession(conversationId: string): void {
    this.sessions.delete(conversationId);
  }
}

export const contextManager = new ContextManager();
