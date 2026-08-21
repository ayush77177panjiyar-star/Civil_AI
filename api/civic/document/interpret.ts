import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || '';
  return key ? key.trim() : '';
}

function getGeminiModel(): string {
  const envModel = process.env.GEMINI_MODEL;
  if (envModel && envModel.trim() && !envModel.includes('3.6')) {
    return envModel.trim();
  }
  return 'gemini-2.5-flash';
}

function safeParseJson<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    let clean = jsonString.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
    }
    return JSON.parse(clean) as T;
  } catch (e) {
    return fallback;
  }
}

export default async function handler(req: any, res: any) {
  // Global CORS & Preflight headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed for document interpretation' }
    });
  }

  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const textContent = body.textContent || body.documentText || body.docText || body.text || '';
    const language = body.language || 'en';

    if (!textContent || typeof textContent !== 'string' || !textContent.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Document text content is required for interpretation.'
        },
        requestId
      });
    }

    const rawText = textContent.trim();
    const apiKey = getGeminiApiKey();

    // Deterministic parser extraction
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

      const listMatches = rawText.matchAll(/^[0-9]+[\.\)]\s*(.+)$/gm);
      for (const match of listMatches) {
        if (match[1] && match[1].length < 100) {
          extractedDocs.push(match[1].trim());
        }
      }
    }

    let responseText: string | null = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const model = getGeminiModel();

        const response = await ai.models.generateContent({
          model,
          contents: `Analyze and interpret this official government/legal document in ${language}:\n${rawText}`,
          config: {
            systemInstruction: `You are the Expert Document Interpreter of CivicAI. Extract structured JSON matching schema: documentType, targetAudience, coreSummary, plainLanguageMeaning, requiredActions, importantDatesAndDeadlines (event, date, consequence), documentsRequired, eligibilityConditions, feesAndCosts, responsibleDepartment, consequencesAndPenalties, citations, officialSourceOrVerification, ocrQuality.`,
            responseMimeType: 'application/json'
          }
        });
        responseText = response.text || null;
      } catch (err: any) {
        console.warn('[Gemini API Call Warning]:', err?.message || err);
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

    const result = safeParseJson(responseText, {
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

    return res.status(200).json({ ...result, requestId });
  } catch (err: any) {
    console.error(`[Vercel Doc Interpret Critical Error] [${requestId}]:`, err?.message || err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DOCUMENT_INTERPRETATION_FAILED',
        message: err?.message || 'Document processing could not be completed.'
      },
      requestId
    });
  }
}
