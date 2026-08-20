import { Response } from 'express';
import { getGenAI, getGeminiModel } from '../geminiClient';

export interface StreamRequestOptions {
  prompt: string;
  systemInstruction?: string;
  res: Response;
  onDone?: (fullText: string) => void;
  onError?: (error: any) => void;
}

export async function handleGeminiStream(options: StreamRequestOptions) {
  const { prompt, systemInstruction, res, onDone, onError } = options;

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const ai = getGenAI();
  const model = getGeminiModel();

  let accumulatedText = '';

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are CivicAI, providing authoritative, clear civic and legal empowerment guidance.'
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        accumulatedText += text;
        res.write(`data: ${JSON.stringify({ text, done: false })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ text: '', done: true, fullText: accumulatedText })}\n\n`);
    res.end();

    if (onDone) {
      onDone(accumulatedText);
    }
  } catch (err: any) {
    console.error('[StreamService] Streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: err?.message || 'Streaming failed', done: true })}\n\n`);
    res.end();
    if (onError) {
      onError(err);
    }
  }
}
