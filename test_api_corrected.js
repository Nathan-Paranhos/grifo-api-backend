require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const admin = require('firebase-admin');

// Configuração da API
const API_BASE_URL = 'http://localhost:3006';
const API_PREFIX = '/api'; // Prefixo correto das rotas

// Função para fazer requisições com tratamento de erro
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${API_PREFIX}${endpoint}`,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    return { 
      status: error.response?.status || 'ERROR', 
      error: error.response?.data?.message || error.message 
    };
  }
}

// Função para obter token de desenvolvimento (mock)
function getMockToken() {
  // Em desenvolvimento, o middleware aceita qualquer token quando Firebase não está configurado
  return 'mock-development-token';
}

async function testAPI() {
  console.log('🔍 Iniciando testes dos endpoints da API:');
  console.log(`📍 Base URL: ${API_BASE_URL}${API_PREFIX}`);
  console.log('');
  
  const token = getMockToken();
  
  // Lista de endpoints para testar
  const endpoints = [
    // Endpoints públicos
    { method: 'GET', path: '/health', needsAuth: false, description: 'Health Check' },
    
    // Endpoints que precisam de autenticação
    { method: 'GET', path: '/dashboard/stats', needsAuth: true, description: 'Dashboard Stats' },
    { method: 'GET', path: '/properties', needsAuth: true, description: 'Lista de Propriedades' },
    { method: 'GET', path: '/inspections', needsAuth: true, description: 'Lista de Inspeções' },
    { method: 'GET', path: '/users', needsAuth: true, description: 'Lista de Usuários' },
    { method: 'GET', path: '/companies', needsAuth: true, description: 'Lista de Empresas' },
    { method: 'GET', path: '/notifications', needsAuth: true, description: 'Notificações' },
    { method: 'GET', path: '/uploads', needsAuth: true, description: 'Uploads' },
    { method: 'GET', path: '/exports', needsAuth: true, description: 'Exports' },
    { method: 'GET', path: '/reports', needsAuth: true, description: 'Relatórios' },
    
    // Endpoints POST
    { method: 'POST', path: '/properties', needsAuth: true, description: 'Criar Propriedade', 
      data: { nome: 'Teste', endereco: 'Rua Teste, 123', cidade: 'São Paulo', estado: 'SP' } }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const authToken = endpoint.needsAuth ? token : null;
    const result = await makeRequest(endpoint.method, endpoint.path, endpoint.data, authToken);
    
    const statusIcon = result.status === 200 || result.status === 201 ? '✅' : '❌';
    const authInfo = endpoint.needsAuth ? ' (Auth)' : '';
    
    console.log(`${statusIcon} [${endpoint.method}] ${endpoint.path}${authInfo} => ${result.status}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    results.push({
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status: result.status,
      description: endpoint.description,
      error: result.error
    });
  }
  
  console.log('');
  console.log('📋 Relatório final:');
  results.forEach(result => {
    console.log(`${result.endpoint} => ${result.status}`);
    if (result.error) {
      console.log(`   ${result.error}`);
    }
  });
  
  console.log('');
  console.log('💡 Dicas para corrigir problemas:');
  console.log('- Certifique-se de usar o prefixo /api nas rotas');
  console.log('- Para endpoints autenticados, inclua o header Authorization: Bearer <token>');
  console.log('- Em desenvolvimento, o Firebase pode estar em modo mock');
  console.log('- Verifique se o servidor está rodando na porta 3006');
}

// Executar os testes
testAPI().catch(console.error);