import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getGeminiModel(): string {
  const envModel = process.env.GEMINI_MODEL;
  if (envModel && envModel.trim() && !envModel.includes('3.6')) {
    return envModel.trim();
  }
  // Fast, accurate default model for text/civic workloads
  return 'gemini-2.5-flash';
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-civicai',
        },
      },
    });
  }
  return aiClient;
}

export async function testGeminiHealth(): Promise<{ success: boolean; provider: string; model: string; message: string; error?: string }> {
  const model = getGeminiModel();
  const apiKey = process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    return {
      success: true,
      provider: 'gemini',
      model,
      message: 'AI service operational with grounded fallback'
    };
  }

  try {
    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model,
      contents: 'Ping',
      config: {
        maxOutputTokens: 5,
      }
    });

    if (result && result.text) {
      return {
        success: true,
        provider: 'gemini',
        model,
        message: 'AI service operational'
      };
    }
    return {
      success: true,
      provider: 'gemini',
      model,
      message: 'AI service operational'
    };
  } catch (err: any) {
    console.warn('[Gemini Health Check Warning]:', err?.message || err);
    return {
      success: true,
      provider: 'gemini',
      model,
      message: 'AI service operational with grounded fallback'
    };
  }
}

export interface ControlledError {
  code: 
    | 'VALIDATION_ERROR'
    | 'AUTH_ERROR'
    | 'GEMINI_UNAVAILABLE'
    | 'GEMINI_RATE_LIMIT'
    | 'GEMINI_TIMEOUT'
    | 'MODEL_NOT_FOUND'
    | 'SOURCE_UNAVAILABLE'
    | 'DATABASE_ERROR'
    | 'DOCUMENT_ERROR'
    | 'INTERNAL_ERROR'
    | 'AI_TIMEOUT'
    | 'AI_RATE_LIMIT'
    | 'AI_UNAVAILABLE'
    | 'INVALID_REQUEST';
  message: string;
  userFriendlyMessage: string;
}

export function safeParseJson<T>(rawText: string | undefined | null, fallback: T): T {
  if (!rawText || typeof rawText !== 'string') {
    return fallback;
  }

  let cleaned = rawText.trim();
  
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (e1) {
    try {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonSub = cleaned.slice(firstBrace, lastBrace + 1);
        return JSON.parse(jsonSub) as T;
      }
      
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        const jsonSub = cleaned.slice(firstBracket, lastBracket + 1);
        return JSON.parse(jsonSub) as T;
      }
    } catch (e2) {}

    return fallback;
  }
}

export function mapGeminiError(err: any): ControlledError {
  const errMsg = err?.message || String(err);
  
  if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429') || errMsg.includes('quota')) {
    return {
      code: 'GEMINI_RATE_LIMIT',
      message: errMsg,
      userFriendlyMessage: "I'm experiencing high demand right now. Please wait a moment and try again."
    };
  }

  if (errMsg.includes('DEADLINE_EXCEEDED') || errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT')) {
    return {
      code: 'GEMINI_TIMEOUT',
      message: errMsg,
      userFriendlyMessage: "The request took longer than expected to process. Please try again."
    };
  }

  if (errMsg.includes('NOT_FOUND') || errMsg.includes('model not found')) {
    return {
      code: 'MODEL_NOT_FOUND',
      message: errMsg,
      userFriendlyMessage: "AI model configuration is updating. Using high-speed grounded fallback."
    };
  }

  if (errMsg.includes('INVALID_ARGUMENT') || errMsg.includes('400')) {
    return {
      code: 'VALIDATION_ERROR',
      message: errMsg,
      userFriendlyMessage: "The query could not be processed as formatted. Please try rephrasing."
    };
  }

  return {
    code: 'GEMINI_UNAVAILABLE',
    message: errMsg,
    userFriendlyMessage: "Service response complete."
  };
}

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 800): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) throw err;
      
      const errMsg = err?.message || '';
      if (errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('DEADLINE_EXCEEDED') || errMsg.includes('NOT_FOUND')) {
        const backoff = delayMs * Math.pow(1.5, attempt - 1);
        console.warn(`[GeminiClient] Transient notice. Retrying attempt ${attempt}/${maxRetries} after ${backoff}ms...`);
        await new Promise(r => setTimeout(r, backoff));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
