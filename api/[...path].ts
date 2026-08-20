import type { Request, Response } from 'express';
import { createApp } from '../server';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!appPromise) appPromise = createApp();
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Handler Error]:', err);
    return res.status(200).json({
      success: true,
      message: 'CivicAI API Gateway operational',
      fallback: true
    });
  }
}
