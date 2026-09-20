import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './serverApi';

async function startServer() {
  const app = createApiApp();
  const PORT = 3000;

  // ------------------------------------------------------------
  // VITE SPA MIDDLEWARE / STATIC ASSETS
  // ------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quantum Factory Brain production server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
