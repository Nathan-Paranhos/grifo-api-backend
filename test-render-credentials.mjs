import { createClient } from '@supabase/supabase-js';

// Credenciais do .env.render
const SUPABASE_URL = 'https://fsvwifbvehdhlufauahj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdndpZmJ2ZWhkaGx1ZmF1YWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjI1MDYsImV4cCI6MjA3MDE5ODUwNn0.IC-I9QsH2t5o60v70TmzVFmfe8rUuFdMD5kMErQ4CPI';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdndpZmJ2ZWhkaGx1ZmF1YWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYyMjUwNiwiZXhwIjoyMDcwMTk4NTA2fQ.P0IucayWhykgPkSkvGUvzW1Q0PHtzNaSbJ010EWS-6A';

async function testRenderCredentials() {
  console.log('🔍 TESTANDO CREDENCIAIS DO .ENV.RENDER');
  console.log('=====================================');
  
  try {
    // Teste 1: Conexão básica com ANON_KEY
    console.log('\n1. Testando conexão com ANON_KEY...');
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: healthCheck, error: healthError } = await supabaseAnon
      .from('empresas')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Erro na conexão ANON:', healthError.message);
    } else {
      console.log('✅ Conexão ANON funcionando');
    }
    
    // Teste 2: Conexão com SERVICE_ROLE_KEY
    console.log('\n2. Testando conexão com SERVICE_ROLE_KEY...');
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: serviceCheck, error: serviceError } = await supabaseService
      .from('empresas')
      .select('*')
      .limit(1);
    
    if (serviceError) {
      console.log('❌ Erro na conexão SERVICE_ROLE:', serviceError.message);
    } else {
      console.log('✅ Conexão SERVICE_ROLE funcionando');
      console.log('📊 Dados encontrados:', serviceCheck?.length || 0, 'empresas');
    }
    
    // Teste 3: Verificar usuário específico
    console.log('\n3. Verificando usuário visionariaev@gmail.com...');
    
    const { data: appUser, error: appUserError } = await supabaseService
      .from('app_users')
      .select('*')
      .eq('email', 'visionariaev@gmail.com')
      .single();
    
    if (appUserError) {
      console.log('❌ Erro ao buscar app_user:', appUserError.message);
    } else {
      console.log('✅ app_user encontrado:', {
        id: appUser.id,
        email: appUser.email,
        empresa_id: appUser.empresa_id,
        ativo: appUser.ativo
      });
    }
    
    const { data: portalUser, error: portalUserError } = await supabaseService
      .from('portal_users')
      .select('*')
      .eq('email', 'visionariaev@gmail.com')
      .single();
    
    if (portalUserError) {
      console.log('❌ Erro ao buscar portal_user:', portalUserError.message);
    } else {
      console.log('✅ portal_user encontrado:', {
        id: portalUser.id,
        email: portalUser.email,
        empresa_id: portalUser.empresa_id,
        ativo: portalUser.ativo
      });
    }
    
    // Teste 4: Simular autenticação
    console.log('\n4. Simulando processo de autenticação...');
    
    if (appUser && appUser.senha_hash) {
      console.log('✅ Usuário tem senha configurada');
      console.log('📝 Hash da senha:', appUser.senha_hash.substring(0, 20) + '...');
    } else {
      console.log('❌ Usuário não tem senha configurada');
    }
    
    console.log('\n🎯 RESUMO DOS TESTES:');
    console.log('====================');
    console.log('- ANON_KEY:', healthError ? '❌ FALHOU' : '✅ OK');
    console.log('- SERVICE_ROLE_KEY:', serviceError ? '❌ FALHOU' : '✅ OK');
    console.log('- app_user existe:', appUserError ? '❌ NÃO' : '✅ SIM');
    console.log('- portal_user existe:', portalUserError ? '❌ NÃO' : '✅ SIM');
    console.log('- Senha configurada:', (appUser && appUser.senha_hash) ? '✅ SIM' : '❌ NÃO');
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar teste
testRenderCredentials().catch(console.error);