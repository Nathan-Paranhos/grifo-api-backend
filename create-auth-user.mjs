import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Carregar variáveis do .env.render
const envContent = readFileSync('.env.render', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Criando usuário no Supabase Auth...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Configurada ✅' : 'Não encontrada ❌');

// Criar cliente Supabase com service_role (admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAuthUser() {
    try {
        console.log('\n1. Tentando fazer login para verificar se usuário existe...');
        
        // Tentar fazer login para verificar se usuário existe
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'visionariaev@gmail.com',
            password: 'Vev24031909'
        });
        
        if (loginData && loginData.user) {
            console.log('✅ Usuário já existe e login funciona!');
            console.log('🆔 ID:', loginData.user.id);
            console.log('📧 Email:', loginData.user.email);
            return loginData.user;
        }
        
        console.log('👤 Usuário não existe ou senha incorreta. Tentando criar...');
        
        // Tentar criar usuário via signup
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: 'visionariaev@gmail.com',
            password: 'Vev24031909'
        });
        
        if (signupError) {
            console.error('❌ Erro ao criar usuário:', signupError);
            
            // Se o usuário já existe, tentar fazer login novamente
            if (signupError.message.includes('already registered')) {
                console.log('🔄 Usuário já registrado, tentando login novamente...');
                const { data: retryLogin, error: retryError } = await supabase.auth.signInWithPassword({
                    email: 'visionariaev@gmail.com',
                    password: 'Vev24031909'
                });
                
                if (retryLogin && retryLogin.user) {
                    console.log('✅ Login realizado com sucesso!');
                    return retryLogin.user;
                } else {
                    console.error('❌ Erro no login após signup:', retryError);
                }
            }
            return;
        }
        
        console.log('✅ Usuário criado com sucesso!');
        console.log('🆔 ID:', signupData.user?.id);
        console.log('📧 Email:', signupData.user?.email);
        
        return signupData.user;
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

async function updateUserTables(authUserId) {
    try {
        console.log('\n3. Atualizando tabelas app_users e portal_users...');
        
        // Atualizar app_users
        const { data: appUpdate, error: appError } = await supabase
            .from('app_users')
            .update({ auth_user_id: authUserId })
            .eq('email', 'visionariaev@gmail.com');
            
        if (appError) {
            console.error('❌ Erro ao atualizar app_users:', appError);
        } else {
            console.log('✅ app_users atualizada');
        }
        
        // Atualizar portal_users
        const { data: portalUpdate, error: portalError } = await supabase
            .from('portal_users')
            .update({ auth_user_id: authUserId })
            .eq('email', 'visionariaev@gmail.com');
            
        if (portalError) {
            console.error('❌ Erro ao atualizar portal_users:', portalError);
        } else {
            console.log('✅ portal_users atualizada');
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar tabelas:', error);
    }
}

async function testLogin() {
    try {
        console.log('\n4. Testando login com as credenciais...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'visionariaev@gmail.com',
            password: 'Vev24031909'
        });
        
        if (error) {
            console.error('❌ Erro no login:', error);
            return false;
        }
        
        console.log('✅ Login realizado com sucesso!');
        console.log('🎫 Token:', data.session?.access_token ? 'Gerado ✅' : 'Não gerado ❌');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste de login:', error);
        return false;
    }
}

// Executar o processo completo
async function main() {
    console.log('🚀 Iniciando correção do usuário de autenticação...');
    
    const user = await createAuthUser();
    
    if (user) {
        await updateUserTables(user.id);
        const loginSuccess = await testLogin();
        
        console.log('\n📊 RESULTADO FINAL:');
        console.log('👤 Usuário Auth:', user.id);
        console.log('🔐 Login:', loginSuccess ? 'Funcionando ✅' : 'Com problemas ❌');
        
        if (loginSuccess) {
            console.log('\n🎉 SUCESSO! Usuário configurado corretamente.');
            console.log('📱 Agora o app mobile deve conseguir fazer login na API de produção.');
        }
    }
}

main().catch(console.error);