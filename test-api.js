const https = require('https');
const http = require('http');

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Teste da API
async function testAPI() {
  console.log('🔍 Testando API Grifo...');
  
  try {
    // Teste 1: Health Check
    console.log('\n1. Testando Health Check...');
    const healthResponse = await makeRequest('https://grifo-api-backend.onrender.com/api/v1/health');
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Resposta: ${healthResponse.data}`);
    
    // Teste 2: Informações da API
    console.log('\n2. Testando informações da API...');
    const infoResponse = await makeRequest('https://grifo-api-backend.onrender.com/');
    console.log(`Status: ${infoResponse.status}`);
    console.log(`Resposta: ${infoResponse.data}`);
    
    // Teste 3: Documentação Swagger
    console.log('\n3. Testando Swagger...');
    const swaggerResponse = await makeRequest('https://grifo-api-backend.onrender.com/api-docs');
    console.log(`Status: ${swaggerResponse.status}`);
    console.log(`Content-Type: ${swaggerResponse.headers['content-type']}`);
    
    // Teste 4: Endpoint protegido (deve retornar 401)
    console.log('\n4. Testando endpoint protegido sem token...');
    const protectedResponse = await makeRequest('https://grifo-api-backend.onrender.com/api/v1/properties');
    console.log(`Status: ${protectedResponse.status}`);
    console.log(`Resposta: ${protectedResponse.data}`);
    
    console.log('\n✅ Testes da API concluídos!');
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

// Executar testes
testAPI();