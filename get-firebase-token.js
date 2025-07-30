// Script para obter token Firebase para testes de autenticação
// Execute este script em um ambiente com Firebase configurado

// Exemplo usando Firebase Admin SDK (para testes de backend)
const admin = require('firebase-admin');

// Configuração do Firebase Admin (substitua pelos seus dados)
const serviceAccount = {
  // Adicione suas credenciais do Firebase aqui
  // Baixe o arquivo JSON de credenciais do console Firebase
};

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: 'https://seu-projeto.firebaseio.com'
  });
}

// Função para criar um token customizado para testes
async function createCustomToken(uid = 'test-user') {
  try {
    const customToken = await admin.auth().createCustomToken(uid, {
      role: 'admin',
      testUser: true
    });
    
    console.log('Token customizado criado:');
    console.log(customToken);
    console.log('\nUse este token para fazer login no cliente Firebase.');
    
    return customToken;
  } catch (error) {
    console.error('Erro ao criar token:', error);
  }
}

// Função para verificar um token existente
async function verifyToken(idToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token válido para usuário:', decodedToken.uid);
    console.log('Claims:', decodedToken);
    return decodedToken;
  } catch (error) {
    console.error('Token inválido:', error.message);
  }
}

// Exemplo de uso
if (require.main === module) {
  console.log('=== GERADOR DE TOKEN FIREBASE PARA TESTES ===');
  console.log('\n1. Configure suas credenciais Firebase no arquivo');
  console.log('2. Execute: node get-firebase-token.js');
  console.log('3. Use o token gerado no script de teste PowerShell\n');
  
  // Criar token para testes
  createCustomToken('test-user-' + Date.now())
    .then(() => {
      console.log('\n✅ Token gerado com sucesso!');
      console.log('\nPróximos passos:');
      console.log('1. Copie o token gerado');
      console.log('2. Execute: ./test-with-auth.ps1');
      console.log('3. Cole o token quando solicitado');
    })
    .catch(console.error);
}

module.exports = { createCustomToken, verifyToken };