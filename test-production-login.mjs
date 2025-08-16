import fetch from 'node-fetch';

console.log('🧪 Testando login na API de produção...');
console.log('URL:', 'https://grifo-api.onrender.com/api/v1/auth/app/login');
console.log('Credenciais: visionariaev@gmail.com / Vev24031909');
console.log('');

try {
  const response = await fetch('https://grifo-api.onrender.com/api/v1/auth/app/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'visionariaev@gmail.com',
      password: 'Vev24031909'
    })
  });

  console.log('📊 Status:', response.status);
  console.log('📋 Headers:', Object.fromEntries(response.headers));
  
  const responseText = await response.text();
  console.log('📄 Response Body:', responseText);
  
  if (response.ok) {
    console.log('\n✅ SUCESSO! Login funcionou na API de produção!');
    console.log('🎉 Problema 401 RESOLVIDO!');
    
    try {
      const data = JSON.parse(responseText);
      if (data.token) {
        console.log('🎫 Token JWT recebido:', data.token.substring(0, 50) + '...');
      }
    } catch (e) {
      console.log('⚠️ Resposta não é JSON válido');
    }
  } else {
    console.log('\n❌ ERRO! Login ainda falha na API de produção');
    console.log('🔍 Investigar mais...');
  }
  
} catch (error) {
  console.error('💥 Erro na requisição:', error.message);
}