const axios = require('axios');

const API_URL = 'https://grifo-api.onrender.com';

// Teste com um token simulado para verificar se a API está rejeitando corretamente
async function testAuthenticationFlow() {
  console.log('🚀 Testando fluxo de autenticação da API...');
  console.log('🌐 URL da API:', API_URL);
  
  // Teste 1: Sem token (deve retornar 401)
  console.log('\n🔒 Teste 1: Acessando endpoint protegido sem token');
  try {
    const response = await axios.get(`${API_URL}/api/v1/properties`);
    console.log('❌ ERRO: Endpoint deveria rejeitar requisição sem token!');
    console.log('Status:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correto: Endpoint rejeitou requisição sem token (401)');
    } else {
      console.log('❌ Status inesperado:', error.response?.status);
    }
  }
  
  // Teste 2: Token inválido (deve retornar 401)
  console.log('\n🔒 Teste 2: Acessando endpoint protegido com token inválido');
  try {
    const response = await axios.get(`${API_URL}/api/v1/properties`, {
      headers: {
        'Authorization': 'Bearer token-invalido-123'
      }
    });
    console.log('❌ ERRO: Endpoint deveria rejeitar token inválido!');
    console.log('Status:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correto: Endpoint rejeitou token inválido (401)');
    } else {
      console.log('❌ Status inesperado:', error.response?.status);
    }
  }
  
  // Teste 3: Verificar se BYPASS_AUTH está ativo
  console.log('\n🔓 Teste 3: Verificando se BYPASS_AUTH está ativo');
  try {
    const response = await axios.get(`${API_URL}/api/v1/dashboard`, {
      headers: {
        'Authorization': 'Bearer qualquer-token'
      }
    });
    
    if (response.status === 200) {
      console.log('🔓 BYPASS_AUTH está ATIVO - API aceita qualquer token');
      console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
      return true;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('🔒 BYPASS_AUTH está INATIVO - autenticação necessária');
    } else {
      console.log('❌ Erro inesperado:', error.response?.status, error.response?.data);
    }
  }
  
  // Teste 4: Health check (deve sempre funcionar)
  console.log('\n🏥 Teste 4: Health check (endpoint público)');
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check funcionando:', response.status);
    console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Erro no health check:', error.response?.status);
  }
  
  return false;
}

// Função para testar múltiplos endpoints protegidos
async function testProtectedEndpoints() {
  console.log('\n🧪 Testando múltiplos endpoints protegidos...');
  
  const endpoints = [
    '/api/v1/dashboard',
    '/api/v1/properties', 
    '/api/v1/inspections',
    '/api/v1/users',
    '/api/v1/empresas'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        },
        timeout: 5000
      });
      
      console.log(`✅ ${endpoint}: ${response.status} (BYPASS_AUTH ativo)`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`🔒 ${endpoint}: 401 (autenticação necessária)`);
      } else {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'erro de conexão'}`);
      }
    }
  }
}

// Função principal
async function main() {
  const bypassActive = await testAuthenticationFlow();
  
  if (bypassActive) {
    await testProtectedEndpoints();
    console.log('\n🎉 API está funcionando com BYPASS_AUTH ativado!');
    console.log('⚠️  Lembre-se de desativar BYPASS_AUTH em produção.');
  } else {
    console.log('\n📋 Resumo:');
    console.log('- API está rejeitando corretamente requisições não autenticadas');
    console.log('- BYPASS_AUTH não está ativo');
    console.log('- Para usar a API, você precisa de um token Firebase válido');
    console.log('\n💡 Opções:');
    console.log('1. Ativar BYPASS_AUTH temporariamente para testes');
    console.log('2. Configurar Firebase corretamente com credenciais válidas');
    console.log('3. Usar um token Firebase real de um usuário autenticado');
  }
}

main().catch(console.error);