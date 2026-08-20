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

  // Multi-turn context
  let contextPrompt = '';
  if (conversationId) {
    contextPrompt = contextManager.formatContextPrompt(conversationId);
  }

  const cacheKey = `route:${language}:${conversationId || 'none'}:${trimmedMessage.toLowerCase()}`;
  const cached = serverCache.get<RouterOutput>(cacheKey);
  if (cached) {
    return cached;
  }

  const langInstruction = getTargetLanguageInstruction(language);
  const langName = getLanguageName(language);
  const nativeName = getNativeLanguageName(language);

  const systemInstruction = `You are the Central AI Intelligence & Routing Engine for CivicAI — India's Civic & Legal Empowerment Platform.
Strict Core Mandates:
1. "NO SOURCE = NO CLAIM" — Always ground legal concepts in genuine Indian statutes (e.g. RTI Act 2005, Consumer Protection Act 2019, Model Tenancy Act, Payment of Wages Act, myScheme).
2. SIMPLE QUESTIONS MUST GET SIMPLE, DIRECT ANSWERS:
   - If the user asks a general informational question (e.g., "What is RTI?", "What is a consumer complaint?", "What is myScheme?", "What does Public Authority mean?", "How can I file an RTI?", "What documents are required?"):
     - Set intent = "INFORMATION".
     - Set requiresTool = false.
     - Provide a clear, comprehensive, plain-language direct answer in 'directAnswer' in ${langName} (${nativeName}).
     - Do NOT ask unnecessary personal/district questions.
     - Then offer a helpful next step (e.g. "If you want, I can also help you draft an RTI application.").
   - If the user says basic conversational phrases ("Hello", "Hi", "Thanks", "Thank you", "Okay", "Can you explain simply?"):
     - Set intent = "GENERAL_CONVERSATION".
     - Set requiresTool = false.
     - Provide a warm, friendly response in 'directAnswer' in ${langName} (${nativeName}) explaining how CivicAI can help with RTI drafts, consumer disputes, welfare schemes, government forms, or notice interpretations.

3. ASK QUESTIONS ONLY WHEN STRICTLY REQUIRED:
   - When drafting or taking action (e.g. "I want to draft an RTI about road construction"), ask only the missing parameters needed for the draft (location/department/timeframe).
   - NEVER ask for Aadhaar, phone number, full personal address, or date of birth unless strictly required for a formal representation.
   - Do NOT force document upload unless the user is specifically asking to analyze a document ("What does this notice mean?").

4. DISTINGUISH 7 INTENTS:
   - 'INFORMATION': Educational/informational civic question -> Direct answer in 'directAnswer', requiresTool = false.
   - 'GENERAL_CONVERSATION': Greetings, thanks, conversational cues -> Friendly response in 'directAnswer', requiresTool = false.
   - 'ACTION': Citizen has a concrete grievance/dispute/issue -> Route to appropriate tool (requiresTool = true).
   - 'DOCUMENT': Citizen explicitly wants to draft an RTI or legal document -> Route to 'rti' (requiresTool = true).
   - 'ELIGIBILITY': Citizen wants to check welfare schemes/scholarships -> Route to 'scheme' (requiresTool = true).
   - 'FORM': Citizen wants help filling an official form/application -> Route to 'form' (requiresTool = true).
   - 'DOCUMENT_INTERPRETATION': Citizen has a government notice/circular to understand -> Route to 'document' (requiresTool = true). If no document is provided, set requiresClarification = true and ask to paste/upload the notice.

5. TOLERANCE FOR TYPOS, HINGLISH, INFORMAL, AND MIXED INDIAN LANGUAGES:
   - Seamlessly understand inputs like "wat is rti", "how file rti", "mera road ka kam nhi hua", "scheme for student", "mujhe rti krna hai", "RTI kaise file kare?", "mera landlord deposit return nahi kar raha", "मुझे RTI के बारे में बताओ", "RTI எப்படி file செய்வது?".

6. CONTEXT AWARENESS:
   - If previous messages exist in context, resolve references (e.g. "Can I use it against my municipality?" -> "it" refers to RTI; "What documents do I need?" -> relates to earlier topic).

${langInstruction}`;

  const prompt = `${contextPrompt ? `Conversation History:\n${contextPrompt}\n---\n` : ''}SELECTED CITIZEN RESPONSE LANGUAGE: ${langName} (${nativeName}) - Code: ${language}
Citizen Query: "${trimmedMessage}"

MANDATORY INSTRUCTION: You MUST formulate ALL fields (directAnswer, clarificationQuestion, categoryLabel, summary, reasoning, suggestedSteps, disclaimer) in ${langName} (${nativeName}) script and vocabulary.`;

  const ai = getGenAI();
  const model = getGeminiModel();

  let parsed: any = null;

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              confidence: { type: Type.STRING },
              requiresTool: { type: Type.BOOLEAN },
              requiresClarification: { type: Type.BOOLEAN },
              directAnswer: { type: Type.STRING },
              clarificationQuestion: { type: Type.STRING },
              category: { type: Type.STRING },
              categoryLabel: { type: Type.STRING },
              summary: { type: Type.STRING },
              recommendedTool: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              suggestedSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              disclaimer: { type: Type.STRING }
            },
            required: ['intent', 'confidence', 'requiresTool', 'category', 'categoryLabel', 'summary', 'recommendedTool', 'reasoning', 'suggestedSteps', 'disclaimer']
          }
        }
      });
    });

    parsed = safeParseJson(response.text, null);
  } catch (err: any) {
    console.warn('[AI Router] Gemini call fallback:', err);
  }

  // Graceful fallback if Gemini failed
  if (!parsed) {
    parsed = {
      intent: 'INFORMATION',
      confidence: 'HIGH',
      requiresTool: false,
      requiresClarification: false,
      directAnswer: `Informational guidance regarding: ${trimmedMessage}`,
      category: 'General Civic Query',
      categoryLabel: 'Civic Knowledge & Guidance',
      summary: trimmedMessage,
      recommendedTool: 'none',
      reasoning: 'Grounded in Indian civic and legal framework.',
      suggestedSteps: [
        'Identify the relevant authority or department',
        'Review statutory rights and procedure',
        'Proceed with official representation or application'
      ],
      disclaimer: 'CivicAI provides general civic information.'
    };
  }

  // Map recommended tool
  const cat = (parsed.category || '').toLowerCase();
  const toolName = (parsed.recommendedTool || '').toLowerCase();

  // Pick grounded official sources
  const relevantSources = OFFICIAL_PORTALS.filter(p => {
    if (toolName === 'rti' || cat.includes('rti') || trimmedMessage.toLowerCase().includes('rti')) {
      return p.name.includes('RTI');
    }
    if (toolName === 'scheme' || cat.includes('scheme') || cat.includes('welfare')) {
      return p.name.includes('Scheme') || p.name.includes('DBT') || p.name.includes('Portal');
    }
    if (toolName === 'rights' || cat.includes('consumer') || cat.includes('tenant')) {
      return p.name.includes('Consumer') || p.name.includes('Daakhil') || p.name.includes('Legal');
    }
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

  // Build structured follow-up suggestions in selected language
  const followUpActions: RouterOutput['followUpActions'] = [];
  if (parsed.intent === 'INFORMATION' || parsed.intent === 'GENERAL_CONVERSATION') {
    const rtiLabel = ACTION_LABELS.rti[language] || ACTION_LABELS.rti.en;
    const schemeLabel = ACTION_LABELS.scheme[language] || ACTION_LABELS.scheme.en;
    const rightsLabel = ACTION_LABELS.rights[language] || ACTION_LABELS.rights.en;

    if (toolName === 'rti' || cat.includes('rti')) {
      followUpActions.push({
        label: rtiLabel,
        actionType: 'tool',
        targetTool: 'rti',
        targetQuery: trimmedMessage
      });
    } else if (toolName === 'scheme' || cat.includes('scheme')) {
      followUpActions.push({
        label: schemeLabel,
        actionType: 'tool',
        targetTool: 'scheme',
        targetQuery: trimmedMessage
      });
    } else if (toolName === 'rights' || cat.includes('consumer') || cat.includes('tenant')) {
      followUpActions.push({
        label: rightsLabel,
        actionType: 'tool',
        targetTool: 'rights',
        targetQuery: trimmedMessage
      });
    }
  }

  const result: RouterOutput = {
    intent: (parsed.intent as IntentType) || 'INFORMATION',
    confidence: (parsed.confidence as any) || 'HIGH',
    requiresTool: !!parsed.requiresTool,
    requiresClarification: !!parsed.requiresClarification,
    directAnswer: parsed.directAnswer || parsed.summary || trimmedMessage,
    clarificationQuestion: parsed.clarificationQuestion,
    category: parsed.category || 'Other civic issue',
    categoryLabel: parsed.categoryLabel || 'Civic Knowledge & Action',
    summary: parsed.summary || trimmedMessage,
    recommendedTool: (parsed.recommendedTool as any) || 'none',
    reasoning: parsed.reasoning || 'Grounded response aligned with Indian statutory framework.',
    suggestedSteps: Array.isArray(parsed.suggestedSteps) && parsed.suggestedSteps.length > 0
      ? parsed.suggestedSteps
      : [
          'Review your statutory rights and entitlements',
          'Gather supporting correspondence or proof',
          'Submit representation to the competent authority'
        ],
    officialSources: relevantSources,
    disclaimer: parsed.disclaimer || 'CivicAI is an informational navigation platform, not a replacement for formal legal counsel.',
    followUpActions
  };

  // Record in context manager if conversationId was supplied
  if (conversationId) {
    contextManager.addMessage(conversationId, 'user', trimmedMessage);
    contextManager.addMessage(conversationId, 'assistant', result.directAnswer || result.summary);
  }

  serverCache.set(cacheKey, result, 3600);
  return result;
}
