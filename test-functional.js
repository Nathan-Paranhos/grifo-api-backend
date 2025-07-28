const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://grifo-api.onrender.com';

function loadFirebaseCredentials() {
  const credentialsPath = path.join(__dirname, 'firebase-credentials.json');
  
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ Arquivo firebase-credentials.json não encontrado');
    console.log('📝 Copie firebase-credentials.example.json para firebase-credentials.json');
    console.log('   e adicione suas credenciais reais do Firebase');
    return null;
  }
  
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('✅ Credenciais Firebase carregadas');
    return credentials;
  } catch (error) {
    console.error('❌ Erro ao carregar credenciais:', error.message);
    return null;
  }
}

async function initializeFirebase() {
  try {
    const credentials = loadFirebaseCredentials();
    if (!credentials) return false;
    
    // Verifica se já foi inicializado
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(credentials)
      });
      console.log('✅ Firebase Admin SDK inicializado');
    }
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    return false;
  }
}

async function createTestUser() {
  try {
    const uid = 'test-user-' + Date.now();
    const userRecord = await admin.auth().createUser({
      uid: uid,
      email: `test-${Date.now()}@example.com`,
      emailVerified: true,
      displayName: 'Test User',
      disabled: false
    });
    
    console.log('✅ Usuário de teste criado:', userRecord.uid);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') {
      console.log('✅ Usuário de teste já existe');
      return 'test-user-' + Date.now();
    }
    console.error('❌ Erro ao criar usuário:', error.message);
    return null;
  }
}

async function createCustomToken(uid) {
  try {
    const customToken = await admin.auth().createCustomToken(uid, {
      empresaId: 'empresa-teste',
      role: 'admin'
    });
    console.log('✅ Custom token criado para UID:', uid);
    return customToken;
  } catch (error) {
    console.error('❌ Erro ao criar custom token:', error.message);
    return null;
  }
}

// Função para simular o processo de login do cliente
async function exchangeCustomTokenForIdToken(customToken, apiKey) {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );
    
    console.log('✅ ID token obtido via custom token');
    return response.data.idToken;
  } catch (error) {
    console.error('❌ Erro ao trocar custom token por ID token:', error.response?.data || error.message);
    return null;
  }
}

async function testAPIWithToken(token) {
  console.log('\n🧪 Testando API com ID token Firebase...');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const endpoints = [
    '/api/v1/dashboard',
    '/api/v1/inspections',
    '/api/v1/properties',
    '/api/v1/users',
    '/api/v1/empresas'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers,
        timeout: 15000
      });
      
      console.log(`✅ ${endpoint}: ${response.status}`);
      if (response.data) {
        const dataStr = JSON.stringify(response.data);
        console.log(`   Dados: ${dataStr.substring(0, 100)}${dataStr.length > 100 ? '...' : ''}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`   Erro: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }
}

async function testPublicEndpoints() {
  console.log('📍 Testando endpoints públicos...');
  
  const publicEndpoints = [
    '/api/health',
    '/',
    '/api-docs'
  ];
  
  for (const endpoint of publicEndpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        timeout: 10000
      });
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status}`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }
}

async function testWithBypassAuth() {
  console.log('\n🔓 Testando com BYPASS_AUTH (se ativado)...');
  
  const headers = {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/dashboard`, {
      headers,
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ BYPASS_AUTH está ativo - rotas funcionando sem Firebase');
      return true;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('🔒 BYPASS_AUTH não está ativo - autenticação necessária');
    } else {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 Iniciando teste funcional da API Grifo...');
  console.log(`🌐 URL da API: ${API_BASE_URL}`);
  
  // Teste endpoints públicos primeiro
  await testPublicEndpoints();
  
  // Verificar se BYPASS_AUTH está ativo
  const bypassActive = await testWithBypassAuth();
  
  if (bypassActive) {
    console.log('\n✅ API funcionando com BYPASS_AUTH!');
    return;
  }
  
  // Tentar com Firebase
  console.log('\n🔥 Tentando autenticação Firebase...');
  const firebaseInitialized = await initializeFirebase();
  
  if (!firebaseInitialized) {
    console.log('\n📋 Para testar com autenticação real:');
    console.log('\n🔥 Opção 1 - Firebase (Recomendado):');
    console.log('1. Copie firebase-credentials.example.json para firebase-credentials.json');
    console.log('2. Adicione suas credenciais reais do Firebase Admin SDK');
    console.log('3. Adicione a API_KEY do seu projeto Firebase no código');
    console.log('4. Execute: node test-functional.js');
    console.log('\n🔓 Opção 2 - Bypass (temporário):');
    console.log('1. Altere BYPASS_AUTH=true no render.yaml');
    console.log('2. Faça commit e push');
    console.log('3. Aguarde deploy (~2-3 minutos)');
    console.log('4. Execute: node test-functional.js');
    return;
  }
  
  // Para usar ID tokens reais, você precisa da API Key do projeto
  const API_KEY = process.env.FIREBASE_API_KEY || 'SUA_API_KEY_AQUI';
  
  if (API_KEY === 'SUA_API_KEY_AQUI') {
    console.log('\n⚠️  Para gerar ID tokens reais, configure FIREBASE_API_KEY');
    console.log('   ou ative BYPASS_AUTH temporariamente');
    return;
  }
  
  // Criar usuário de teste
  const uid = await createTestUser();
  if (!uid) return;
  
  // Criar custom token
  const customToken = await createCustomToken(uid);
  if (!customToken) return;
  
  // Trocar por ID token
  const idToken = await exchangeCustomTokenForIdToken(customToken, API_KEY);
  if (!idToken) return;
  
  // Testar API com ID token
  await testAPIWithToken(idToken);
  
  console.log('\n✅ Teste funcional concluído!');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  initializeFirebase,
  createCustomToken,
  testAPIWithToken,
  testPublicEndpoints,
  testWithBypassAuth,
  createTestUser,
  exchangeCustomTokenForIdToken
};