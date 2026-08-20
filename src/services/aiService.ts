import { 
  RtiAnalysisResponse, 
  RtiDraftData, 
  RightsAnalysisResult, 
  SchemeEvaluationResponse, 
  DocumentInterpretationResult,
  CitizenProfile,
  Language,
  ProblemRoutingResult
} from '../types';

export interface RouteResponse {
  category: string;
  categoryLabel: string;
  summary: string;
  recommendedTool: 'rti' | 'rights' | 'scheme' | 'form' | 'document';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  suggestedSteps: string[];
  officialSources: Array<{
    name?: string;
    title?: string;
    organization?: string;
    url?: string;
    portalUrl?: string;
    sourceType?: string;
    retrievedAt?: string;
  }>;
  disclaimer: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

async function safeJsonFetch<T = any>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    if (contentType.includes('application/json')) {
      try {
        const errJson = await res.json();
        if (typeof errJson.error === 'object' && errJson.error !== null) {
          errMsg = errJson.error.message || errJson.error.code || errMsg;
        } else if (typeof errJson.error === 'string') {
          errMsg = errJson.error;
        } else if (errJson.message) {
          errMsg = errJson.message;
        }
      } catch (e) {
        // fallback
      }
    } else {
      const text = await res.text().catch(() => '');
      if (text && !text.startsWith('<')) {
        errMsg = text.slice(0, 150);
      }
    }
    throw new Error(errMsg);
  }

  if (contentType.includes('application/json')) {
    return await res.json();
  }

  // If status is 200 but not JSON
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Received unexpected non-JSON response from server.');
  }
}

export const CivicApiService = {
  // AI Health Check
  async checkAiHealth(): Promise<{ success: boolean; provider?: string; model?: string; message?: string; error?: string }> {
    try {
      return await safeJsonFetch('/api/ai/health', {
        headers: { 'Accept': 'application/json' }
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'AI service unavailable' };
    }
  },
  // 1. Central AI Router
  async routeCivicQuery(userProblem: string, language: Language = 'en', signal?: AbortSignal, conversationId?: string): Promise<RouteResponse> {
    return safeJsonFetch<RouteResponse>('/api/ai/router', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userProblem, language, conversationId }),
      signal
    });
  },

  async routeProblem(userProblem: string, language: Language = 'en', signal?: AbortSignal, conversationId?: string): Promise<ProblemRoutingResult> {
    return safeJsonFetch<ProblemRoutingResult>('/api/civic/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userProblem, message: userProblem, userProblem, language, conversationId }),
      signal
    });
  },

  // 2. Universal Stream
  async streamCivicExplanation(prompt: string, callbacks: StreamCallbacks, systemInstruction?: string) {
    const { onChunk, onDone, onError, signal } = callbacks;
    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction }),
        signal
      });

      if (!res.ok || !res.body) {
        throw new Error('Streaming connection failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error && onError) {
                onError(parsed.error);
                return;
              }
              if (parsed.text) {
                fullText += parsed.text;
                onChunk(parsed.text);
              }
              if (parsed.done) {
                onDone(parsed.fullText || fullText);
                return;
              }
            } catch (e) {
              // Ignore parse error on partial chunks
            }
          }
        }
      }

      onDone(fullText);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
      }
      if (onError) {
        onError(err?.message || 'Streaming failed');
      }
    }
  },

  // 3. RTI Agent: Analyze
  async analyzeRti(userProblem: string, stateOrUt?: string, language: Language = 'en', signal?: AbortSignal): Promise<RtiAnalysisResponse> {
    return safeJsonFetch<RtiAnalysisResponse>('/api/civic/rti/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProblem, stateOrUt, language }),
      signal
    });
  },

  // 3B. RTI Agent: Generate Draft
  async generateRtiDraft(payload: {
    userProblem: string;
    answers: Record<string, string>;
    applicantDetails?: any;
    isCentralAuthority?: boolean;
    likelyAuthority?: string;
    stateOrUt?: string;
    language?: Language;
  }, signal?: AbortSignal): Promise<RtiDraftData> {
    return safeJsonFetch<RtiDraftData>('/api/civic/rti/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
  },

  // 4. Rights Navigator
  async analyzeRights(
    param1: string | { userProblem: string; contextDetails?: string; language?: Language },
    contextDetails?: string, 
    language: Language = 'en', 
    signal?: AbortSignal
  ): Promise<RightsAnalysisResult> {
    let payload: { userProblem: string; contextDetails?: string; language: Language };
    if (typeof param1 === 'object') {
      payload = {
        userProblem: param1.userProblem,
        contextDetails: param1.contextDetails,
        language: param1.language || 'en'
      };
    } else {
      payload = {
        userProblem: param1,
        contextDetails,
        language
      };
    }

    return safeJsonFetch<RightsAnalysisResult>('/api/civic/rights/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
  },

  // 5. Scheme Eligibility Evaluator
  async evaluateSchemes(citizenProfile: CitizenProfile, query?: string, language: Language = 'en', signal?: AbortSignal): Promise<SchemeEvaluationResponse> {
    return safeJsonFetch<SchemeEvaluationResponse>('/api/civic/schemes/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citizenProfile, query, language }),
      signal
    });
  },

  // 6. Form Assistant: Step
  async processFormStep(payload: {
    templateId: string;
    templateTitle: string;
    currentAnswers: Record<string, string>;
    userMessage: string;
    language?: Language;
  }, signal?: AbortSignal) {
    return safeJsonFetch('/api/civic/form/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
  },

  // 6B. Form Assistant: Generate Form
  async generateFormRepresentation(payload: {
    templateTitle: string;
    department: string;
    answers: Record<string, string>;
    applicantName?: string;
    language?: Language;
  }, signal?: AbortSignal): Promise<{ documentText: string }> {
    return safeJsonFetch<{ documentText: string }>('/api/civic/form/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
  },

  // 7. Document Interpreter
  async interpretDocument(payload: {
    textContent?: string;
    documentText?: string;
    documentTitle?: string;
    base64Data?: string;
    mimeType?: string;
    language?: Language;
  }, signal?: AbortSignal): Promise<DocumentInterpretationResult> {
    return safeJsonFetch<DocumentInterpretationResult>('/api/civic/document/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });
  },

  // 8. Admin Telemetry & Stats
  async getAdminStats() {
    return safeJsonFetch('/api/civic/admin/stats', {
      headers: { 'Accept': 'application/json' }
    });
  },

  async sendFeedback(logId: string, feedback: 'helpful' | 'unhelpful') {
    return safeJsonFetch('/api/civic/admin/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, feedback })
    });
  }
};
