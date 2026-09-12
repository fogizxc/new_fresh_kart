import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app } from './server/index.ts';
import { connectMongo } from './server/db/mongodb.ts';

const PORT = 3000;

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      const db = await connectMongo();
      if (db) {
        console.log(`[FreshCart] MongoDB connected: ${db.databaseName}`);
      }
    } catch (err) {
      console.warn('[FreshCart] MongoDB connection failed, using in-memory store:', err);
    }
  } else {
    console.log('[FreshCart] Running with in-memory store (no MONGODB_URI provided)');
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: 'index.html', maxAge: '1d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FreshCart] Server running at http://0.0.0.0:${PORT}`);
  });
}

void start();
