import { interpretGovernmentDocument } from '../../../server/services/documentInterpreter';
import { generateRequestId, mapGeminiError } from '../../../server/geminiClient';

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

  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();

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

    const result = await interpretGovernmentDocument({
      textContent: textContent.trim(),
      language
    });

    return res.status(200).json({ ...result, requestId });
  } catch (err: any) {
    console.error(`[Vercel Doc Interpret Error] [${requestId}]:`, err?.message || err);
    const controlled = mapGeminiError(err);
    return res.status(500).json({
      success: false,
      error: {
        code: controlled.code,
        message: controlled.userFriendlyMessage
      },
      requestId
    });
  }
}
