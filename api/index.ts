// Vercel Serverless API Handler
import { createApiApp } from '../serverApi';

const app = createApiApp();

export default function handler(req: any, res: any) {
  // If Vercel rewrites stripped /api prefix, prepend it so express router matches
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
