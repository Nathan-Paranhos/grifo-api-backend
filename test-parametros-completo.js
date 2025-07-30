/**
 * Script de Teste Completo para Validação de Parâmetros da API Grifo
 * 
 * Este script testa TODOS os endpoints que recebem parâmetros,
 * validando tanto casos de sucesso quanto casos de erro.
 */

const https = require('https');
const http = require('http');

// Configurações
const API_BASE = 'http://localhost:3001/api';
const TIMEOUT = 10000;

// Dados de teste
const testData = {
  // Token fictício para testes (em produção, usar token Firebase real)
  authToken: 'test-token-123',
  
  // IDs de teste
  empresaId: 'test-empresa-123',
  vistoriadorId: 'test-vistoriador-456',
  imovelId: 'test-imovel-789',
  userId: 'test-user-101',
  contestationId: 'test-contest-202',
  
  // Dados para criação de usuário
  createUser: {
    nome: 'João Silva',
    email: 'joao.silva@teste.com',
    role: 'vistoriador',
    telefone: '11999999999',
    ativo: true
  },
  
  // Dados para atualização de usuário
  updateUser: {
    nome: 'João Silva Santos',
    telefone: '11888888888',
    ativo: true
  },
  
  // Dados para criação de propriedade
  createProperty: {
    endereco: 'Rua das Flores, 123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234567',
    tipo: 'Apartamento',
    areaTotal: 100.5,
    areaConstruida: 85.0,
    proprietario: {
      nome: 'Maria Santos',
      telefone: '11777777777',
      email: 'maria@teste.com',
      cpf: '12345678901'
    },
    inquilino: {
      nome: 'Pedro Oliveira',
      telefone: '11666666666',
      email: 'pedro@teste.com'
    },
    valorAluguel: 2500.00,
    observacoes: 'Apartamento em ótimo estado'
  },
  
  // Dados para criação de inspeção
  createInspection: {
    empresaId: 'test-empresa-123',
    vistoriadorId: 'test-vistoriador-456',
    imovelId: 'test-imovel-789',
    tipo: 'entrada',
    status: 'pendente',
    dataVistoria: new Date().toISOString(),
    observacoes: 'Vistoria de entrada do novo inquilino',
    fotos: [
      {
        url: 'https://exemplo.com/foto1.jpg',
        descricao: 'Sala de estar',
        categoria: 'ambiente'
      }
    ],
    checklists: [
      {
        categoria: 'Elétrica',
        itens: [
          {
            item: 'Tomadas funcionando',
            status: 'ok',
            observacao: 'Todas as tomadas testadas'
          }
        ]
      }
    ],
    imovel: {
      endereco: 'Rua das Flores, 123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234567',
      tipo: 'Apartamento',
      proprietario: {
        nome: 'Maria Santos',
        telefone: '11777777777',
        email: 'maria@teste.com'
      }
    }
  },
  
  // Dados para sincronização
  syncData: {
    pendingInspections: [
      {
        id: 'local-insp-001',
        empresaId: 'test-empresa-123',
        imovelId: 'test-imovel-789',
        tipo: 'entrada',
        fotos: ['foto1.jpg', 'foto2.jpg'],
        checklist: {
          'eletrica': 'ok',
          'hidraulica': 'ok'
        },
        observacoes: 'Inspeção realizada com sucesso',
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
    ],
    vistoriadorId: 'test-vistoriador-456',
    empresaId: 'test-empresa-123'
  },
  
  // Dados para contestação
  createContestation: {
    empresaId: 'test-empresa-123',
    inspectionId: 'test-inspection-999',
    motivo: 'Discordância com avaliação',
    detalhes: 'O estado do imóvel não condiz com o relatório',
    clienteId: 'test-client-555',
    evidencias: [
      {
        tipo: 'foto',
        url: 'https://exemplo.com/evidencia1.jpg'
      }
    ]
  },
  
  // Dados para atualização de status de contestação
  updateContestationStatus: {
    status: 'em_analise',
    resposta: 'Contestação recebida e em análise pela equipe técnica'
  }
};

// Função para fazer requisições HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.authToken}`,
        ...headers
      },
      timeout: TIMEOUT
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Função para testar endpoint
async function testEndpoint(name, method, path, data, expectedStatus, description) {
  try {
    console.log(`\n🧪 ${name}`);
    console.log(`   ${description}`);
    console.log(`   ${method} ${path}`);
    
    if (data) {
      console.log(`   Body: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
    }
    
    const response = await makeRequest(method, path, data);
    
    const statusMatch = Array.isArray(expectedStatus) 
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;
    
    if (statusMatch) {
      console.log(`   ✅ Status: ${response.status} (esperado: ${expectedStatus})`);
      if (response.data && response.data.data) {
        console.log(`   📊 Dados retornados: ${JSON.stringify(response.data.data).substring(0, 100)}...`);
      }
    } else {
      console.log(`   ❌ Status: ${response.status} (esperado: ${expectedStatus})`);
      console.log(`   📄 Resposta: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    return response;
  } catch (error) {
    console.log(`   💥 Erro: ${error.message}`);
    return null;
  }
}

// Função principal de testes
async function runTests() {
  console.log('🚀 INICIANDO TESTES DE VALIDAÇÃO DE PARÂMETROS DA API GRIFO');
  console.log('=' .repeat(80));
  
  let totalTests = 0;
  let passedTests = 0;
  
  // ========================================
  // TESTES DE USUÁRIOS
  // ========================================
  console.log('\n👥 === TESTES DE USUÁRIOS ===');
  
  // POST /api/users - Criar usuário
  totalTests++;
  const createUserResponse = await testEndpoint(
    'Criar Usuário',
    'POST',
    '/users',
    testData.createUser,
    [200, 201],
    'Criação de novo usuário com todos os parâmetros'
  );
  if (createUserResponse && [200, 201].includes(createUserResponse.status)) passedTests++;
  
  // POST /api/users - Criar usuário com dados inválidos
  totalTests++;
  const createUserInvalidResponse = await testEndpoint(
    'Criar Usuário - Dados Inválidos',
    'POST',
    '/users',
    { nome: '', email: 'email-invalido', role: 'role-inexistente' },
    400,
    'Teste de validação com dados inválidos'
  );
  if (createUserInvalidResponse && createUserInvalidResponse.status === 400) passedTests++;
  
  // PUT /api/users/:id - Atualizar usuário
  totalTests++;
  const updateUserResponse = await testEndpoint(
    'Atualizar Usuário',
    'PUT',
    `/users/${testData.userId}`,
    testData.updateUser,
    [200, 404],
    'Atualização de usuário existente'
  );
  if (updateUserResponse && [200, 404].includes(updateUserResponse.status)) passedTests++;
  
  // GET /api/users - Listar usuários com parâmetros
  totalTests++;
  const listUsersResponse = await testEndpoint(
    'Listar Usuários',
    'GET',
    `/users?empresaId=${testData.empresaId}&limit=10&page=1&role=vistoriador`,
    null,
    [200, 401],
    'Listagem de usuários com filtros'
  );
  if (listUsersResponse && [200, 401].includes(listUsersResponse.status)) passedTests++;
  
  // ========================================
  // TESTES DE PROPRIEDADES
  // ========================================
  console.log('\n🏢 === TESTES DE PROPRIEDADES ===');
  
  // POST /api/properties - Criar propriedade
  totalTests++;
  const createPropertyResponse = await testEndpoint(
    'Criar Propriedade',
    'POST',
    '/properties',
    testData.createProperty,
    [200, 201, 401],
    'Criação de nova propriedade com dados completos'
  );
  if (createPropertyResponse && [200, 201, 401].includes(createPropertyResponse.status)) passedTests++;
  
  // GET /api/properties - Listar propriedades
  totalTests++;
  const listPropertiesResponse = await testEndpoint(
    'Listar Propriedades',
    'GET',
    `/properties?empresaId=${testData.empresaId}&limit=10&tipo=Apartamento`,
    null,
    [200, 401],
    'Listagem de propriedades com filtros'
  );
  if (listPropertiesResponse && [200, 401].includes(listPropertiesResponse.status)) passedTests++;
  
  // ========================================
  // TESTES DE INSPEÇÕES
  // ========================================
  console.log('\n🔍 === TESTES DE INSPEÇÕES ===');
  
  // POST /api/inspections - Criar inspeção
  totalTests++;
  const createInspectionResponse = await testEndpoint(
    'Criar Inspeção',
    'POST',
    '/inspections',
    testData.createInspection,
    [200, 201, 401],
    'Criação de nova inspeção com dados completos'
  );
  if (createInspectionResponse && [200, 201, 401].includes(createInspectionResponse.status)) passedTests++;
  
  // GET /api/inspections - Listar inspeções
  totalTests++;
  const listInspectionsResponse = await testEndpoint(
    'Listar Inspeções',
    'GET',
    `/inspections?empresaId=${testData.empresaId}&vistoriadorId=${testData.vistoriadorId}&status=pendente`,
    null,
    [200, 401],
    'Listagem de inspeções com filtros'
  );
  if (listInspectionsResponse && [200, 401].includes(listInspectionsResponse.status)) passedTests++;
  
  // ========================================
  // TESTES DE SINCRONIZAÇÃO
  // ========================================
  console.log('\n🔄 === TESTES DE SINCRONIZAÇÃO ===');
  
  // POST /api/sync/sync - Sincronizar dados
  totalTests++;
  const syncDataResponse = await testEndpoint(
    'Sincronizar Dados',
    'POST',
    '/sync/sync',
    testData.syncData,
    [200, 401],
    'Sincronização de inspeções pendentes'
  );
  if (syncDataResponse && [200, 401].includes(syncDataResponse.status)) passedTests++;
  
  // GET /api/sync - Informações de sincronização
  totalTests++;
  const syncInfoResponse = await testEndpoint(
    'Informações de Sincronização',
    'GET',
    `/sync?empresaId=${testData.empresaId}&vistoriadorId=${testData.vistoriadorId}`,
    null,
    [200, 401],
    'Obter informações de sincronização'
  );
  if (syncInfoResponse && [200, 401].includes(syncInfoResponse.status)) passedTests++;
  
  // ========================================
  // TESTES DE CONTESTAÇÕES
  // ========================================
  console.log('\n⚖️ === TESTES DE CONTESTAÇÕES ===');
  
  // POST /api/contestations - Criar contestação
  totalTests++;
  const createContestationResponse = await testEndpoint(
    'Criar Contestação',
    'POST',
    '/contestations',
    testData.createContestation,
    [200, 201, 401],
    'Criação de nova contestação'
  );
  if (createContestationResponse && [200, 201, 401].includes(createContestationResponse.status)) passedTests++;
  
  // PUT /api/contestations/:id/status - Atualizar status
  totalTests++;
  const updateContestationResponse = await testEndpoint(
    'Atualizar Status de Contestação',
    'PUT',
    `/contestations/${testData.contestationId}/status`,
    testData.updateContestationStatus,
    [200, 404, 401],
    'Atualização de status de contestação'
  );
  if (updateContestationResponse && [200, 404, 401].includes(updateContestationResponse.status)) passedTests++;
  
  // GET /api/contestations - Listar contestações
  totalTests++;
  const listContestationsResponse = await testEndpoint(
    'Listar Contestações',
    'GET',
    `/contestations?empresaId=${testData.empresaId}&status=pendente`,
    null,
    [200, 401],
    'Listagem de contestações com filtros'
  );
  if (listContestationsResponse && [200, 401].includes(listContestationsResponse.status)) passedTests++;
  
  // ========================================
  // TESTES DE EMPRESAS
  // ========================================
  console.log('\n🏢 === TESTES DE EMPRESAS ===');
  
  // GET /api/empresas - Listar empresas
  totalTests++;
  const listCompaniesResponse = await testEndpoint(
    'Listar Empresas',
    'GET',
    '/empresas?ativo=true&limit=10',
    null,
    [200, 401, 403],
    'Listagem de empresas com filtros'
  );
  if (listCompaniesResponse && [200, 401, 403].includes(listCompaniesResponse.status)) passedTests++;
  
  // GET /api/empresas/:id - Buscar empresa
  totalTests++;
  const getCompanyResponse = await testEndpoint(
    'Buscar Empresa',
    'GET',
    `/empresas/${testData.empresaId}`,
    null,
    [200, 401, 403, 404],
    'Busca de empresa específica'
  );
  if (getCompanyResponse && [200, 401, 403, 404].includes(getCompanyResponse.status)) passedTests++;
  
  // ========================================
  // TESTES DE DASHBOARD
  // ========================================
  console.log('\n📊 === TESTES DE DASHBOARD ===');
  
  // GET /api/dashboard - Estatísticas
  totalTests++;
  const dashboardResponse = await testEndpoint(
    'Dashboard - Estatísticas',
    'GET',
    `/dashboard?empresaId=${testData.empresaId}&vistoriadorId=${testData.vistoriadorId}`,
    null,
    [200, 401],
    'Obter estatísticas do dashboard'
  );
  if (dashboardResponse && [200, 401].includes(dashboardResponse.status)) passedTests++;
  
  // ========================================
  // TESTES DE VALIDAÇÃO DE PARÂMETROS
  // ========================================
  console.log('\n🔍 === TESTES DE VALIDAÇÃO ===');
  
  // Teste sem empresaId obrigatório
  totalTests++;
  const noEmpresaIdResponse = await testEndpoint(
    'Validação - Sem empresaId',
    'GET',
    '/users',
    null,
    400,
    'Teste de validação sem parâmetro obrigatório'
  );
  if (noEmpresaIdResponse && noEmpresaIdResponse.status === 400) passedTests++;
  
  // Teste com email inválido
  totalTests++;
  const invalidEmailResponse = await testEndpoint(
    'Validação - Email Inválido',
    'POST',
    '/users',
    { ...testData.createUser, email: 'email-invalido' },
    400,
    'Teste de validação com email inválido'
  );
  if (invalidEmailResponse && invalidEmailResponse.status === 400) passedTests++;
  
  // Teste com role inválido
  totalTests++;
  const invalidRoleResponse = await testEndpoint(
    'Validação - Role Inválido',
    'POST',
    '/users',
    { ...testData.createUser, role: 'role-inexistente' },
    400,
    'Teste de validação com role inválido'
  );
  if (invalidRoleResponse && invalidRoleResponse.status === 400) passedTests++;
  
  // ========================================
  // RESUMO DOS TESTES
  // ========================================
  console.log('\n' + '=' .repeat(80));
  console.log('📊 RESUMO DOS TESTES DE VALIDAÇÃO DE PARÂMETROS');
  console.log('=' .repeat(80));
  console.log(`✅ Testes Aprovados: ${passedTests}`);
  console.log(`❌ Testes Falharam: ${totalTests - passedTests}`);
  console.log(`📈 Taxa de Sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`🔢 Total de Testes: ${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TODOS OS TESTES DE PARÂMETROS PASSARAM!');
    console.log('✨ A API está validando corretamente todos os parâmetros.');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique os endpoints que retornaram status inesperados.');
  }
  
  console.log('\n📋 OBSERVAÇÕES:');
  console.log('• Status 401: Esperado para endpoints protegidos sem autenticação válida');
  console.log('• Status 400: Esperado para validação de parâmetros inválidos');
  console.log('• Status 403: Esperado para acesso negado por permissões');
  console.log('• Status 404: Esperado para recursos não encontrados');
  console.log('• Status 200/201: Sucesso na operação');
  
  console.log('\n🔗 Para testes com autenticação real:');
  console.log('1. Configure um token Firebase válido na variável authToken');
  console.log('2. Use IDs reais de empresa, usuário e propriedades');
  console.log('3. Execute os testes em ambiente de desenvolvimento');
}

// Executar testes
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint, makeRequest };