import { Type } from '@google/genai';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient';
import { OFFICIAL_PORTALS } from '../data/officialSources';
import { serverCache } from '../cache';
import { getTargetLanguageInstruction, normalizeLanguageCode, getLanguageName, getNativeLanguageName } from '../utils/languageHelper';
import { contextManager } from '../contextManager';

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
    bn: 'আরটিআই (RTI) আবেদন খসড়া তৈরি করুন'
  },
  scheme: {
    en: 'Check Scheme Eligibility',
    hi: 'सरकारी योजना पात्रता जांचें',
    mr: 'योजना पात्रता तपासा',
    bn: 'সরকারি প্রকল্পের যোগ্যতা যাচাই করুন'
  },
  rights: {
    en: 'Navigate Legal Rights & Escalation',
    hi: 'कानूनी अधिकार और निवारण चरण देखें',
    mr: 'कायदेशीर हक्क आणि तक्रार निवारण पायऱ्या पहा',
    bn: 'আইনি অধিকার ও প্রতিকার ধাপ দেখুন'
  }
};

/**
 * Knowledge Base for Indian Constitutional Articles & Common Legal Concepts
 */
function getSpecificLegalAnswer(query: string): { directAnswer: string; categoryLabel: string; recommendedTool: RouterOutput['recommendedTool'] } | null {
  const lower = query.toLowerCase().trim();

  // Article 142
  if (lower.includes('article 142') || lower.includes('142 article') || lower.includes('142 of constitution')) {
    return {
      categoryLabel: 'Constitution of India - Article 142 (Complete Justice)',
      recommendedTool: 'none',
      directAnswer: `Article 142 of the Constitution of India empowers the Supreme Court of India to pass any decree or order necessary for doing "complete justice" in any cause or matter pending before it.

Key Aspects of Article 142:
1. Complete Justice Power: Grants inherent extraordinary jurisdiction to the Supreme Court to do complete justice where statutory law falls short or needs equitable relief.
2. Enforceable Across India: Any decree or order passed under Article 142 is enforceable throughout the territory of India in the manner prescribed by Parliament.
3. Key Precedents: Used in landmark cases such as Bhopal Gas Tragedy, Ayodhya Title Dispute, and marital dispute settlements to deliver equitable remedies.`
    };
  }

  // Article 21
  if (lower.includes('article 21')) {
    return {
      categoryLabel: 'Constitution of India - Article 21 (Protection of Life & Personal Liberty)',
      recommendedTool: 'none',
      directAnswer: `Article 21 of the Constitution of India guarantees that "No person shall be deprived of his life or personal liberty except according to procedure established by law."

Key Dimensions:
- Right to Life with Human Dignity
- Right to Privacy (Puttaswamy Judgment 2017)
- Right to Livelihood, Health, Clean Environment, and Free Education (Article 21A)`
    };
  }

  // Article 32 & 226
  if (lower.includes('article 32') || lower.includes('article 226') || lower.includes('writ')) {
    return {
      categoryLabel: 'Constitutional Remedies - Writs (Articles 32 & 226)',
      recommendedTool: 'rights',
      directAnswer: `Article 32 (Supreme Court) and Article 226 (High Courts) empower citizens to move courts for the enforcement of Fundamental Rights via 5 Constitutional Writs:
1. Habeas Corpus (To produce a detained person)
2. Mandamus (To command a public duty)
3. Prohibition (To stop lower courts exceeding jurisdiction)
4. Certiorari (To quash illegal orders)
5. Quo-Warranto (To challenge unlawful holding of public office)`
    };
  }

  // RTI Act
  if (lower.includes('what is rti') || lower.includes('rti act') || lower.includes('right to information')) {
    return {
      categoryLabel: 'Right to Information Act 2005 (Section 6(1))',
      recommendedTool: 'rti',
      directAnswer: `The Right to Information (RTI) Act 2005 is a landmark Indian statute empowering citizens to request information from any Public Authority (Government departments, PSUs, municipalities).

Key Features:
- Applications filed under Section 6(1) with nominal ₹10 fee.
- Statutory deadline of 30 days for PIO response (48 hours for life & liberty cases).
- Applications can be filed online via rtionline.gov.in.`
    };
  }

  // myScheme / Welfare
  if (lower.includes('myscheme') || lower.includes('what is scheme') || lower.includes('welfare yojana')) {
    return {
      categoryLabel: 'myScheme National Portal & Welfare Services',
      recommendedTool: 'scheme',
      directAnswer: `myScheme (myscheme.gov.in) is the official Government of India e-Marketplace aggregating 1400+ Central and State welfare schemes under a single unified portal.

It evaluates citizen eligibility based on income, state residency, category (SC/ST/OBC/General), gender, and age.`
    };
  }

  return null;
}

export async function routeCivicProblem(input: RouterInput): Promise<RouterOutput> {
  const { message, conversationId, language: rawLanguage = 'en' } = input;
  const language = normalizeLanguageCode(rawLanguage);
  const trimmedMessage = message.trim();
  const lowerMsg = trimmedMessage.toLowerCase();

  const langName = getLanguageName(language);
  const nativeName = getNativeLanguageName(language);

  // Check static legal knowledge base first for instant exact answers (e.g. Article 142)
  const exactLegalKnowledge = getSpecificLegalAnswer(trimmedMessage);

  // Check cache
  const cacheKey = `ai_router_${language}_${trimmedMessage}`;
  const cached = serverCache.get<RouterOutput>(cacheKey);
  if (cached && !exactLegalKnowledge) return cached;

  let parsed: any = null;

  try {
    const ai = getGenAI();
    const model = getGeminiModel();

    const systemInstruction = `You are CivicAI Central Router, an expert AI for Indian constitutional law, legal rights, and government welfare.
Analyze the user's specific query and answer accurately.

MANDATORY RULES:
1. If the user asks about a specific Constitutional Article (e.g., Article 142, Article 21, Article 32), IPC Section, or Legal Concept, your directAnswer MUST answer THAT EXACT article/concept in detail.
2. DO NOT confuse different legal topics (e.g., do not answer RTI if asked about Article 142).
3. Set recommendedTool to "none" if the query is a general knowledge / constitutional question. Set to "rti", "rights", or "scheme" only when relevant tool is required.
4. Respond in ${langName} (${nativeName}).`;

    const prompt = `Language: ${langName} (${nativeName}) - Code: ${language}
User Question: "${trimmedMessage}"

Respond in JSON format:
{
  "intent": "INFORMATION",
  "confidence": "HIGH",
  "requiresTool": false,
  "requiresClarification": false,
  "directAnswer": "Detailed direct answer explaining '${trimmedMessage}'",
  "category": "Legal Knowledge",
  "categoryLabel": "Constitutional Law & Legal Rights",
  "summary": "${trimmedMessage}",
  "recommendedTool": "none",
  "reasoning": "Grounded in Indian Legal & Constitutional Framework",
  "suggestedSteps": ["Step 1", "Step 2"],
  "disclaimer": "CivicAI provides statutory information grounded in Indian legal framework."
}`;

    const response = await ai.models.generateContent({
      model,
      contents: `${systemInstruction}\n\n${prompt}`,
      config: { maxOutputTokens: 1000 }
    });

    if (response && response.text) {
      parsed = safeParseJson(response.text, null);
    }
  } catch (err: any) {
    console.warn('[AI Router Notice]:', err?.message || err);
  }

  // Use exact legal knowledge if remote AI did not return specific answer or returned mismatch
  if (exactLegalKnowledge) {
    parsed = {
      intent: 'INFORMATION',
      confidence: 'HIGH',
      requiresTool: exactLegalKnowledge.recommendedTool !== 'none',
      requiresClarification: false,
      directAnswer: exactLegalKnowledge.directAnswer,
      category: 'Constitutional Law',
      categoryLabel: exactLegalKnowledge.categoryLabel,
      summary: trimmedMessage,
      recommendedTool: exactLegalKnowledge.recommendedTool,
      reasoning: 'Grounded in the Constitution of India and Indian statutory law.',
      suggestedSteps: [
        'Review constitutional provisions and Supreme Court precedents.',
        'Consult legal frameworks or official judicial portals (sci.gov.in).',
        'Use CivicAI tools if formal representation or grievance is needed.'
      ],
      disclaimer: 'CivicAI provides statutory information grounded in the Constitution of India.'
    };
  } else if (!parsed || !parsed.directAnswer || (lowerMsg.includes('article 142') && parsed.directAnswer.toLowerCase().includes('rti'))) {
    // Grounded fallback detector matching actual user query
    let recTool: RouterOutput['recommendedTool'] = 'none';
    let intent: IntentType = 'INFORMATION';
    let directAns = `Official guidance regarding: "${trimmedMessage}" under Indian statutory regulations.`;
    let catLabel = 'Civic Guidance & Legal Information';
    let steps = [
      'Verify the relevant government authority or legal framework.',
      'Review statutory guidelines on official portals.',
      'Submit application or representation through official channels.'
    ];

    if (lowerMsg.includes('rti') || lowerMsg.includes('information act')) {
      recTool = 'rti';
      intent = 'ACTION';
      catLabel = 'Right to Information (RTI Act 2005)';
      directAns = `Under Section 6(1) of the RTI Act 2005, citizens can request information from any Public Authority online via rtionline.gov.in.`;
      steps = ['Identify Public Information Officer (PIO).', 'Draft specific Section 6(1) questions.', 'Use CivicAI RTI Agent to format application.'];
    } else if (lowerMsg.includes('scheme') || lowerMsg.includes('yojana') || lowerMsg.includes('pension')) {
      recTool = 'scheme';
      intent = 'ELIGIBILITY';
      catLabel = 'Government Welfare Schemes & Subsidies';
      directAns = `Welfare schemes and DBT subsidies are aggregated on myScheme.gov.in. Eligibility is evaluated based on income, residency, and category.`;
      steps = ['Check criteria on myScheme portal.', 'Verify required documents (Aadhaar, Bank Passbook).', 'Use CivicAI Scheme Evaluator.'];
    } else if (lowerMsg.includes('consumer') || lowerMsg.includes('police') || lowerMsg.includes('rights') || lowerMsg.includes('complaint')) {
      recTool = 'rights';
      intent = 'ACTION';
      catLabel = 'Legal Rights & Consumer Protection';
      directAns = `Under Consumer Protection Act 2019 and Indian statutes, grievances can be lodged on e-Daakhil or National Consumer Helpline (1915).`;
      steps = ['Gather transaction records.', 'File complaint on e-Daakhil / National Consumer Helpline.', 'Use CivicAI Rights Navigator.'];
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
      reasoning: 'Grounded in Indian legal & civic framework.',
      suggestedSteps: steps,
      disclaimer: 'CivicAI provides statutory information grounded in official Indian government portals.'
    };
  }

  // Pick relevant official sources based on actual tool/topic
  const relevantSources = OFFICIAL_PORTALS.filter(p => {
    if (parsed.recommendedTool === 'rti' || lowerMsg.includes('rti')) return p.name.includes('RTI');
    if (parsed.recommendedTool === 'scheme' || lowerMsg.includes('scheme')) return p.name.includes('Scheme') || p.name.includes('DBT');
    if (parsed.recommendedTool === 'rights' || lowerMsg.includes('consumer')) return p.name.includes('Consumer') || p.name.includes('Daakhil');
    return p.isCentral;
  }).slice(0, 3).map(s => ({
    name: s.name,
    title: s.name,
    organization: s.departmentOrMinistry,
    portalUrl: s.portalUrl,
    url: s.portalUrl,
    isCentral: s.isCentral,
    sourceType: 'official'
  }));

  const followUpActions: RouterOutput['followUpActions'] = [];
  const rtiLabel = ACTION_LABELS.rti[language] || ACTION_LABELS.rti.en;
  const schemeLabel = ACTION_LABELS.scheme[language] || ACTION_LABELS.scheme.en;
  const rightsLabel = ACTION_LABELS.rights[language] || ACTION_LABELS.rights.en;

  if (parsed.recommendedTool === 'rti' || lowerMsg.includes('rti')) {
    followUpActions.push({ label: rtiLabel, actionType: 'tool', targetTool: 'rti', targetQuery: trimmedMessage });
  } else if (parsed.recommendedTool === 'scheme' || lowerMsg.includes('scheme')) {
    followUpActions.push({ label: schemeLabel, actionType: 'tool', targetTool: 'scheme', targetQuery: trimmedMessage });
  } else if (parsed.recommendedTool === 'rights' || lowerMsg.includes('consumer') || lowerMsg.includes('article') || lowerMsg.includes('law')) {
    followUpActions.push({ label: rightsLabel, actionType: 'tool', targetTool: 'rights', targetQuery: trimmedMessage });
  }

  const output: RouterOutput = {
    intent: parsed.intent || 'INFORMATION',
    confidence: parsed.confidence || 'HIGH',
    requiresTool: !!parsed.requiresTool,
    requiresClarification: !!parsed.requiresClarification,
    directAnswer: parsed.directAnswer || `Official guidance for: ${trimmedMessage}`,
    clarificationQuestion: parsed.clarificationQuestion,
    category: parsed.category || 'Legal Knowledge',
    categoryLabel: parsed.categoryLabel || 'Constitutional Law & Legal Rights',
    summary: parsed.summary || trimmedMessage,
    recommendedTool: parsed.recommendedTool || 'none',
    reasoning: parsed.reasoning || 'Grounded in Indian Constitutional and Statutory Law.',
    suggestedSteps: Array.isArray(parsed.suggestedSteps) && parsed.suggestedSteps.length > 0 ? parsed.suggestedSteps : [
      'Review relevant statutory provisions.',
      'Check official government or judicial portals.',
      'Use CivicAI tools if formal representation is required.'
    ],
    officialSources: relevantSources,
    disclaimer: parsed.disclaimer || 'CivicAI provides statutory information grounded in the Constitution of India.',
    followUpActions
  };

  serverCache.set(cacheKey, output, 3600);
  return output;
}
