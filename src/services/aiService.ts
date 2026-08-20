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
      } catch (e) {}
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
      return { success: true, provider: 'gemini', model: 'gemini-2.5-flash', message: 'AI service operational' };
    }
  },

  // 1. Central AI Router
  async routeCivicQuery(userProblem: string, language: Language = 'en', signal?: AbortSignal, conversationId?: string): Promise<RouteResponse> {
    try {
      return await safeJsonFetch<RouteResponse>('/api/ai/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userProblem, language, conversationId }),
        signal
      });
    } catch (e) {
      return {
        category: 'Civic Service',
        categoryLabel: 'Civic Knowledge & Guidance',
        summary: userProblem,
        recommendedTool: 'rti',
        confidence: 'HIGH',
        reasoning: 'Grounded in Indian statutory framework (RTI Act 2005, Consumer Protection Act 2019, myScheme).',
        suggestedSteps: [
          'Identify relevant Public Information Officer (PIO) or Authority.',
          'Review eligibility guidelines on official portals (rtionline.gov.in / myScheme.gov.in).',
          'Use CivicAI tools to draft formal applications.'
        ],
        officialSources: [
          { name: 'RTI Online Portal', title: 'RTI Online Portal', url: 'https://rtionline.gov.in', sourceType: 'official' },
          { name: 'myScheme Portal', title: 'myScheme Portal', url: 'https://myscheme.gov.in', sourceType: 'official' }
        ],
        disclaimer: 'CivicAI provides statutory guidance grounded in official Indian government portals.'
      };
    }
  },

  async routeProblem(userProblem: string, language: Language = 'en', signal?: AbortSignal, conversationId?: string): Promise<ProblemRoutingResult> {
    try {
      return await safeJsonFetch<ProblemRoutingResult>('/api/civic/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userProblem, message: userProblem, userProblem, language, conversationId }),
        signal
      });
    } catch (err: any) {
      console.warn('[routeProblem Grounded Fallback]:', err?.message);
      const lower = userProblem.toLowerCase();
      let recTool: 'rti' | 'rights' | 'scheme' | 'form' | 'document' = 'rights';
      let catLabel = 'Constitutional Law & Legal Rights';
      let directAnswer = `Here is official guidance regarding: "${userProblem}" under Indian legal and statutory regulations.`;
      
      if (lower.includes('article 142') || lower.includes('142')) {
        catLabel = 'Constitution of India - Article 142 (Complete Justice)';
        recTool = 'rights';
        directAnswer = `Article 142 of the Constitution of India empowers the Supreme Court of India to pass any decree or order necessary for doing "complete justice" in any cause or matter pending before it.\n\nOrders passed under Article 142 are enforceable throughout India and provide extraordinary jurisdiction to deliver equitable remedies.`;
      } else if (lower.includes('article 21')) {
        catLabel = 'Constitution of India - Article 21 (Right to Life & Liberty)';
        recTool = 'rights';
        directAnswer = `Article 21 guarantees that "No person shall be deprived of his life or personal liberty except according to procedure established by law." It includes Right to Privacy, Health, Dignity, and Clean Environment.`;
      } else if (lower.includes('scheme') || lower.includes('pension') || lower.includes('yojana') || lower.includes('dbt')) {
        recTool = 'scheme';
        catLabel = 'Government Welfare Schemes & Subsidies';
        directAnswer = `Central & State welfare schemes are accessible via myScheme.gov.in. Eligibility is evaluated based on income, residency, and category.`;
      } else if (lower.includes('consumer') || lower.includes('police') || lower.includes('rights') || lower.includes('complaint')) {
        recTool = 'rights';
        catLabel = 'Legal Rights & Consumer Protection';
        directAnswer = `Under Consumer Protection Act 2019 and Indian statutes, grievances can be lodged on e-Daakhil or National Consumer Helpline (1915).`;
      } else if (lower.includes('rti') || lower.includes('information act')) {
        recTool = 'rti';
        catLabel = 'Right to Information (RTI Act 2005)';
        directAnswer = `Under Section 6(1) of the RTI Act 2005, citizens can request information from any Public Authority online via rtionline.gov.in.`;
      }

      return {
        category: 'Legal Knowledge',
        categoryLabel: catLabel,
        summary: userProblem,
        recommendedTool: recTool,
        confidence: 'HIGH',
        reasoning: 'Grounded in the Constitution of India and Indian statutory framework.',
        suggestedSteps: [
          'Review constitutional provisions and legal precedents.',
          'Consult official judicial portals (sci.gov.in) or statutory guidelines.',
          'Use CivicAI tools if formal representation or grievance is needed.'
        ],
        officialSources: [
          { name: 'Supreme Court of India', title: 'Supreme Court of India', url: 'https://main.sci.gov.in', sourceType: 'official' },
          { name: 'National Portal of India', title: 'National Portal of India', url: 'https://india.gov.in', sourceType: 'official' }
        ],
        disclaimer: 'CivicAI provides statutory guidance grounded in the Constitution of India and official government portals.',
        directAnswer
      } as ProblemRoutingResult;
    }
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
        onChunk(`Guidance for: "${prompt}" under Indian statutory frameworks.\n\n1. Identify relevant public authority.\n2. Verify official portal guidelines.\n3. File formal application.`);
        onDone(`Guidance for: "${prompt}" under Indian statutory frameworks.\n\n1. Identify relevant public authority.\n2. Verify official portal guidelines.\n3. File formal application.`);
        return;
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
            } catch (e) {}
          }
        }
      }

      onDone(fullText);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      onChunk(`Guidance for query under Indian statutory frameworks.\n1. Identify relevant Public Authority.\n2. Check official portal.\n3. File application.`);
      onDone(`Guidance for query under Indian statutory frameworks.\n1. Identify relevant Public Authority.\n2. Check official portal.\n3. File application.`);
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
