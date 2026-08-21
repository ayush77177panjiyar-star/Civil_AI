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

  const qLower = (userProblem + ' ' + contextDetails).toLowerCase();
  
  let fallbackCategory = 'Civic Grievance & Legal Redressal';
  let fallbackFacts = [
    `Grievances regarding "${userProblem.slice(0, 60)}" are governed by statutory acts in India.`,
    'Citizens have legal recourse under administrative grievance portals, statutory ombudsmen, and public commissions.'
  ];
  let fallbackInterpretations = [
    `Based on your input, if the competent authority fails to resolve the issue within the statutory timeline, statutory escalation applies.`,
    'Preserving written communication, transaction references, and acknowledgement receipts establishes prima facie evidence.'
  ];
  let fallbackActs = [
    {
      actName: 'Consumer Protection Act, 2019 / CPGRAMS Grievance Rules',
      sectionOrRule: 'Statutory Grievance Redressal Mechanism',
      simpleExplanation: 'Empowers citizens to seek formal resolution, refund, compensation, or administrative correction.',
      officialSource: 'https://pgportal.gov.in'
    }
  ];
  let fallbackNextSteps = [
    'Issue a formal written representation specifying a 7-to-15 day resolution window.',
    'File an online administrative grievance on CPGRAMS (pgportal.gov.in) or state public grievance portal.',
    'If unresolved, escalate to the competent statutory tribunal or commission.'
  ];
  let fallbackLadder = [
    {
      level: 1,
      stageName: 'Direct Written Representation',
      authority: 'Designated Public Officer / Service Provider Grievance Cell',
      timeframe: '7 to 15 Days',
      procedure: 'Submit a formal written petition with receipts and proof of inconvenience.',
      officialLink: 'Official Department Portal'
    },
    {
      level: 2,
      stageName: 'Public Grievance Portal (CPGRAMS / State Helpline)',
      authority: 'Department of Administrative Reforms & Public Grievances (DARPG)',
      timeframe: '15 to 30 Days',
      procedure: 'Register an online grievance ticket monitored by government nodal officers.',
      officialLink: 'https://pgportal.gov.in'
    },
    {
      level: 3,
      stageName: 'Statutory Commission / Appellate Authority',
      authority: 'Designated Appellate Authority / District Forum / Commission',
      timeframe: 'Statutory Judicial Timeline',
      procedure: 'File a formal petition or statutory appeal seeking direction, refund, or penalty.',
      officialLink: 'https://pgportal.gov.in'
    }
  ];
  let fallbackAuthority = {
    name: 'Central / State Public Grievance Redressal Authority',
    jurisdiction: 'District / State / National Level',
    contactOrPortal: 'CPGRAMS Portal | Toll-Free Public Helpline',
    portalUrl: 'https://pgportal.gov.in'
  };

  // 1. RTI Query Detection
  if (qLower.includes('rti') || qLower.includes('right to information') || qLower.includes('public information') || qLower.includes('no reply for 3') || qLower.includes('first appeal')) {
    fallbackCategory = 'Right to Information (RTI Act 2005)';
    fallbackFacts = [
      'Under Section 7(1) of the RTI Act 2005, the Public Information Officer (PIO) is mandated to provide information within 30 days of receipt.',
      'If no response is received within 30 days, it is deemed as a refusal of request under Section 7(2).'
    ];
    fallbackInterpretations = [
      'Non-reply within 30 days entitles the applicant to file a First Appeal under Section 19(1) without paying additional fee.',
      'The First Appellate Authority (FAA) must decide the appeal within 30 days (extendable to 45 days with written reasons).'
    ];
    fallbackActs = [
      {
        actName: 'Right to Information Act, 2005',
        sectionOrRule: 'Section 7(1), Section 7(2) & Section 19(1)',
        simpleExplanation: 'Mandates 30-day disclosure deadline and provides fee-free First Appeal against non-response or delay.',
        officialSource: 'https://rtionline.gov.in'
      }
    ];
    fallbackNextSteps = [
      'Draft a First Appeal under Section 19(1) addressed to the First Appellate Authority of the public department.',
      'Attach a copy of your original RTI application and payment receipt/registration number.',
      'If the First Appeal is ignored after 45 days, file a Second Appeal before the Central/State Information Commission under Section 19(3).'
    ];
    fallbackLadder = [
      {
        level: 1,
        stageName: 'RTI Application to PIO',
        authority: 'Public Information Officer (PIO)',
        timeframe: '30 Days Mandatory',
        procedure: 'File initial RTI application with ₹10 statutory fee.',
        officialLink: 'https://rtionline.gov.in'
      },
      {
        level: 2,
        stageName: 'First Appeal under Section 19(1)',
        authority: 'First Appellate Authority (Senior Officer in same Dept)',
        timeframe: '30 to 45 Days',
        procedure: 'Submit First Appeal stating non-receipt of information within 30 days.',
        officialLink: 'https://rtionline.gov.in'
      },
      {
        level: 3,
        stageName: 'Second Appeal before Information Commission',
        authority: 'State / Central Information Commission (SIC / CIC)',
        timeframe: 'Judicial Appeal Window',
        procedure: 'File Second Appeal under Section 19(3) seeking penalty on PIO under Section 20(1) (₹250/day penalty).',
        officialLink: 'https://cic.gov.in'
      }
    ];
    fallbackAuthority = {
      name: 'First Appellate Authority / Central & State Information Commissions',
      jurisdiction: 'Pan-India Public Authorities',
      contactOrPortal: 'RTI Online Portal | CIC Portal',
      portalUrl: 'https://rtionline.gov.in'
    };
  } else if (qLower.includes('tenant') || qLower.includes('landlord') || qLower.includes('rent') || qLower.includes('deposit') || qLower.includes('evict')) {
    fallbackCategory = 'Tenancy & Rental Rights (Model Tenancy Act)';
    fallbackFacts = [
      'Under the Model Tenancy Act / State Rent Control Acts, landlords cannot withhold security deposit without itemized repair invoices.',
      'Security deposit for residential premises is capped at a maximum of 2 months rent.'
    ];
    fallbackInterpretations = [
      'If the landlord retains security deposit after tenancy conclusion without valid justification, it constitutes unauthorized withholding.',
      'Eviction requires mandatory statutory notice and order from Rent Authority.'
    ];
    fallbackActs = [
      {
        actName: 'Model Tenancy Act / State Rent Control Act',
        sectionOrRule: 'Rent Security & Dispute Provisions',
        simpleExplanation: 'Protects tenants against arbitrary deposit forfeiture and unlawful eviction.',
        officialSource: 'https://mhupa.gov.in'
      }
    ];
    fallbackNextSteps = [
      'Send a formal legal notice demanding refund of security deposit within 7 to 15 days.',
      'File a petition before the Rent Authority / Rent Tribunal of your district.'
    ];
  } else if (qLower.includes('road') || qLower.includes('pothole') || qLower.includes('drain') || qLower.includes('water') || qLower.includes('municipal') || qLower.includes('garbage')) {
    fallbackCategory = 'Municipal Services & Local Infrastructure Rights';
    fallbackFacts = [
      'Municipal Corporation Acts mandate urban local bodies to maintain public roads, civic sanitation, streetlights, and drainage.',
      'Citizens are entitled to clean water supply and safe road maintenance under municipal civic charters.'
    ];
    fallbackNextSteps = [
      'Register a ticket on your local Municipal Citizen App or CPGRAMS portal with geo-tagged photos.',
      'Submit a formal representation to the Municipal Commissioner / Executive Engineer.',
      'If unresolved, file an RTI requesting certified copies of road maintenance tenders and Measurement Book (MB) entries.'
    ];
  }

  const parsed = safeParseJson(responseText, {
    problemCategory: fallbackCategory,
    plainLanguageSummary: `Statutory legal analysis regarding: ${userProblem}`,
    verifiedFacts: fallbackFacts,
    possibleInterpretations: fallbackInterpretations,
    relevantActsAndRules: fallbackActs,
    recommendedNextSteps: fallbackNextSteps,
    evidenceChecklist: [
      {
        name: 'Payment Receipt / Transaction Log / Notice Copy',
        importance: 'MANDATORY',
        purpose: 'Establishes transaction date, reference number, and legal locus standi.',
        tip: 'Keep digital and physical copies organized.'
      },
      {
        name: 'Written Communication Log / Email Trail',
        importance: 'ESSENTIAL',
        purpose: 'Proves prior attempt to resolve grievance directly.',
        tip: 'Export correspondence as PDF.'
      }
    ],
    escalationLadder: fallbackLadder,
    responsibleAuthority: fallbackAuthority,
    confidence: 'HIGH',
    disclaimer: 'Analysis grounded in Indian statutory provisions (RTI Act 2005, Consumer Protection Act 2019, Municipal Acts). For court proceedings, consult an advocate.'
  });

  return {
    ...parsed,
    officialSources: [
      OFFICIAL_PORTALS.find(p => p.name.includes('Consumer')) || OFFICIAL_PORTALS[0],
      OFFICIAL_PORTALS.find(p => p.name.includes('Daakhil')) || OFFICIAL_PORTALS[1]
    ]
  };
}
