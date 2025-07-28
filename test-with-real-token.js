const axios = require('axios');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://grifo-api.onrender.com';
const FIREBASE_API_KEY = 'AIzaSyDRj2kodgFUW2-N1Boa5nP5IZYVg-HaJME';

// Função para inicializar Firebase Admin SDK
function initializeFirebase() {
  try {
    const credentialsPath = path.join(__dirname, 'firebase-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.log('❌ Arquivo firebase-credentials.json não encontrado');
      return false;
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    console.log('✅ Firebase Admin SDK inicializado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    return false;
  }
}

// Função para criar token personalizado
async function createCustomToken(uid) {
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    console.log('✅ Token personalizado criado para', uid);
    return customToken;
  } catch (error) {
    console.error('❌ Erro ao criar token personalizado:', error.message);
    return null;
  }
}

// Função para trocar custom token por ID token
async function exchangeCustomTokenForIdToken(customToken) {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );
    
    console.log('✅ ID token obtido com sucesso');
    return response.data.idToken;
  } catch (error) {
    console.error('❌ Erro ao trocar token:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar API com token
async function testAPIWithToken(idToken) {
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  };
  
  const endpoints = [
    '/api/v1/dashboard',
    '/api/v1/properties',
    '/api/v1/inspections',
    '/api/v1/users'
  ];
  
  console.log('\n🧪 Testando endpoints protegidos com token válido...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers,
        timeout: 10000
      });
      
      console.log(`✅ ${endpoint}: ${response.status}`);
      if (response.data && typeof response.data === 'object') {
        const dataStr = JSON.stringify(response.data).substring(0, 100);
        console.log(`   Dados: ${dataStr}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status || 'Erro de conexão'}`);
      if (error.response?.data) {
        console.log(`   Erro: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

// Função principal
async function main() {
  console.log('🚀 Testando API com token Firebase real...');
  console.log('🌐 URL da API:', API_URL);
  
  // Inicializar Firebase
  const firebaseInitialized = initializeFirebase();
  if (!firebaseInitialized) {
    console.log('\n📋 Para usar este teste:');
    console.log('1. Certifique-se de que firebase-credentials.json existe');
    console.log('2. Verifique se a FIREBASE_API_KEY está correta');
    return;
  }
  
  // Criar usuário de teste
  const uid = 'test-user-' + Date.now();
  
  // Criar token personalizado
  const customToken = await createCustomToken(uid);
  if (!customToken) return;
  
  // Trocar por ID token
  const idToken = await exchangeCustomTokenForIdToken(customToken);
  if (!idToken) return;
  
  // Testar API
  await testAPIWithToken(idToken);
  
  console.log('\n🎉 Teste concluído!');
}

main().catch(console.error);