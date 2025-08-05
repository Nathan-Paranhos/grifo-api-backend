const axios = require('axios');

const BASE_URL = 'https://grifo-api.onrender.com';

// Configuração do axios para não lançar erro em status HTTP de erro
const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Aceita qualquer status code
  timeout: 30000 // 30 segundos de timeout
});

const testAllRoutes = async () => {
  console.log('🔍 TESTE COMPLETO DE TODAS AS ROTAS - API GRIFO EM PRODUÇÃO');
  console.log('=' .repeat(70));
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('⏰ Timeout: 30 segundos por requisição');
  console.log('=' .repeat(70));
  
  const results = {
    working: [],
    authRequired: [],
    notFound: [],
    errors: [],
    total: 0
  };

  // 1. ENDPOINTS PÚBLICOS
  console.log('\n📋 1. ENDPOINTS PÚBLICOS');
  console.log('-' .repeat(50));
  
  const publicRoutes = [
    { method: 'get', path: '/', description: 'Informações da API' },
    { method: 'get', path: '/health', description: 'Health check' },
    { method: 'get', path: '/api/health', description: 'API Health check' },
    { method: 'get', path: '/api-docs', description: 'Documentação Swagger' }
  ];

  for (const route of publicRoutes) {
    await testRoute(route, results);
  }

  // 2. ENDPOINTS DE AUTENTICAÇÃO
  console.log('\n📋 2. ENDPOINTS DE AUTENTICAÇÃO');
  console.log('-' .repeat(50));
  
  const authRoutes = [
    {
      method: 'post',
      path: '/api/auth/verify-token',
      data: { token: 'test-token-123' },
      description: 'Verificação de token'
    },
    {
      method: 'post',
      path: '/api/auth/login',
      data: { firebaseToken: 'test-firebase-token-123' },
      description: 'Login com Firebase'
    },
    {
      method: 'post',
      path: '/api/auth/reset-password',
      data: { email: 'test@example.com' },
      description: 'Reset de senha'
    },
    {
      method: 'post',
      path: '/api/auth/refresh',
      data: { refreshToken: 'test-refresh-token' },
      description: 'Refresh token'
    }
  ];

  for (const route of authRoutes) {
    await testRoute(route, results);
  }

  // 3. ENDPOINTS PROTEGIDOS - LEGACY (Mobile)
  console.log('\n📋 3. ENDPOINTS PROTEGIDOS - LEGACY (MOBILE)');
  console.log('-' .repeat(50));
  
  const legacyRoutes = [
    { method: 'get', path: '/api/dashboard', description: 'Dashboard legacy' },
    { method: 'get', path: '/api/inspections', description: 'Inspeções legacy' },
    { method: 'get', path: '/api/properties', description: 'Propriedades legacy' },
    { method: 'get', path: '/api/sync', description: 'Sincronização legacy' },
    { method: 'get', path: '/api/contestations', description: 'Contestações legacy' },
    { method: 'get', path: '/api/users', description: 'Usuários legacy' },
    { method: 'get', path: '/api/empresas', description: 'Empresas legacy' },
    { method: 'get', path: '/api/notifications', description: 'Notificações legacy' },
    { method: 'get', path: '/api/uploads', description: 'Uploads legacy' },
    { method: 'get', path: '/api/exports', description: 'Exports legacy' },
    { method: 'get', path: '/api/exports/inspections/export', description: 'Export inspeções legacy' },
    { method: 'get', path: '/api/reports', description: 'Relatórios legacy' },
    { method: 'get', path: '/api/reports/performance', description: 'Relatório performance legacy' }
  ];

  for (const route of legacyRoutes) {
    await testRouteWithAuth(route, results);
  }

  // 4. ENDPOINTS PROTEGIDOS - V1 (Portal)
  console.log('\n📋 4. ENDPOINTS PROTEGIDOS - V1 (PORTAL)');
  console.log('-' .repeat(50));
  
  const v1Routes = [
    { method: 'get', path: '/api/v1/dashboard', description: 'Dashboard v1' },
    { method: 'get', path: '/api/v1/inspections', description: 'Inspeções v1' },
    { method: 'get', path: '/api/v1/properties', description: 'Propriedades v1' },
    { method: 'get', path: '/api/v1/sync', description: 'Sincronização v1' },
    { method: 'get', path: '/api/v1/contestations', description: 'Contestações v1' },
    { method: 'get', path: '/api/v1/users', description: 'Usuários v1' },
    { method: 'get', path: '/api/v1/empresas', description: 'Empresas v1' },
    { method: 'get', path: '/api/v1/notifications', description: 'Notificações v1' },
    { method: 'get', path: '/api/v1/uploads', description: 'Uploads v1' },
    { method: 'get', path: '/api/v1/exports', description: 'Exports v1' },
    { method: 'get', path: '/api/v1/reports', description: 'Relatórios v1' }
  ];

  for (const route of v1Routes) {
    await testRouteWithAuth(route, results);
  }

  // 5. ENDPOINTS ESPECÍFICOS DE AUTENTICAÇÃO PROTEGIDOS
  console.log('\n📋 5. ENDPOINTS DE AUTENTICAÇÃO PROTEGIDOS');
  console.log('-' .repeat(50));
  
  const protectedAuthRoutes = [
    { method: 'get', path: '/api/auth/me', description: 'Informações do usuário' }
  ];

  for (const route of protectedAuthRoutes) {
    await testRouteWithAuth(route, results);
  }

  // 6. TESTES DE MÉTODOS HTTP DIFERENTES
  console.log('\n📋 6. TESTES DE MÉTODOS HTTP DIFERENTES');
  console.log('-' .repeat(50));
  
  const methodRoutes = [
    {
      method: 'post',
      path: '/api/inspections',
      data: { test: 'data' },
      description: 'POST Inspeções'
    },
    {
      method: 'put',
      path: '/api/inspections/123',
      data: { test: 'data' },
      description: 'PUT Inspeção específica'
    },
    {
      method: 'delete',
      path: '/api/inspections/123',
      description: 'DELETE Inspeção específica'
    }
  ];

  for (const route of methodRoutes) {
    await testRouteWithAuth(route, results);
  }

  // RELATÓRIO FINAL
  console.log('\n' + '=' .repeat(70));
  console.log('📊 RELATÓRIO FINAL DO TESTE DE ROTAS');
  console.log('=' .repeat(70));
  
  console.log(`\n📈 ESTATÍSTICAS:`);
  console.log(`   • Total de rotas testadas: ${results.total}`);
  console.log(`   • ✅ Funcionando (200-299): ${results.working.length}`);
  console.log(`   • 🔐 Requer autenticação (401/403): ${results.authRequired.length}`);
  console.log(`   • ❌ Não encontradas (404): ${results.notFound.length}`);
  console.log(`   • 💥 Erros (500+): ${results.errors.length}`);
  
  if (results.working.length > 0) {
    console.log(`\n✅ ROTAS FUNCIONANDO:`);
    results.working.forEach(item => {
      console.log(`   • ${item.method.toUpperCase()} ${item.path} (${item.status}) - ${item.description}`);
    });
  }
  
  if (results.authRequired.length > 0) {
    console.log(`\n🔐 ROTAS QUE REQUEREM AUTENTICAÇÃO:`);
    results.authRequired.forEach(item => {
      console.log(`   • ${item.method.toUpperCase()} ${item.path} (${item.status}) - ${item.description}`);
    });
  }
  
  if (results.notFound.length > 0) {
    console.log(`\n❌ ROTAS NÃO ENCONTRADAS:`);
    results.notFound.forEach(item => {
      console.log(`   • ${item.method.toUpperCase()} ${item.path} (${item.status}) - ${item.description}`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log(`\n💥 ROTAS COM ERRO:`);
    results.errors.forEach(item => {
      console.log(`   • ${item.method.toUpperCase()} ${item.path} (${item.status}) - ${item.description}`);
      if (item.error) {
        console.log(`     Erro: ${item.error}`);
      }
    });
  }
  
  console.log('\n🎯 ANÁLISE:');
  const successRate = ((results.working.length + results.authRequired.length) / results.total * 100).toFixed(1);
  console.log(`   • Taxa de sucesso: ${successRate}% (rotas funcionando + protegidas)`);
  
  if (results.authRequired.length > 0) {
    console.log(`   • ✅ Autenticação funcionando: ${results.authRequired.length} rotas protegidas`);
  }
  
  if (results.notFound.length > 0) {
    console.log(`   • ⚠️  Rotas não implementadas: ${results.notFound.length}`);
  }
  
  console.log('\n🔧 RECOMENDAÇÕES:');
  if (results.notFound.length > 0) {
    console.log('   • Implementar rotas que retornam 404');
  }
  if (results.errors.length > 0) {
    console.log('   • Investigar e corrigir rotas com erro 500+');
  }
  if (results.authRequired.length > 0) {
    console.log('   • Sistema de autenticação está funcionando corretamente');
  }
  
  return results;
};

// Função para testar rota sem autenticação
async function testRoute(route, results) {
  try {
    results.total++;
    const config = {
      method: route.method,
      url: route.path
    };
    
    if (route.data) {
      config.data = route.data;
    }
    
    const response = await api(config);
    const status = response.status;
    
    let statusIcon = '❓';
    let category = 'errors';
    
    if (status >= 200 && status < 300) {
      statusIcon = '✅';
      category = 'working';
    } else if (status === 401 || status === 403) {
      statusIcon = '🔐';
      category = 'authRequired';
    } else if (status === 404) {
      statusIcon = '❌';
      category = 'notFound';
    } else if (status >= 500) {
      statusIcon = '💥';
      category = 'errors';
    }
    
    console.log(`  ${statusIcon} ${route.method.toUpperCase()} ${route.path}: ${status} - ${route.description}`);
    
    results[category].push({
      method: route.method,
      path: route.path,
      status,
      description: route.description,
      response: typeof response.data === 'string' ? response.data.substring(0, 100) : response.data
    });
    
  } catch (error) {
    results.total++;
    console.log(`  💥 ${route.method.toUpperCase()} ${route.path}: ERRO - ${error.message}`);
    results.errors.push({
      method: route.method,
      path: route.path,
      description: route.description,
      error: error.message
    });
  }
}

// Função para testar rota com autenticação
async function testRouteWithAuth(route, results) {
  try {
    results.total++;
    const config = {
      method: route.method,
      url: route.path,
      headers: {
        'Authorization': 'Bearer test-token-123',
        'Content-Type': 'application/json'
      }
    };
    
    if (route.data) {
      config.data = route.data;
    }
    
    const response = await api(config);
    const status = response.status;
    
    let statusIcon = '❓';
    let category = 'errors';
    
    if (status >= 200 && status < 300) {
      statusIcon = '✅';
      category = 'working';
    } else if (status === 401 || status === 403) {
      statusIcon = '🔐';
      category = 'authRequired';
    } else if (status === 404) {
      statusIcon = '❌';
      category = 'notFound';
    } else if (status >= 500) {
      statusIcon = '💥';
      category = 'errors';
    }
    
    console.log(`  ${statusIcon} ${route.method.toUpperCase()} ${route.path}: ${status} - ${route.description}`);
    
    results[category].push({
      method: route.method,
      path: route.path,
      status,
      description: route.description,
      response: typeof response.data === 'string' ? response.data.substring(0, 100) : response.data
    });
    
  } catch (error) {
    results.total++;
    console.log(`  💥 ${route.method.toUpperCase()} ${route.path}: ERRO - ${error.message}`);
    results.errors.push({
      method: route.method,
      path: route.path,
      description: route.description,
      error: error.message
    });
  }
}

// Executar testes
testAllRoutes().catch(console.error);