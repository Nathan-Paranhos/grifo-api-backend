const axios = require('axios');

const API_BASE_URL = 'https://grifo-api.onrender.com';

// Função para testar uma rota
async function testRoute(endpoint, method = 'GET', token = null) {
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
      console.log('   Resposta:', dataStr.substring(0, 200) + (dataStr.length > 200 ? '...' : ''));
    } else if (response.status === 401) {
      console.log('   ✓ Autenticação necessária (comportamento esperado)');
    } else if (response.data) {
      const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      console.log('   Resposta:', dataStr.substring(0, 200) + (dataStr.length > 200 ? '...' : ''));
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

// Função principal para testar com token simulado
async function testWithToken() {
  console.log('🚀 Testando API Grifo com token simulado\n');
  
  // Token simulado (JWT-like)
  const mockToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYmFuY28tdmlzaW9uYXJpYSIsImF1ZCI6ImJhbmNvLXZpc2lvbmFyaWEiLCJhdXRoX3RpbWUiOjE3Mzc5OTk5OTksInVzZXJfaWQiOiJ0ZXN0LXVzZXItaWQiLCJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE3Mzc5OTk5OTksImV4cCI6OTk5OTk5OTk5OSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdEBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn0sInJvbGUiOiJhZG1pbiIsImVtcHJlc2FJZCI6InRlc3QtZW1wcmVzYSJ9.test-signature';
  
  console.log('🔐 Testando rotas protegidas com token simulado:');
  console.log('Token:', mockToken.substring(0, 50) + '...');
  console.log('');
  
  // Testar rotas v1 com token
  const v1Routes = [
    '/api/v1/dashboard',
    '/api/v1/inspections',
    '/api/v1/properties',
    '/api/v1/users',
    '/api/v1/empresas'
  ];

  for (const route of v1Routes) {
    await testRoute(route, 'GET', mockToken);
  }
  
  console.log('');
  console.log('📝 Nota: Como o Firebase não está configurado localmente,');
  console.log('   todas as rotas ainda retornarão 401 mesmo com token.');
  console.log('   Para testar com autenticação real, seria necessário:');
  console.log('   1. Configurar Firebase Admin SDK com credenciais válidas');
  console.log('   2. Gerar um token Firebase real');
  console.log('   3. Ou ativar temporariamente BYPASS_AUTH=true');
}

// Executar testes
testWithToken().catch(console.error);