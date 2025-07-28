const axios = require('axios');

const API_BASE_URL = 'https://grifo-api.onrender.com';

async function checkFirebaseConfig() {
  console.log('🔍 Verificando configuração do Firebase na API...');
  
  try {
    // Testar endpoint de health para ver se a API está funcionando
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 10000
    });
    console.log('✅ API está respondendo:', healthResponse.status);
    
    // Testar um endpoint protegido sem token para ver a resposta de erro
    try {
      await axios.get(`${API_BASE_URL}/api/v1/dashboard`, {
        timeout: 10000
      });
    } catch (error) {
      if (error.response) {
        console.log('🔒 Endpoint protegido resposta:', error.response.status, error.response.data);
        
        if (error.response.status === 401) {
          const errorData = error.response.data;
          if (errorData.error && errorData.error.includes('Firebase')) {
            console.log('❌ Erro relacionado ao Firebase detectado');
          } else if (errorData.error && errorData.error.includes('Token')) {
            console.log('✅ Autenticação está funcionando (esperando token)');
          }
        }
      }
    }
    
    // Testar com token inválido para ver se Firebase está configurado
    try {
      await axios.get(`${API_BASE_URL}/api/v1/dashboard`, {
        headers: {
          'Authorization': 'Bearer invalid-token-test'
        },
        timeout: 10000
      });
    } catch (error) {
      if (error.response) {
        console.log('🧪 Teste com token inválido:', error.response.status);
        const errorData = error.response.data;
        
        if (errorData.error) {
          console.log('📝 Mensagem de erro:', errorData.error);
          
          if (errorData.error.includes('Firebase Admin SDK não inicializado')) {
            console.log('❌ PROBLEMA: Firebase Admin SDK não está inicializado');
            console.log('   Isso indica que as credenciais FIREBASE_CREDENTIALS não estão configuradas');
          } else if (errorData.error.includes('Token inválido')) {
            console.log('✅ Firebase está configurado e funcionando');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error.message);
  }
}

// Executar verificação
checkFirebaseConfig().catch(console.error);