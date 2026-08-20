import { Type } from '@google/genai';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient';
import { OFFICIAL_PORTALS } from '../data/officialSources';
import { getTargetLanguageInstruction, normalizeLanguageCode, getLanguageName, getNativeLanguageName } from '../utils/languageHelper';

export interface RtiAnalysisInput {
  userProblem: string;
  stateOrUt?: string;
  language?: string;
}

export interface RtiGenerateInput {
  userProblem: string;
  answers?: Record<string, string>;
  applicantDetails?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  isCentralAuthority?: boolean;
  likelyAuthority?: string;
  stateOrUt?: string;
  language?: string;
}

export async function analyzeRtiObjective(input: RtiAnalysisInput) {
  const { userProblem, stateOrUt = '', language = 'en' } = input;
  const langCode = normalizeLanguageCode(language);
  const langInstruction = getTargetLanguageInstruction(langCode);
  const langName = getLanguageName(langCode);
  const nativeName = getNativeLanguageName(langCode);

  const systemInstruction = `You are the Senior RTI Drafting Agent under the Right to Information Act, 2005 (India).
Core Objectives:
1. Understand the citizen's exact factual objective.
2. Identify the specific public records/certified information being sought (e.g. detailed project report, sanction letters, muster rolls, measurement book entries, voucher details, completion certificates).
3. CRITICAL JURISDICTION RULE:
   - Central Government bodies (Railways, Postal, Nationalised Banks, Central Ministries, Income Tax, Central PSUs) -> Central Authority (rtionline.gov.in).
   - State Government / Local / Panchayat / Municipal bodies (Village roads, Gram Panchayat expenditure, District Collectorate, State PWD, State Police, Municipal Corporation, Ration distribution) -> STATE / LOCAL Authority.
   - EXPLICITLY WARN that Central RTI Online portal (rtionline.gov.in) DOES NOT ACCEPT State or Panchayat RTI applications. State applications must use respective State portals or Indian Postal Order (IPO) offline route.
4. Formulate 2 to 4 precise clarification questions to complete the filing without guessing (e.g., Specific village/ward, Sanction year, Name/stretch of road, Work order number if known).
5. Ensure queries strictly request EXISTING MATERIAL RECORDS under Section 2(f) and never ask for opinions or explanations ("Why did you fail?").
${langInstruction}
Output structured JSON matching schema.`;

  const ai = getGenAI();
  const model = getGeminiModel();

  const response = await withRetry(async () => {
    return await ai.models.generateContent({
      model,
      contents: `SELECTED CITIZEN RESPONSE LANGUAGE: ${langName} (${nativeName}) - Code: ${langCode}
Citizen Query: "${userProblem}". State/UT specified: "${stateOrUt}"

MANDATORY INSTRUCTION: You MUST formulate all fields (objective, soughtInformationSummary, clarificationQuestions, questions, placeholders, reasons, portal guidance) in ${langName} (${nativeName}) because the user selected ${langName}.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objective: { type: Type.STRING },
            soughtInformationSummary: { type: Type.STRING },
            likelyAuthority: { type: Type.STRING },
            isCentralAuthority: { type: Type.BOOLEAN },
            stateOrUt: { type: Type.STRING },
            clarificationQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  placeholder: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  suggestedValues: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['id', 'question', 'reason']
              }
            },
            initialDraftReady: { type: Type.BOOLEAN },
            officialPortalInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                url: { type: Type.STRING },
                guidance: { type: Type.STRING },
                stateWarning: { type: Type.STRING }
              },
              required: ['name', 'url', 'guidance']
            }
          },
          required: ['objective', 'soughtInformationSummary', 'likelyAuthority', 'isCentralAuthority', 'stateOrUt', 'clarificationQuestions', 'officialPortalInfo']
        }
      }
    });
  });

  return safeParseJson(response.text, {
    objective: userProblem,
    soughtInformationSummary: `Seeking certified public records regarding: ${userProblem}`,
    likelyAuthority: stateOrUt ? `Public Information Officer, ${stateOrUt}` : 'Public Information Officer (PIO)',
    isCentralAuthority: false,
    stateOrUt: stateOrUt || 'India',
    clarificationQuestions: [
      { id: 'q1', question: 'What is the specific village, ward, or office location for this matter?', placeholder: 'e.g. Ward 12 / Sector 4', reason: 'To route the application to the exact local public authority office.' },
      { id: 'q2', question: 'What specific time frame or year does this request cover?', placeholder: 'e.g. 2023 - 2025', reason: 'RTI rules require a designated time frame for official record search.' }
    ],
    initialDraftReady: true,
    officialPortalInfo: {
      name: 'RTI Online (Central & State network)',
      url: 'https://rtionline.gov.in',
      guidance: 'For Central Government authorities, file online at rtionline.gov.in. For state or local municipal matters, file via the state RTI portal or submit physically with ₹10 IPO.',
      stateWarning: 'State and Panchayat matters must be filed via state-specific RTI portals or offline IPO.'
    }
  });
}

export async function generateRtiDraft(input: RtiGenerateInput) {
  const { userProblem, answers = {}, applicantDetails = {}, isCentralAuthority, likelyAuthority, stateOrUt = '', language = 'en' } = input;
  const langCode = normalizeLanguageCode(language);
  const langInstruction = getTargetLanguageInstruction(langCode);
  const langName = getLanguageName(langCode);
  const nativeName = getNativeLanguageName(langCode);

  const systemInstruction = `You are an Expert RTI Legal Drafter specializing in the Right to Information Act, 2005.
Generate a legally sound, structured RTI Application under Section 6(1) of the RTI Act, 2005.
Requirements:
1. Public Information Officer designation and address for the competent department.
2. Subject: Application under Section 6(1) of the Right to Information Act, 2005 seeking certified information regarding [Subject].
3. Numbered, crystal-clear information queries requesting CERTIFIED COPIES of public records (Sanction orders, DPR, Measurement Book entries, payment vouchers, inspection reports, contractor tender details).
4. Specify relevant financial year / time period.
5. Standard statutory clauses:
   - Indian Citizenship affirmation under Section 3 of the Act.
   - Statutory fee payment clause: ₹10/- via IPO/Court Fee Stamp/Online portal (or BPL fee exemption clause under Section 7(5)).
   - Section 6(2) citation stating that the applicant is not obliged to give reasons for seeking information.
   - Section 7(1) deadline reminder: 30 days mandatory compliance window.
6. Provide accurate official portal details or offline submission route notes.
${langInstruction}
Write the subject, information points, declaration, and application content in ${langName} (${nativeName}).
Output structured JSON conforming to schema.`;

  const ai = getGenAI();
  const model = getGeminiModel();

  const response = await withRetry(async () => {
    return await ai.models.generateContent({
      model,
      contents: `SELECTED CITIZEN RESPONSE LANGUAGE: ${langName} (${nativeName}) - Code: ${langCode}
RTI Subject Problem: ${userProblem}
Citizen Clarifications: ${JSON.stringify(answers)}
Applicant Particulars: ${JSON.stringify(applicantDetails)}
Target Authority: ${likelyAuthority}
State/UT: ${stateOrUt}
Is Central Public Authority: ${isCentralAuthority}

MANDATORY INSTRUCTION: You MUST formulate the RTI draft fields (subject, informationPoints, declaration, supportingContext, feeDetails, officialRouteNote) in ${langName} (${nativeName}) because the user selected ${langName}.`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            publicAuthority: { type: Type.STRING },
            department: { type: Type.STRING },
            isCentralAuthority: { type: Type.BOOLEAN },
            stateOrUt: { type: Type.STRING },
            pioDesignation: { type: Type.STRING },
            pioAddress: { type: Type.STRING },
            subject: { type: Type.STRING },
            applicantName: { type: Type.STRING },
            applicantAddress: { type: Type.STRING },
            applicantPhone: { type: Type.STRING },
            applicantEmail: { type: Type.STRING },
            informationPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            periodFrom: { type: Type.STRING },
            periodTo: { type: Type.STRING },
            supportingContext: { type: Type.STRING },
            feeDetails: { type: Type.STRING },
            declaration: { type: Type.STRING },
            officialRouteNote: { type: Type.STRING },
            officialPortalUrl: { type: Type.STRING },
            officialPortalName: { type: Type.STRING }
          },
          required: [
            'publicAuthority',
            'department',
            'pioDesignation',
            'pioAddress',
            'subject',
            'applicantName',
            'applicantAddress',
            'informationPoints',
            'feeDetails',
            'declaration',
            'officialRouteNote',
            'officialPortalUrl',
            'officialPortalName'
          ]
        }
      }
    });
  });

  return safeParseJson(response.text, {
    publicAuthority: likelyAuthority || 'Competent Public Information Officer',
    department: 'Designated Public Authority Department',
    pioDesignation: 'Public Information Officer (PIO)',
    pioAddress: stateOrUt ? `Office of the PIO, ${stateOrUt}` : 'Office of the Designated PIO',
    subject: `Application seeking certified public records under Section 6(1) of the RTI Act, 2005 regarding: ${userProblem.slice(0, 80)}`,
    applicantName: applicantDetails.name || '[Applicant Name]',
    applicantAddress: applicantDetails.address || '[Applicant Postal Address]',
    applicantPhone: applicantDetails.phone || '[Contact Number]',
    applicantEmail: applicantDetails.email || '[Email Address]',
    informationPoints: [
      `Certified copy of the sanction order and budget allocation for: ${userProblem}.`,
      `Certified copy of the Measurement Book (MB) and inspection reports recorded for the work.`,
      `Certified details of expenditure incurred and contractor work completion certificates.`
    ],
    periodFrom: 'Sanction date to present',
    periodTo: 'Current date',
    supportingContext: userProblem,
    feeDetails: 'Mandatory statutory application fee of ₹10 attached via IPO / Online Portal Payment.',
    declaration: 'I hereby declare that I am a citizen of India and the requested information does not fall within the exemptions specified under Section 8 or 9 of the RTI Act, 2005.',
    officialRouteNote: isCentralAuthority ? 'Submit via rtionline.gov.in' : 'Submit via designated State RTI portal or postal mail with ₹10 IPO.',
    officialPortalUrl: isCentralAuthority ? 'https://rtionline.gov.in' : 'https://rtionline.gov.in',
    officialPortalName: isCentralAuthority ? 'Central RTI Online Portal' : 'Designated State / Local Public Authority'
  });
}
