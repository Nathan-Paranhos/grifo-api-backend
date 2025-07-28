const axios = require('axios');

// URL base da API
const BASE_URL = 'https://grifo-api-backend.onrender.com';

async function testWithBypass() {
    console.log('🔓 Testando rotas com BYPASS_AUTH ativado:');
    console.log('⚠️  IMPORTANTE: BYPASS_AUTH deve estar ativado no servidor\n');
    
    const protectedRoutes = [
        '/api/v1/dashboard',
        '/api/v1/inspections', 
        '/api/v1/properties',
        '/api/v1/users',
        '/api/v1/empresas'
    ];
    
    for (const route of protectedRoutes) {
        try {
            const response = await axios.get(`${BASE_URL}${route}`, {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`✅ GET ${route}: ${response.status}`);
            if (response.data) {
                console.log(`   Dados recebidos: ${JSON.stringify(response.data).substring(0, 100)}...`);
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ GET ${route}: ${error.response.status}`);
                if (error.response.status === 401) {
                    console.log('   ⚠️  BYPASS_AUTH pode não estar ativado');
                }
            } else {
                console.log(`❌ GET ${route}: Erro de conexão - ${error.message}`);
            }
        }
    }
    
    console.log('\n📝 Para ativar BYPASS_AUTH:');
    console.log('1. Alterar BYPASS_AUTH=true no render.yaml');
    console.log('2. Fazer commit e push');
    console.log('3. Aguardar deploy (~2-3 minutos)');
    console.log('4. Executar este teste novamente');
}

testWithBypass().catch(console.error);