import { generateFormalApplication } from '../../../server/services/formFiller';
import { generateRequestId, mapGeminiError } from '../../../server/geminiClient';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, x-user-id');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST required' } });

  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const result = await generateFormalApplication(body);
    return res.status(200).json({ ...result, requestId });
  } catch (err: any) {
    console.error(`[Vercel Form Generate Error] [${requestId}]:`, err?.message || err);
    const controlled = mapGeminiError(err);
    return res.status(500).json({
      success: false,
      error: { code: controlled.code, message: controlled.userFriendlyMessage },
      requestId
    });
  }
}
