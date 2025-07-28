const https = require('https');
const http = require('http');
const { URL } = require('url');

function makeRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js Test Client',
                ...headers
            },
            timeout: 15000
        };

        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

async function testRoutes() {
    console.log('🧪 Testando API Grifo...');
    
    // Teste rota pública
    try {
        console.log('\n📍 Testando rota pública:');
        const healthResponse = await makeRequest('https://grifo-api-backend.onrender.com/api/health');
        console.log(`✅ /api/health: ${healthResponse.status}`);
        console.log(`   Resposta: ${healthResponse.data.substring(0, 100)}`);
    } catch (error) {
        console.log(`❌ /api/health: ${error.message}`);
    }
    
    // Teste rotas protegidas
    console.log('\n🔒 Testando rotas protegidas com token:');
    const protectedRoutes = [
        '/api/v1/dashboard',
        '/api/v1/inspections',
        '/api/v1/properties'
    ];
    
    for (const route of protectedRoutes) {
        try {
            const response = await makeRequest(
                `https://grifo-api-backend.onrender.com${route}`,
                { 'Authorization': 'Bearer test-token' }
            );
            
            if (response.status === 200) {
                console.log(`✅ ${route}: ${response.status} - FUNCIONANDO!`);
                console.log(`   Dados: ${response.data.substring(0, 150)}...`);
            } else {
                console.log(`⚠️  ${route}: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${route}: ${error.message}`);
        }
    }
    
    console.log('\n📝 Status do teste concluído!');
}

testRoutes().catch(console.error);