const axios = require('axios');

const API_URL = 'https://grifo-api.onrender.com';

async function testBypassAuth() {
    console.log('🚀 Testando API com BYPASS_AUTH ativado...');
    console.log('🌐 URL da API:', API_URL);
    
    try {
        // Teste 1: Endpoint público
        console.log('\n📋 Testando endpoint público (/)');
        const publicResponse = await axios.get(`${API_URL}/`);
        console.log('✅ Status:', publicResponse.status);
        console.log('📄 Resposta:', JSON.stringify(publicResponse.data, null, 2));
        
        // Teste 2: Health check
        console.log('\n🏥 Testando health check (/api/health)');
        const healthResponse = await axios.get(`${API_URL}/api/health`);
        console.log('✅ Status:', healthResponse.status);
        console.log('📄 Resposta:', JSON.stringify(healthResponse.data, null, 2));
        
        // Teste 3: Endpoint protegido sem token (deve funcionar com BYPASS_AUTH)
        console.log('\n🔓 Testando endpoint protegido sem token (/api/v1/properties)');
        const protectedResponse = await axios.get(`${API_URL}/api/v1/properties`);
        console.log('✅ Status:', protectedResponse.status);
        console.log('📄 Resposta:', JSON.stringify(protectedResponse.data, null, 2));
        
        // Teste 4: Outro endpoint protegido
        console.log('\n🔓 Testando outro endpoint protegido (/api/v1/inspections)');
        const inspectionsResponse = await axios.get(`${API_URL}/api/v1/inspections`);
        console.log('✅ Status:', inspectionsResponse.status);
        console.log('📄 Resposta:', JSON.stringify(inspectionsResponse.data, null, 2));
        
        console.log('\n🎉 Todos os testes passaram! BYPASS_AUTH está funcionando.');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.response?.status, error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n⚠️  BYPASS_AUTH pode não estar ativado ou ainda não foi aplicado.');
        }
    }
}

testBypassAuth();