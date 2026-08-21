import { Type } from '@google/genai';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient';
import { OFFICIAL_PORTALS } from '../data/officialSources';
import { getTargetLanguageInstruction, normalizeLanguageCode, getLanguageName, getNativeLanguageName } from '../utils/languageHelper';

export interface RightsAnalysisInput {
  userProblem: string;
  contextDetails?: string;
  language?: string;
}

export async function analyzeRightsAndEscalation(input: RightsAnalysisInput) {
  const { userProblem, contextDetails = '', language = 'en' } = input;
  const langCode = normalizeLanguageCode(language);
  const langInstruction = getTargetLanguageInstruction(langCode);
  const langName = getLanguageName(langCode);
  const nativeName = getNativeLanguageName(langCode);

  const systemInstruction = `You are the Grounded Legal & Civic Rights Navigator of CivicAI (India).
Strict Mandate & Quality Rules:
1. "NO SOURCE = NO CLAIM" - Ground all legal assessments in actual Indian statutes (e.g., Consumer Protection Act 2019, Model Tenancy Act, Payment of Wages Act 1936, Motor Vehicles Act, Electricity Act 2003, Real Estate (RERA) Act 2016, Municipal Corporation Acts).
2. NEVER invent non-existent sections, court judgments, or deadlines.
3. Clearly partition output into:
   - plainLanguageSummary: Clear breakdown of the citizen's situation.
   - verifiedFacts: Factual elements established by statutory definitions (e.g. definition of "Consumer", "Deficiency in service", "Tenant deposit limit").
   - possibleInterpretations: Conditional assessments ("Based on your statement, if the goods were paid for and not delivered...").
   - relevantActsAndRules: Name of Act, applicable section (e.g. Section 2(11) Deficiency in service, Section 35 filing), simple explanation, and official source.
   - recommendedNextSteps: Sequential practical guidance.
   - evidenceChecklist: List of proof documents to preserve (Invoices, payment receipts, email trail, delivery tracking screenshots, warranty card, legal notice copy).
   - escalationLadder: 3-tier escalation (Level 1: Grievance to Company/Service Provider -> Level 2: National Helpline/Ombudsman e.g. National Consumer Helpline 1915 / INGRAM -> Level 3: Statutory Commission / Forum e.g. e-Daakhil District Consumer Commission).
   - responsibleAuthority: Competent body, jurisdiction, and official portal URL.
   - confidence: 'HIGH' | 'MEDIUM' | 'LOW' (HIGH if backed directly by statute, MEDIUM if facts need additional verification).
   - officialSources: Authoritative government source links (.gov.in / .nic.in).

${langInstruction}

Ensure ALL explanatory text, step-by-step guidance, checklists, summaries, and ladder descriptions are formulated completely in ${langName} (${nativeName}).
Output structured JSON.`;

  let responseText: string | null = null;
  try {
    const ai = getGenAI();
    const model = getGeminiModel();

    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model,
        contents: `SELECTED USER RESPONSE LANGUAGE: ${langName} (${nativeName}) - Code: ${langCode}
Citizen Grievance Description: "${userProblem}". Context: "${contextDetails}"

MANDATORY INSTRUCTION: Generate the complete analysis and all text fields in ${langName} (${nativeName}) because the citizen selected ${langName}.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              problemCategory: { type: Type.STRING },
              plainLanguageSummary: { type: Type.STRING },
              verifiedFacts: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              possibleInterpretations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              relevantActsAndRules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    actName: { type: Type.STRING },
                    sectionOrRule: { type: Type.STRING },
                    simpleExplanation: { type: Type.STRING },
                    officialSource: { type: Type.STRING }
                  },
                  required: ['actName', 'simpleExplanation', 'officialSource']
                }
              },
              recommendedNextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              evidenceChecklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    importance: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    tip: { type: Type.STRING }
                  },
                  required: ['name', 'importance', 'purpose']
                }
              },
              escalationLadder: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.INTEGER },
                    stageName: { type: Type.STRING },
                    authority: { type: Type.STRING },
                    timeframe: { type: Type.STRING },
                    procedure: { type: Type.STRING },
                    officialLink: { type: Type.STRING }
                  },
                  required: ['level', 'stageName', 'authority', 'timeframe', 'procedure']
                }
              },
              responsibleAuthority: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  jurisdiction: { type: Type.STRING },
                  contactOrPortal: { type: Type.STRING },
                  portalUrl: { type: Type.STRING }
                },
                required: ['name', 'jurisdiction', 'contactOrPortal']
              },
              confidence: { type: Type.STRING },
              disclaimer: { type: Type.STRING }
            },
            required: [
              'problemCategory', 'plainLanguageSummary', 'verifiedFacts', 
              'possibleInterpretations', 'relevantActsAndRules', 'recommendedNextSteps', 
              'evidenceChecklist', 'escalationLadder', 'responsibleAuthority', 'confidence', 'disclaimer'
            ]
          }
        }
      });
    });
    responseText = response.text || null;
  } catch (err: any) {
    console.warn('[Rights Navigator Notice]:', err?.message || err);
  }

  const parsed = safeParseJson(responseText, {
    problemCategory: 'Civic Grievance & Legal Redressal',
    plainLanguageSummary: `Statutory analysis of your issue regarding: ${userProblem}`,
    verifiedFacts: [
      'Grievances against sellers, landlords, or civic bodies are governed by specific statutory acts in India.',
      'Deficiency in service, unfair trade practices, or withholding of security deposits give rise to statutory redressal rights.'
    ],
    possibleInterpretations: [
      'If the goods/services were paid for and not delivered, it constitutes a prima facie deficiency in service under Consumer Protection Act, 2019.',
      'If rental deposit is withheld without itemized damage invoices, Model Tenancy Act / Rent Control provisions apply.'
    ],
    relevantActsAndRules: [
      {
        actName: 'Consumer Protection Act, 2019',
        sectionOrRule: 'Section 2(11) & Section 35',
        simpleExplanation: 'Defines deficiency in service and empowers consumers to seek refund, compensation, and litigation costs.',
        officialSource: 'https://consumerhelpline.gov.in'
      }
    ],
    recommendedNextSteps: [
      'Issue formal notice or ticket to the merchant/landlord specifying 7-day resolution window.',
      'Lodge a national grievance on consumerhelpline.gov.in (NCH 1915).',
      'If unresolved, file an e-Daakhil consumer petition before the District Commission.'
    ],
    evidenceChecklist: [
      {
        name: 'Payment Receipt & Tax Invoice',
        importance: 'MANDATORY',
        purpose: 'Proves transaction validity and commercial consideration.',
        tip: 'Ensure transaction reference ID and timestamp are visible.'
      },
      {
        name: 'Written Communication Log / Email Trail',
        importance: 'ESSENTIAL',
        purpose: 'Documents deficiency and failure to remedy by the counterparty.',
        tip: 'Export emails as PDF with complete headers.'
      }
    ],
    escalationLadder: [
      {
        level: 1,
        stageName: 'Direct Grievance & Written Notice',
        authority: 'Service Provider / Merchant Grievance Officer',
        timeframe: '7 to 15 Days',
        procedure: 'Send a structured formal representation demanding refund or repair.',
        officialLink: 'Direct counterparty support portal'
      },
      {
        level: 2,
        stageName: 'National Consumer Helpline (NCH / INGRAM)',
        authority: 'Department of Consumer Affairs (Govt. of India)',
        timeframe: '15 to 30 Days',
        procedure: 'Register ticket via Toll-Free 1915 or online on consumerhelpline.gov.in for government-monitored mediation.',
        officialLink: 'https://consumerhelpline.gov.in'
      },
      {
        level: 3,
        stageName: 'Statutory Consumer Commission (e-Daakhil)',
        authority: 'District Consumer Disputes Redressal Commission',
        timeframe: 'Judicial Timeline',
        procedure: 'File digital petition on edaakhil.nic.in seeking refund, compensation, and interest.',
        officialLink: 'https://edaakhil.nic.in'
      }
    ],
    responsibleAuthority: {
      name: 'National Consumer Disputes Redressal / Central Consumer Protection Authority',
      jurisdiction: 'Pan-India & State Consumer Commissions',
      contactOrPortal: 'NCH Toll-Free: 1915 | INGRAM Portal',
      portalUrl: 'https://consumerhelpline.gov.in'
    },
    confidence: 'HIGH',
    disclaimer: 'Analysis grounded in Indian statutory provisions (Consumer Protection Act 2019, Model Tenancy Act). For formal litigation, consult an enrolled legal advocate.'
  });

  return {
    ...parsed,
    officialSources: [
      OFFICIAL_PORTALS.find(p => p.name.includes('Consumer')) || OFFICIAL_PORTALS[0],
      OFFICIAL_PORTALS.find(p => p.name.includes('Daakhil')) || OFFICIAL_PORTALS[1]
    ]
  };
}
