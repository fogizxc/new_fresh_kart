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
      console.error('FreshCart login MongoDB bootstrap failed; continuing with fallback:', error);
      mongoReady = null;
      return null;
    });
  }
  await mongoReady;

  // The shared Express router expects the route-relative URL /login.
  req.url = '/login';
  res.setHeader('Cache-Control', 'no-store');
  return auth(req, res, (() => res.status(404).json({ error: 'Login route not found' })) as NextFunction);
}
