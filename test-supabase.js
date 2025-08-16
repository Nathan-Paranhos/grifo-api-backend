// Teste direto de conexão com Supabase
// Para verificar se as credenciais estão funcionando

import { createClient } from '@supabase/supabase-js';

// Credenciais do .env.render
const supabaseUrl = 'https://fsvwifbvehdhlufauahj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdndpZmJ2ZWhkaGx1ZmF1YWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjI1MDYsImV4cCI6MjA3MDE5ODUwNn0.IC-I9QsH2t5o60v70TmzVFmfe8rUuFdMD5kMErQ4CPI';

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key (primeiros 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Teste 1: Verificar se consegue conectar
    console.log('\n📡 Teste 1: Verificando conexão básica...');
    const { data: healthData, error: healthError } = await supabase
      .from('empresas')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro na conexão básica:', healthError.message);
      return false;
    }
    
    console.log('✅ Conexão básica OK');
    
    // Teste 2: Verificar tabela app_users
    console.log('\n👤 Teste 2: Verificando tabela app_users...');
    const { data: appUsersData, error: appUsersError } = await supabase
      .from('app_users')
      .select('id, email')
      .eq('email', 'visionariaev@gmail.com')
      .limit(1);
    
    if (appUsersError) {
      console.error('❌ Erro ao acessar app_users:', appUsersError.message);
      return false;
    }
    
    if (appUsersData && appUsersData.length > 0) {
      console.log('✅ Usuário encontrado em app_users:', appUsersData[0]);
    } else {
      console.log('⚠️ Usuário não encontrado em app_users');
    }
    
    // Teste 3: Verificar tabela portal_users
    console.log('\n🌐 Teste 3: Verificando tabela portal_users...');
    const { data: portalUsersData, error: portalUsersError } = await supabase
      .from('portal_users')
      .select('id, email')
      .eq('email', 'visionariaev@gmail.com')
      .limit(1);
    
    if (portalUsersError) {
      console.error('❌ Erro ao acessar portal_users:', portalUsersError.message);
      return false;
    }
    
    if (portalUsersData && portalUsersData.length > 0) {
      console.log('✅ Usuário encontrado em portal_users:', portalUsersData[0]);
    } else {
      console.log('⚠️ Usuário não encontrado em portal_users');
    }
    
    console.log('\n🎉 Todos os testes de conexão Supabase passaram!');
    return true;
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
    return false;
  }
}

// Executar teste
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ RESULTADO: Credenciais Supabase estão funcionando corretamente!');
      console.log('🔧 O problema está na configuração das variáveis no dashboard do Render.');
    } else {
      console.log('\n❌ RESULTADO: Há problemas com as credenciais Supabase.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });