const http = require('http');
const port = process.env.PORT || 10000;

// Servidor básico para Render
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      message: 'Grifo API Backend - Supabase Edge Functions',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      note: 'This is a Supabase Edge Functions project. Functions should be deployed to Supabase directly.',
      supabase_functions: [
        'assign-role',
        'create-tenant', 
        'dashboard-kpis',
        'drive-sync',
        'finalize-vistoria',
        'usage-stats'
      ]
    }));
    return;
  }

  // API info endpoint
  if (req.url === '/api' || req.url === '/api/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'Grifo API Backend',
      version: '1.0.0',
      type: 'Supabase Edge Functions',
      description: 'API multi-tenant para gerenciamento de vistorias imobiliárias',
      functions_available: [
        'assign-role - Atribuição de roles de usuário',
        'create-tenant - Criação de novos tenants',
        'dashboard-kpis - KPIs do dashboard',
        'drive-sync - Sincronização com Google Drive',
        'finalize-vistoria - Finalização de vistorias',
        'usage-stats - Estatísticas de uso'
      ],
      deployment_note: 'Para usar as funções, faça deploy no Supabase: supabase functions deploy'
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not Found',
    message: 'Este é um projeto Supabase Edge Functions. As funções devem ser deployadas no Supabase.',
    available_endpoints: ['/health', '/api']
  }));
});

server.listen(port, () => {
  console.log(`🚀 Grifo API Backend running on port ${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(`📖 API info: http://localhost:${port}/api`);
  console.log(`⚠️  Note: This is a Supabase Edge Functions project`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});