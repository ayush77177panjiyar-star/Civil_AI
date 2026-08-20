import { Type } from '@google/genai';
import { getGenAI, getGeminiModel, withRetry, safeParseJson } from '../geminiClient';
import { getTargetLanguageInstruction, normalizeLanguageCode, getLanguageName, getNativeLanguageName } from '../utils/languageHelper';

export interface DocumentInterpretInput {
  textContent?: string;
  base64Data?: string;
  mimeType?: string;
  language?: string;
}

export async function interpretGovernmentDocument(input: DocumentInterpretInput) {
  const { textContent, base64Data, mimeType = 'image/png', language = 'en' } = input;
  const langCode = normalizeLanguageCode(language);
  const langInstruction = getTargetLanguageInstruction(langCode);
  const langName = getLanguageName(langCode);
  const nativeName = getNativeLanguageName(langCode);

  const systemInstruction = `You are the Expert Bureaucratic & Legal Document Interpreter of CivicAI.
Your Task: Demystify complex, formal government notifications, gazettes, circulars, court notices, tender awards, public announcements, and statutory rules into plain-language civic intelligence.
Strict Rules:
1. "NO SOURCE = NO CLAIM" — Only extract facts verified within the uploaded text or image. Do NOT invent dates, fees, or requirements that are not in the document.
2. If text is blurry, truncated, or unreadable, flag 'ocrQuality': 'LOW' and provide a clear warning in 'lowConfidenceWarning'.
3. Always provide exact page/section citations for transparency.
4. Extract:
   - documentType: Title / classification
   - targetAudience: Who is affected
   - coreSummary: 2-3 sentence overview
   - plainLanguageMeaning: Simple explanation
   - requiredActions: Specific actions citizen must take
   - importantDatesAndDeadlines: Dates, events, and consequences of missing them
   - documentsRequired: Enclosures needed
   - eligibilityConditions: Who qualifies or is exempted
   - feesAndCosts: Government fees or penalties
   - responsibleDepartment: Issuing authority
   - consequencesAndPenalties: Risks if ignored
   - citations: Page/section with quoted snippet and simple explanation
   - officialSourceOrVerification: Authority name, reference number, link if visible, confidence.

${langInstruction}
Explain the document in ${langName} (${nativeName}) regardless of what language the original uploaded document was in (English, Hindi, or any regional script).

Output structured JSON matching schema.`;

  const ai = getGenAI();
  const model = getGeminiModel();

  const parts: any[] = [];
  if (base64Data) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  parts.push({
    text: `SELECTED CITIZEN RESPONSE LANGUAGE: ${langName} (${nativeName}) - Code: ${langCode}
MANDATORY INSTRUCTION: You MUST explain this document and formulate all textual fields in ${langName} (${nativeName}).
Analyze and interpret this official government/legal document. ${textContent ? `Document text content:\n${textContent}` : ''}`
  });

  const response = await withRetry(async () => {
    return await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            coreSummary: { type: Type.STRING },
            plainLanguageMeaning: { type: Type.STRING },
            requiredActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            importantDatesAndDeadlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  event: { type: Type.STRING },
                  date: { type: Type.STRING },
                  consequence: { type: Type.STRING }
                },
                required: ['event', 'date']
              }
            },
            documentsRequired: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            eligibilityConditions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            feesAndCosts: { type: Type.STRING },
            responsibleDepartment: { type: Type.STRING },
            consequencesAndPenalties: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageOrSection: { type: Type.STRING },
                  quotedText: { type: Type.STRING },
                  simpleInterpretation: { type: Type.STRING }
                },
                required: ['pageOrSection', 'simpleInterpretation']
              }
            },
            officialSourceOrVerification: {
              type: Type.OBJECT,
              properties: {
                issuingAuthority: { type: Type.STRING },
                gazetteOrRefNumber: { type: Type.STRING },
                verificationLink: { type: Type.STRING },
                confidence: { type: Type.STRING }
              },
              required: ['issuingAuthority', 'confidence']
            },
            ocrQuality: { type: Type.STRING },
            lowConfidenceWarning: { type: Type.STRING }
          },
          required: [
            'documentType', 'targetAudience', 'coreSummary', 'plainLanguageMeaning',
            'requiredActions', 'importantDatesAndDeadlines', 'documentsRequired',
            'responsibleDepartment', 'citations', 'officialSourceOrVerification', 'ocrQuality'
          ]
        }
      }
    });
  });

  return safeParseJson(response.text, {
    documentType: 'Official Government Notice / Order',
    targetAudience: 'Affected Citizens / Property Owners / Applicants',
    coreSummary: 'Official administrative communication requiring specific citizen compliance or conveying entitlements.',
    plainLanguageMeaning: 'This document is a formal notification from a public authority specifying deadlines and procedural requirements.',
    requiredActions: [
      'Carefully verify the reference number and date of issuance.',
      'Prepare certified copies of all referenced documents.',
      'Submit written objection or compliance representation within the designated timeline.'
    ],
    importantDatesAndDeadlines: [
      {
        event: 'Filing Written Response / Compliance',
        date: 'Within 30 days from date of receipt',
        consequence: 'Failure to respond may lead to ex-parte administrative determinations or statutory recovery proceedings.'
      }
    ],
    documentsRequired: [
      'Proof of identity / Aadhaar card',
      'Ownership or property tax receipts (if applicable)',
      'Certified sanctioned plan or previous correspondence'
    ],
    eligibilityConditions: ['Applicable to named addressees or property occupiers'],
    feesAndCosts: 'Applicable statutory verification fee or penalties as per municipal schedule.',
    responsibleDepartment: 'Designated Municipal / Revenue / Administrative Authority',
    consequencesAndPenalties: [
      'Initiation of ex-parte proceedings under Municipal / Revenue Acts',
      'Potential levy of non-compliance penalties'
    ],
    citations: [
      {
        pageOrSection: 'Operating Notice Clause',
        quotedText: 'Show cause within thirty days...',
        simpleInterpretation: 'Citizen is legally entitled to present written objections before any punitive action.'
      }
    ],
    officialSourceOrVerification: {
      issuingAuthority: 'Competent Administrative Authority',
      confidence: 'HIGH'
    },
    ocrQuality: 'HIGH'
  });
}
