import { Type } from '@google/genai';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient.js';
import { OFFICIAL_PORTALS } from '../data/officialSources.js';
import { serverCache } from '../cache.js';
import { getTargetLanguageInstruction, normalizeLanguageCode, getLanguageName, getNativeLanguageName } from '../utils/languageHelper.js';
import { contextManager } from '../contextManager.js';

export type IntentType = 
  | 'INFORMATION'
  | 'ACTION'
  | 'DOCUMENT'
  | 'ELIGIBILITY'
  | 'FORM'
  | 'DOCUMENT_INTERPRETATION'
  | 'GENERAL_CONVERSATION';

export interface RouterInput {
  message: string;
  conversationId?: string;
  language?: string;
}

export interface RouterOutput {
  intent: IntentType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  requiresTool: boolean;
  requiresClarification: boolean;
  directAnswer?: string;
  clarificationQuestion?: string;
  category: string;
  categoryLabel: string;
  summary: string;
  recommendedTool: 'rti' | 'rights' | 'scheme' | 'form' | 'document' | 'none';
  reasoning: string;
  suggestedSteps: string[];
  officialSources: any[];
  disclaimer: string;
  followUpActions?: Array<{
    label: string;
    actionType: 'tool' | 'query' | 'link';
    targetTool?: 'rti' | 'rights' | 'scheme' | 'form' | 'document';
    targetQuery?: string;
  }>;
}

const ACTION_LABELS: Record<string, Record<string, string>> = {
  rti: {
    en: 'Draft an RTI Application',
    hi: 'आरटीआई (RTI) आवेदन प्रारूप तैयार करें',
    mr: 'माहिती अधिकार (RTI) अर्ज मसुदा तयार करा',
    bn: 'আরটিআই (RTI) আবেদন খসড়া তৈরি করুন',
    te: 'RTI దరఖాస్తు ముసాయిదా రూపొందించండి',
    ta: 'RTI விண்ணப்ப வரைவை உருவாக்கவும்',
    gu: 'RTI અરજીનો મુસદ્દો તૈયાર કરો',
    kn: 'RTI ಅರ್ಜಿಯ ಕರಡು ರಚಿಸಿ',
    ml: 'RTI അപേക്ഷാ കരട് തയ്യാറാക്കുക',
    pa: 'RTI ਅਰਜ਼ੀ ਦਾ ਖਰੜਾ ਤਿਆਰ ਕਰੋ',
    or: 'RTI ଆବେଦନ ଡ୍ରାଫ୍ଟ ପ୍ରସ୍ତୁତ କରନ୍ତୁ',
    as: 'RTI আবেদন খচৰা প্ৰস্তুত কৰক',
    ur: 'آر ٹی آئی درخواست کا مسودہ تیار کریں',
    ne: 'RTI आवेदनको मस्यौदा तयार गर्नुहोस्'
  },
  scheme: {
    en: 'Check Scheme Eligibility',
    hi: 'सरकारी योजना पात्रता जांचें',
    mr: 'योजना पात्रता तपासा',
    bn: 'সরকারি প্রকল্পের যোগ্যতা যাচাই করুন',
    te: 'పథకం అర్హతను తనిఖీ చేయండి',
    ta: 'திட்ட தகுதியை சரிபார்க்கவும்',
    gu: 'યોજના પાત્રતા તપાસો',
    kn: 'ಯೋಜನೆಯ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
    ml: 'പദ്ധതി യോഗ്യത പരിശോധിക്കുക',
    pa: 'ਸਕੀਮ ਯੋਗਤਾ ਦੀ ਜਾਂਚ ਕਰੋ',
    or: 'ଯୋଜନା ଯୋଗ୍ୟତା ଯାଞ୍ଚ କରନ୍ତୁ',
    as: 'আঁচনিৰ যোগ্যতা পৰীক্ষা কৰক',
    ur: 'اسکیم کی اہلیت چیک کریں',
    ne: 'योजनाको योग्यता जाँच गर्नुहोस्'
  },
  rights: {
    en: 'Navigate Legal Rights & Escalation',
    hi: 'कानूनी अधिकार और निवारण चरण देखें',
    mr: 'कायदेशीर हक्क आणि तक्रार निवारण पायऱ्या पहा',
    bn: 'আইনি অধিকার ও প্রতিকার ধাপ দেখুন',
    te: 'చట్టపరమైన హక్కులు మరియు పరిష్కార దశలను చూడండి',
    ta: 'சட்ட உரிமைகள் & புகார் படிகளைப் பார்க்கவும்',
    gu: 'કાનૂની અધિકારો અને નિવારણ પગલાં જુઓ',
    kn: 'ಕಾನೂನು ಹಕ್ಕುಗಳು ಮತ್ತು ಪರಿಹಾರ ಹಂತಗಳನ್ನು ನೋಡಿ',
    ml: 'നിയമപരമായ അവകാശങ്ങളും പരിഹാര ഘട്ടങ്ങളും കാണുക',
    pa: 'ਕਾਨੂੰਨੀ ਅਧਿਕਾਰ ਅਤੇ ਹੱਲ ਦੇ ਕਦਮ ਦੇਖੋ',
    or: 'ଆଇନଗତ ଅଧିକାର ଏବଂ ସମାଧାନ ପଦକ୍ଷେପ ଦେଖନ୍ତୁ',
    as: 'আইনী অধিকাৰ আৰু প্ৰতিকাৰৰ পদক্ষেপ চাওক',
    ur: 'قانونی حقوق اور شکایات کے حل کے مراحل دیکھیں',
    ne: 'कानूनी अधिकार र निवारणका चरणहरू हेर्नुहोस्'
  }
};

export async function routeCivicProblem(input: RouterInput): Promise<RouterOutput> {
  const { message, conversationId, language: rawLanguage = 'en' } = input;
  const language = normalizeLanguageCode(rawLanguage);
  const trimmedMessage = message.trim();
  const lowerMsg = trimmedMessage.toLowerCase();

  const langName = getLanguageName(language);
  const nativeName = getNativeLanguageName(language);

  // Check cache first
  const cacheKey = `ai_router_${language}_${trimmedMessage}`;
  const cached = serverCache.get<RouterOutput>(cacheKey);
  if (cached) return cached;

  // Build Context History if conversationId exists
  let contextPrompt = '';
  if (conversationId) {
    contextPrompt = contextManager.getFormattedHistory(conversationId, 6);
  }

  const langInstruction = getTargetLanguageInstruction(language);

  const systemInstruction = `You are CivicAI Central Router, an expert AI for Indian civic, legal, and government welfare services.
Analyze the citizen's query and respond with structured JSON.

MANDATORY RULES:
1. Grounding: Rely strictly on Indian statutes, government portals (RTI Online, myScheme, e-Daakhil, CPGRAMS), and constitutional procedures.
2. Rule "NO SOURCE = NO CLAIM": Cite official frameworks or laws for every advice step.
3. Language: Formulate all text fields in ${langName} (${nativeName}).

JSON STRUCTURE REQUIRED:
{
  "intent": "INFORMATION" | "ACTION" | "ELIGIBILITY" | "FORM" | "DOCUMENT_INTERPRETATION" | "GENERAL_CONVERSATION",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "requiresTool": boolean,
  "requiresClarification": boolean,
  "directAnswer": "Comprehensive direct answer answering the citizen's query in detail",
  "clarificationQuestion": "Optional clarification if needed",
  "category": "Short Category Code",
  "categoryLabel": "Clear Category Title",
  "summary": "Brief summary",
  "recommendedTool": "rti" | "rights" | "scheme" | "form" | "document" | "none",
  "reasoning": "Legal basis and rationale",
  "suggestedSteps": ["Step 1...", "Step 2...", "Step 3..."],
  "disclaimer": "Official disclaimer"
}
${langInstruction}`;

  const prompt = `${contextPrompt ? `Conversation History:\n${contextPrompt}\n---\n` : ''}Language: ${langName} (${nativeName}) - Code: ${language}
Query: "${trimmedMessage}"`;

  const ai = getGenAI();
  const model = getGeminiModel();

  let parsed: any = null;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `${systemInstruction}\n\n${prompt}`,
      config: {
        maxOutputTokens: 1000
      }
    });

    if (response && response.text) {
      parsed = safeParseJson(response.text, null);
    }
  } catch (err: any) {
    console.warn('[AI Router] Gemini generation notice:', err?.message || err);
  }

  // Grounded fallback detector if remote model call did not parse
  if (!parsed) {
    let recTool: RouterOutput['recommendedTool'] = 'none';
    let intent: IntentType = 'INFORMATION';
    let directAns = `Here is official guidance regarding: "${trimmedMessage}" under Indian civic regulations.`;
    let catLabel = 'Civic Guidance & Legal Information';
    let steps = [
      'Verify the relevant government department or local public authority.',
      'Gather necessary documentation (Aadhaar, proof of grievance, or application details).',
      'Submit formal application through official portal or use the designated CivicAI tool.'
    ];

    if (lowerMsg.includes('rti') || lowerMsg.includes('information act') || lowerMsg.includes('public authority') || lowerMsg.includes('pao')) {
      recTool = 'rti';
      intent = 'ACTION';
      catLabel = 'Right to Information (RTI Act 2005)';
      directAns = `Under Section 6(1) of the RTI Act 2005, every Indian citizen has the statutory right to request information from any Public Authority. Applications can be filed online via rtionline.gov.in or directly with the Public Information Officer (PIO).`;
      steps = [
        'Identify the competent Public Information Officer (PIO) / Public Authority.',
        'Draft clear, specific RTI questions seeking factual records rather than opinions.',
        'Use CivicAI RTI Drafting Agent to format your formal Section 6(1) application.'
      ];
    } else if (lowerMsg.includes('scheme') || lowerMsg.includes('yojana') || lowerMsg.includes('pension') || lowerMsg.includes('ration') || lowerMsg.includes('dbt')) {
      recTool = 'scheme';
      intent = 'ELIGIBILITY';
      catLabel = 'Government Welfare Schemes & Subsidies';
      directAns = `Central and State Government welfare schemes are accessible via myScheme.gov.in and National Portal of India. Eligibility is evaluated based on income, state residency, category, and age.`;
      steps = [
        'Check detailed eligibility criteria on myScheme portal.',
        'Verify required documents (Aadhaar, Income Certificate, Bank Passbook).',
        'Use CivicAI Scheme Evaluator to match available welfare programs.'
      ];
    } else if (lowerMsg.includes('consumer') || lowerMsg.includes('police') || lowerMsg.includes('fir') || lowerMsg.includes('tenant') || lowerMsg.includes('complaint')) {
      recTool = 'rights';
      intent = 'ACTION';
      catLabel = 'Legal Rights & Consumer Protection';
      directAns = `Under the Consumer Protection Act 2019 and Indian statutory laws, citizens can file grievances through National Consumer Helpline (1915), e-Daakhil, or CPGRAMS portal for swift escalation.`;
      steps = [
        'Document all transaction receipts, agreements, or communications.',
        'Lodge a formal notice or complaint on e-Daakhil / National Consumer Helpline.',
        'Use CivicAI Rights Navigator to determine legal escalation options.'
      ];
    }

    parsed = {
      intent,
      confidence: 'HIGH',
      requiresTool: recTool !== 'none',
      requiresClarification: false,
      directAnswer: directAns,
      category: 'Civic Service',
      categoryLabel: catLabel,
      summary: trimmedMessage,
      recommendedTool: recTool,
      reasoning: 'Grounded in official Indian statutory frameworks (RTI Act 2005, Consumer Protection Act 2019, myScheme).',
      suggestedSteps: steps,
      disclaimer: 'CivicAI provides statutory information grounded in official Indian government portals.'
    };
  }

  // Pick grounded official sources
  const relevantSources = OFFICIAL_PORTALS.filter(p => {
    if (parsed.recommendedTool === 'rti' || lowerMsg.includes('rti')) return p.name.includes('RTI');
    if (parsed.recommendedTool === 'scheme' || lowerMsg.includes('scheme')) return p.name.includes('Scheme') || p.name.includes('DBT') || p.name.includes('Portal');
    if (parsed.recommendedTool === 'rights' || lowerMsg.includes('consumer')) return p.name.includes('Consumer') || p.name.includes('Daakhil') || p.name.includes('Legal');
    return p.isCentral;
  }).slice(0, 3).map(s => ({
    name: s.name,
    title: s.name,
    departmentOrMinistry: s.departmentOrMinistry,
    organization: s.departmentOrMinistry,
    portalUrl: s.portalUrl,
    url: s.portalUrl,
    isCentral: s.isCentral,
    description: s.description,
    sourceType: 'official',
    retrievedAt: new Date().toISOString().split('T')[0]
  }));

  // Build structured follow-up actions
  const followUpActions: RouterOutput['followUpActions'] = [];
  const rtiLabel = ACTION_LABELS.rti[language] || ACTION_LABELS.rti.en;
  const schemeLabel = ACTION_LABELS.scheme[language] || ACTION_LABELS.scheme.en;
  const rightsLabel = ACTION_LABELS.rights[language] || ACTION_LABELS.rights.en;

  if (parsed.recommendedTool === 'rti' || lowerMsg.includes('rti')) {
    followUpActions.push({ label: rtiLabel, actionType: 'tool', targetTool: 'rti', targetQuery: trimmedMessage });
  } else if (parsed.recommendedTool === 'scheme' || lowerMsg.includes('scheme')) {
    followUpActions.push({ label: schemeLabel, actionType: 'tool', targetTool: 'scheme', targetQuery: trimmedMessage });
  } else if (parsed.recommendedTool === 'rights' || lowerMsg.includes('consumer')) {
    followUpActions.push({ label: rightsLabel, actionType: 'tool', targetTool: 'rights', targetQuery: trimmedMessage });
  } else {
    followUpActions.push({ label: rtiLabel, actionType: 'tool', targetTool: 'rti', targetQuery: trimmedMessage });
    followUpActions.push({ label: schemeLabel, actionType: 'tool', targetTool: 'scheme', targetQuery: trimmedMessage });
  }

  const output: RouterOutput = {
    intent: parsed.intent || 'INFORMATION',
    confidence: parsed.confidence || 'HIGH',
    requiresTool: !!parsed.requiresTool,
    requiresClarification: !!parsed.requiresClarification,
    directAnswer: parsed.directAnswer || `Official civic guidance for: ${trimmedMessage}`,
    clarificationQuestion: parsed.clarificationQuestion,
    category: parsed.category || 'General Civic Query',
    categoryLabel: parsed.categoryLabel || 'Civic Knowledge & Guidance',
    summary: parsed.summary || trimmedMessage,
    recommendedTool: parsed.recommendedTool || 'none',
    reasoning: parsed.reasoning || 'Grounded in Indian civic and legal framework.',
    suggestedSteps: Array.isArray(parsed.suggestedSteps) && parsed.suggestedSteps.length > 0 ? parsed.suggestedSteps : [
      'Identify relevant Public Authority or Department',
      'Review statutory guidelines on official portals',
      'Submit application or grievance through official channels'
    ],
    officialSources: relevantSources,
    disclaimer: parsed.disclaimer || 'CivicAI provides statutory information grounded in official Indian government portals.',
    followUpActions
  };

  serverCache.set(cacheKey, output, 3600);
  return output;
}
