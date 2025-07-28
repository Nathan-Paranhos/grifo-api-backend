const axios = require('axios');
const admin = require('firebase-admin');
const fs = require('fs');

const API_BASE_URL = 'https://grifo-api.onrender.com';

// Função para carregar credenciais do Firebase
function loadFirebaseCredentials() {
  try {
    // Tentar carregar de arquivo local primeiro
    if (fs.existsSync('./firebase-credentials.json')) {
      console.log('🔑 Carregando credenciais do arquivo local...');
      const credentials = JSON.parse(fs.readFileSync('./firebase-credentials.json', 'utf8'));
      return credentials;
    }
    
    // Tentar carregar de variável de ambiente
    if (process.env.FIREBASE_CREDENTIALS) {
      console.log('🔑 Carregando credenciais da variável de ambiente...');
      return JSON.parse(process.env.FIREBASE_CREDENTIALS);
    }
    
    console.error('❌ Credenciais do Firebase não encontradas!');
    console.log('   Crie um arquivo firebase-credentials.json com as credenciais do service account');
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar credenciais:', error.message);
    return null;
  }
}

// Inicializar Firebase Admin SDK
async function initializeFirebase() {
  try {
    const credentials = loadFirebaseCredentials();
    if (!credentials) return false;
    
    // Verificar se já foi inicializado
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

// Criar um token personalizado para teste
async function createCustomToken(uid = 'test-user') {
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    console.log(`✅ Token personalizado criado para ${uid}`);
    return customToken;
  } catch (error) {
    console.error('❌ Erro ao criar token personalizado:', error.message);
    return null;
  }
}

// Trocar token personalizado por ID token
async function exchangeCustomTokenForIdToken(customToken) {
  try {
    // Verificar se temos a API key do Firebase
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('❌ FIREBASE_API_KEY não configurada');
      return null;
    }
    
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );
    
    const idToken = response.data.idToken;
    console.log('✅ Custom token trocado por ID token');
    return idToken;
  } catch (error) {
    console.error('❌ Erro ao trocar token:', error.response?.data || error.message);
    return null;
  }
}

// Testar API com token
async function testAPIWithToken(token) {
  console.log('\n🧪 Testando API com token...');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const endpoints = [
    '/api/v1/dashboard',
    '/api/v1/inspections',
    '/api/v1/properties'
  ];
  
  let allSuccess = true;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testando ${endpoint}...`);
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
      allSuccess = false;
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
  
  return allSuccess;
}

// Verificar se o BYPASS_AUTH está ativado
async function checkBypassAuth() {
  try {
    // Testar com um token inválido
    const invalidToken = 'invalid-token-for-testing';
    const headers = {
      'Authorization': `Bearer ${invalidToken}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/dashboard`, {
      headers,
      timeout: 10000,
      validateStatus: () => true // Aceitar qualquer status de resposta
    });
    
    if (response.status === 200) {
      console.log('🔓 BYPASS_AUTH está ativado!');
      return true;
    } else {
      console.log('🔒 BYPASS_AUTH não está ativado');
      return false;
    }
  } catch (error) {
    console.log('🔒 BYPASS_AUTH não está ativado (erro na requisição)');
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando validação de tokens Firebase...');
  console.log(`🌐 URL da API: ${API_BASE_URL}`);
  
  // Verificar se o BYPASS_AUTH está ativado
  const bypassEnabled = await checkBypassAuth();
  
  if (bypassEnabled) {
    console.log('\n⚠️ BYPASS_AUTH está ativado. Tokens não estão sendo validados!');
    console.log('   Isso é útil para testes, mas não deve ser usado em produção.');
    return;
  }
  
  // Inicializar Firebase
  const firebaseInitialized = await initializeFirebase();
  if (!firebaseInitialized) {
    console.error('\n❌ Não foi possível inicializar o Firebase. Verifique as credenciais.');
    return;
  }
  
  // Criar usuário de teste
  const uid = 'test-user-' + Date.now();
  
  // Criar token personalizado
  const customToken = await createCustomToken(uid);
  if (!customToken) return;
  
  // Trocar por ID token
  const idToken = await exchangeCustomTokenForIdToken(customToken);
  if (!idToken) {
    console.error('\n❌ Não foi possível obter um ID token. Verifique a FIREBASE_API_KEY.');
    console.log('   Você pode configurar a variável de ambiente FIREBASE_API_KEY ou');
    console.log('   adicionar "FIREBASE_API_KEY=sua-chave" no arquivo .env.development');
    return;
  }
  
  // Testar API com ID token
  const success = await testAPIWithToken(idToken);
  
  if (success) {
    console.log('\n✅ Validação de tokens concluída com sucesso!');
    console.log('   A API está validando tokens corretamente.');
  } else {
    console.log('\n⚠️ Alguns endpoints retornaram erro mesmo com token válido.');
    console.log('   Verifique os logs acima para mais detalhes.');
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  initializeFirebase,
  createCustomToken,
  exchangeCustomTokenForIdToken,
  testAPIWithToken,
  checkBypassAuth
};