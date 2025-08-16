import bcrypt from 'bcrypt';

async function generatePasswordHash() {
  const password = 'Vev24031909';
  const saltRounds = 12;
  
  console.log('🔐 GERANDO HASH BCRYPT PARA SENHA');
  console.log('================================');
  console.log('Senha:', password);
  console.log('Salt Rounds:', saltRounds);
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('\n✅ Hash gerado com sucesso:');
    console.log(hash);
    
    // Testar se o hash funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('\n🧪 Teste de validação:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    
    console.log('\n📋 SQL PARA ATUALIZAR:');
    console.log('======================');
    console.log(`UPDATE app_users SET senha_hash = '${hash}' WHERE email = 'visionariaev@gmail.com';`);
    console.log(`UPDATE portal_users SET senha_hash = '${hash}' WHERE email = 'visionariaev@gmail.com';`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar hash:', error.message);
  }
}

generatePasswordHash().catch(console.error);