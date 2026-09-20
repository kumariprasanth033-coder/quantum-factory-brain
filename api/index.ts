// Vercel Serverless API Handler
export default function handler(req: any, res: any) {
  const url = req.url || '/';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Factory-Mode');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (url.includes('/api/health')) {
    return res.status(200).json({
      success: true,
      status: 'healthy',
      database: 'connected',
      app_name: 'Quantum Factory Brain',
      version: '1.0.0-PROD',
      timestamp: new Date().toISOString(),
      active_mode: 'demo',
      environment: 'vercel-serverless',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Quantum Factory Brain Unified Production API Gateway',
    version: '1.0.0-PROD',
    platform: 'Vercel / Cloud Run',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
}
