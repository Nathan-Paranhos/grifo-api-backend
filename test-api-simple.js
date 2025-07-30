const http = require('http');

function testAPI() {
  console.log('Testando API na porta 3001...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Resposta:', data);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
    process.exit(1);
  });

  req.setTimeout(5000, () => {
    console.error('Timeout na requisição');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

testAPI();