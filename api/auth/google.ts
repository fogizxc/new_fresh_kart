import type { Request, Response, NextFunction } from 'express';
import { connectMongo } from '../../server/db/mongodb.ts';
import { auth } from '../../server/routes/auth.ts';

let mongoReady: Promise<unknown> | null = null;

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!mongoReady) {
    mongoReady = connectMongo().catch(error => {
      console.error('FreshCart Google auth MongoDB bootstrap failed; continuing with fallback:', error);
      mongoReady = null;
      return null;
    });
  }
  await mongoReady;

  req.url = '/google';
  res.setHeader('Cache-Control', 'no-store');
  return auth(req, res, (() => res.status(404).json({ error: 'Google authentication route not found' })) as NextFunction);
}
