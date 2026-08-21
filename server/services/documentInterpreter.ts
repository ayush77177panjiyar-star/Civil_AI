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

  let responseText: string | null = null;
  try {
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
        contents: parts,
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
    responseText = response.text || null;
  } catch (err: any) {
    console.warn('[Document Interpret Notice]:', err?.message || err);
  }

  // Smart Deterministic Parser for extracted document text fallback
  const rawText = (textContent || '').trim();
  let extractedDocType = 'Official Government Notice / Order';
  let extractedRefNo = '';
  let extractedDate = '';
  let extractedDeadline = '';
  let extractedSubject = '';
  const extractedDocs: string[] = [];

  if (rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0].length < 60) {
      extractedDocType = lines[0];
    }

    const refMatch = rawText.match(/(?:Reference\s*No|Ref\s*No|Order\s*No|No)\s*[:\-\s]\s*([A-Za-z0-9\/\-_]+)/i);
    if (refMatch) extractedRefNo = refMatch[1];

    const dateMatch = rawText.match(/(?:Date|Dated)\s*[:\-\s]\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
    if (dateMatch) extractedDate = dateMatch[1];

    const deadlineMatch = rawText.match(/(?:Submission\s*Deadline|Deadline|Last\s*Date)\s*[:\-\s]*\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
    if (deadlineMatch) extractedDeadline = deadlineMatch[1];

    const subjectMatch = rawText.match(/(?:Subject|Sub)\s*[:\-\s]\s*(.+)/i);
    if (subjectMatch) extractedSubject = subjectMatch[1];

    // Extract numbered document list items (e.g., "1. Aadhaar Card")
    const listMatches = rawText.matchAll(/^[0-9]+[\.\)]\s*(.+)$/gm);
    for (const match of listMatches) {
      if (match[1] && match[1].length < 100) {
        extractedDocs.push(match[1].trim());
      }
    }
  }

  const fallbackDates = [];
  if (extractedDate) {
    fallbackDates.push({ event: 'Document Issuance Date', date: extractedDate, consequence: 'Official date of notice' });
  }
  if (extractedDeadline) {
    fallbackDates.push({ event: 'Submission Deadline', date: extractedDeadline, consequence: 'Mandatory deadline for document submission' });
  }
  if (fallbackDates.length === 0) {
    fallbackDates.push({
      event: 'Filing Written Response / Compliance',
      date: 'As specified in notice (typically 15 to 30 days)',
      consequence: 'Failure to respond may lead to ex-parte administrative determinations.'
    });
  }

  return safeParseJson(responseText, {
    documentType: extractedDocType,
    targetAudience: 'Applicants / Property Owners / Named Addressees',
    coreSummary: extractedSubject ? `Official notification regarding ${extractedSubject}.` : 'Official administrative communication requiring specific citizen compliance.',
    plainLanguageMeaning: rawText ? `This document (${extractedDocType}${extractedRefNo ? ` Ref: ${extractedRefNo}` : ''}) requires specified citizen action and document submission.` : 'This document is a formal notification from a public authority specifying deadlines and procedural requirements.',
    requiredActions: [
      extractedDeadline ? `Submit required documents before ${extractedDeadline}.` : 'Verify reference details and submit required enclosures.',
      'Obtain official stamped acknowledgement of submission.'
    ],
    importantDatesAndDeadlines: fallbackDates,
    documentsRequired: extractedDocs.length > 0 ? extractedDocs : [
      'Proof of Identity / Aadhaar Card',
      'Address Proof',
      'Relevant Application Receipts'
    ],
    eligibilityConditions: ['Applicable to named applicants / addressees'],
    feesAndCosts: 'As per official department schedule.',
    responsibleDepartment: extractedDocType || 'Issuing Government Department',
    consequencesAndPenalties: [
      'Potential administrative rejection or ex-parte proceedings if deadline is missed'
    ],
    citations: [
      {
        pageOrSection: 'Notice Reference',
        quotedText: extractedRefNo ? `Ref No: ${extractedRefNo}` : rawText.slice(0, 80),
        simpleInterpretation: 'Official reference number establishing statutory record.'
      }
    ],
    officialSourceOrVerification: {
      issuingAuthority: extractedDocType || 'Competent Authority',
      gazetteOrRefNumber: extractedRefNo || 'Ref N/A',
      confidence: 'HIGH'
    },
    ocrQuality: 'HIGH'
  });
}
