const http = require('http');

const endpoints = [
  { path: '/health', description: 'Health Check' },
  { path: '/api/info', description: 'API Info' },
  { path: '/api-docs', description: 'Swagger Documentation' },
  { path: '/api/auth/protected', description: 'Protected Endpoint (should return 401)' }
];

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          endpoint: endpoint.path,
          description: endpoint.description,
          status: res.statusCode,
          success: res.statusCode < 500,
          response: data.substring(0, 200) // Limitar resposta
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        endpoint: endpoint.path,
        description: endpoint.description,
        status: 'ERROR',
        success: false,
        error: e.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint: endpoint.path,
        description: endpoint.description,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Iniciando testes completos da API Grifo\n');
  console.log('📍 URL Base: http://localhost:3001\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`🔍 Testando: ${endpoint.description} (${endpoint.path})`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ Status: ${result.status}`);
    } else {
      console.log(`❌ Status: ${result.status} - ${result.error || 'Erro'}`);
    }
    console.log('');
  }
  
  // Resumo
  console.log('📊 RESUMO DOS TESTES:');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.description}: ${result.status}`);
  });
  
  console.log('=' .repeat(50));
  console.log(`📈 Sucessos: ${successful}/${total} (${Math.round(successful/total*100)}%)`);
  
  if (successful === total) {
    console.log('🎉 Todos os testes passaram! API está funcionando corretamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os logs acima.');
  }
}

runTests().catch(console.error);