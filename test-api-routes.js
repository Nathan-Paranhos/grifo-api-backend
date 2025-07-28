const axios = require('axios');

const API_BASE_URL = 'https://grifo-api.onrender.com';

// Função para testar uma rota
async function testRoute(endpoint, method = 'GET', token = null, expectedStatus = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://grifo-portal-v1.netlify.app'
      },
      validateStatus: function (status) {
        return status < 600; // Aceitar qualquer status < 600
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios(config);
    const statusIcon = response.status === 200 ? '✅' : response.status === 401 ? '🔒' : '⚠️';
    console.log(`${statusIcon} ${method} ${endpoint}: ${response.status}`);
    
    if (response.status === 200 && response.data) {
      const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      console.log('   Resposta:', dataStr.substring(0, 150) + (dataStr.length > 150 ? '...' : ''));
    } else if (response.status === 401) {
      console.log('   ✓ Autenticação necessária (comportamento esperado)');
    } else if (response.data) {
      const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      console.log('   Resposta:', dataStr.substring(0, 150) + (dataStr.length > 150 ? '...' : ''));
    }
    
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: ${error.response?.status || 'ERROR'}`);
    if (error.response?.data) {
      console.log('   Erro:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('   Erro:', error.message);
    }
    return { success: false, status: error.response?.status, error: error.message };
  }
}

// Função para testar CORS
async function testCORS() {
  console.log('🌐 Testando CORS com Origin do portal:');
  await testRoute('/api/health');
  console.log('');
}

// Função principal para testar todas as rotas
async function testAllRoutes() {
  console.log('🚀 Iniciando testes das rotas da API Grifo\n');

  // Testar CORS
  await testCORS();

  // Testar rotas públicas
  console.log('📋 Testando rotas públicas:');
  await testRoute('/api/health');
  await testRoute('/');
  await testRoute('/api-docs');
  console.log('');

  // Testar rotas legacy (devem retornar 401)
  console.log('📋 Testando rotas legacy (/api/*) - devem retornar 401:');
  const legacyRoutes = [
    '/api/dashboard',
    '/api/inspections',
    '/api/properties',
    '/api/sync',
    '/api/contestations',
    '/api/users',
    '/api/empresas'
  ];

  for (const route of legacyRoutes) {
    await testRoute(route, 'GET');
  }
  console.log('');

  // Testar rotas v1 (devem retornar 401)
  console.log('📋 Testando rotas v1 (/api/v1/*) - devem retornar 401:');
  const v1Routes = [
    '/api/v1/dashboard',
    '/api/v1/inspections',
    '/api/v1/properties',
    '/api/v1/sync',
    '/api/v1/contestations',
    '/api/v1/users',
    '/api/v1/empresas'
  ];

  for (const route of v1Routes) {
    await testRoute(route, 'GET');
  }
  console.log('');

  // Testar com token inválido
  console.log('🔐 Testando com token inválido (deve retornar 401):');
  await testRoute('/api/v1/dashboard', 'GET', 'invalid-token');
  console.log('');

  console.log('✅ Testes concluídos!');
  console.log('');
  console.log('📊 Resumo dos resultados:');
  console.log('✅ = Rota funcionando corretamente (200)');
  console.log('🔒 = Rota protegida funcionando (401 - autenticação necessária)');
  console.log('⚠️ = Status inesperado');
  console.log('❌ = Erro de conexão ou outro problema');
  console.log('');
  console.log('🎯 Para usar as rotas protegidas no portal, você precisará:');
  console.log('1. Configurar autenticação Firebase no portal');
  console.log('2. Obter um token Firebase válido após login');
  console.log('3. Incluir o token no header: Authorization: Bearer <token>');
}

// Executar testes
testAllRoutes().catch(console.error);