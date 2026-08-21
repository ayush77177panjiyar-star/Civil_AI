import type { Request, Response } from 'express';
import { createApp } from '../server';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appPromise) {
      appPromise = createApp();
    }
    const app = await appPromise;

    if (req.url) {
      const parsedUrl = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
      let pathname = parsedUrl.pathname;

      if (pathname.includes('[...path]')) {
        const queryPath = req.query?.['...path'] || req.query?.path;
        if (Array.isArray(queryPath)) {
          pathname = '/api/' + queryPath.join('/');
        } else if (typeof queryPath === 'string') {
          pathname = '/api/' + queryPath;
        }
      }

      req.url = pathname + parsedUrl.search;
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Index Handler Error]:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VERCEL_SERVERLESS_ERROR',
        message: err?.message || 'Serverless function execution error in CivicAI gateway'
      }
    });
  }
}
