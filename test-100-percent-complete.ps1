# Script de Teste 100% Completo da API Grifo
# Testa TODOS os endpoints com TODOS os métodos HTTP e parâmetros
# Objetivo: Cobertura 100% de testes

Write-Host "=== TESTE 100% COMPLETO DA API GRIFO ===" -ForegroundColor Cyan
Write-Host "Cobertura: TODOS os endpoints, métodos e parâmetros" -ForegroundColor Yellow
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Configurações
$baseUrl = "https://grifo-api.onrender.com"
$totalTests = 0
$successfulTests = 0
$failedTests = 0
$results = @()

# Função para testar endpoints
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200,
        [string]$Description = ""
    )
    
    $global:totalTests++
    
    try {
        Write-Host "[$global:totalTests] Testando: $Name" -ForegroundColor White
        if ($Description) {
            Write-Host "    Descrição: $Description" -ForegroundColor Gray
        }
        Write-Host "    URL: $Url" -ForegroundColor Gray
        Write-Host "    Método: $Method" -ForegroundColor Gray
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "    [OK] Status: $statusCode (Esperado: $ExpectedStatus)" -ForegroundColor Green
            $global:successfulTests++
            $success = $true
        } else {
            Write-Host "    [WARN] Status: $statusCode (Esperado: $ExpectedStatus)" -ForegroundColor Yellow
            $global:failedTests++
            $success = $false
        }
        
        # Mostrar tamanho da resposta
        if ($response.Content) {
            $contentLength = $response.Content.Length
            Write-Host "    [INFO] Resposta: $contentLength caracteres" -ForegroundColor Gray
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        $errorMessage = $_.Exception.Message
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "    [OK] Status: $statusCode (Esperado: $ExpectedStatus)" -ForegroundColor Green
            $global:successfulTests++
            $success = $true
        } else {
            Write-Host "    [ERROR] Status: $statusCode - Erro: $errorMessage" -ForegroundColor Red
            $global:failedTests++
            $success = $false
        }
    }
    
    $global:results += @{
        Name = $Name
        Url = $Url
        Method = $Method
        ExpectedStatus = $ExpectedStatus
        ActualStatus = $statusCode
        Success = $success
        Description = $Description
    }
    
    Write-Host ""
    return $success
}

# Função para criar headers de autenticação
function Get-AuthHeaders {
    param([string]$Token)
    return @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
}

# FASE 1: ENDPOINTS PÚBLICOS
Write-Host "=== FASE 1: ENDPOINTS PÚBLICOS ==="  -ForegroundColor Magenta
Write-Host "Testando endpoints que não requerem autenticação" -ForegroundColor Gray
Write-Host ""

# Root endpoint
Test-Endpoint "Root API Info" "$baseUrl/" "GET" @{} $null 200 "Informações gerais da API"

# Health checks
Test-Endpoint "Health Check Principal" "$baseUrl/api/health" "GET" @{} $null 200 "Verificação de saúde da API"
Test-Endpoint "Health Check Simples" "$baseUrl/health" "GET" @{} $null 200 "Health check simplificado"

# Documentação
Test-Endpoint "Swagger Documentation" "$baseUrl/api-docs" "GET" @{} $null 200 "Documentação Swagger da API"

Write-Host "=== RESUMO FASE 1 ===" -ForegroundColor Cyan
Write-Host "Endpoints públicos testados: $($global:totalTests)" -ForegroundColor White
Write-Host "Sucessos: $($global:successfulTests)" -ForegroundColor Green
Write-Host "Falhas: $($global:failedTests)" -ForegroundColor Red
Write-Host ""

# FASE 2: OBTER TOKEN FIREBASE
Write-Host "=== FASE 2: AUTENTICAÇÃO FIREBASE ===" -ForegroundColor Magenta
Write-Host "Para testar endpoints protegidos, é necessário um token Firebase válido" -ForegroundColor Yellow
Write-Host ""

# Abrir página de autenticação
Write-Host "Abrindo página de autenticação Firebase..." -ForegroundColor Yellow
Start-Process "$baseUrl/../firebase-auth-test.html"

# Solicitar token do usuário
Write-Host "Por favor:" -ForegroundColor White
Write-Host "1. Faça login na página que foi aberta" -ForegroundColor Gray
Write-Host "2. Copie o token gerado" -ForegroundColor Gray
Write-Host "3. Cole o token abaixo" -ForegroundColor Gray
Write-Host ""
$firebaseToken = Read-Host "Digite o token Firebase"

if (-not $firebaseToken) {
    Write-Host "Token nao fornecido. Testando apenas endpoints publicos." -ForegroundColor Red
    Write-Host "Para testes completos, execute o script novamente com um token válido." -ForegroundColor Yellow
} else {
    Write-Host "Token recebido. Continuando com testes autenticados..." -ForegroundColor Green
    
    $authHeaders = Get-AuthHeaders $firebaseToken
    
    # FASE 3: ENDPOINTS PROTEGIDOS - LEGACY (sem /v1)
    Write-Host "=== FASE 3: ENDPOINTS LEGACY (sem /v1) ===" -ForegroundColor Magenta
    Write-Host "Testando endpoints legacy para compatibilidade com app mobile" -ForegroundColor Gray
    Write-Host ""
    
    # Properties Legacy - GET
    Test-Endpoint "Properties Legacy - GET" "$baseUrl/api/properties" "GET" $authHeaders $null 200 "Lista propriedades (legacy)"
    Test-Endpoint "Properties Legacy - GET com limit" "$baseUrl/api/properties?limit=5" "GET" $authHeaders $null 200 "Lista propriedades com limite"
    Test-Endpoint "Properties Legacy - GET com search" "$baseUrl/api/properties?search=casa" "GET" $authHeaders $null 200 "Busca propriedades por termo"
    Test-Endpoint "Properties Legacy - GET com limit e search" "$baseUrl/api/properties?limit=3&search=apartamento" "GET" $authHeaders $null 200 "Busca com limite e termo"
    
    # Properties Legacy - POST
    $propertyData = @{
        enderecoCompleto = "Rua Teste, 123 - Bairro Teste"
        proprietario = @{
            nome = "João da Silva"
            email = "joao@teste.com"
            telefone = "11999999999"
        }
        tipo = "residencial"
        status = "ativo"
    } | ConvertTo-Json -Depth 3
    
    Test-Endpoint "Properties Legacy - POST" "$baseUrl/api/properties" "POST" $authHeaders $propertyData 201 "Cria nova propriedade"
    
    # Inspections Legacy - GET
    Test-Endpoint "Inspections Legacy - GET" "$baseUrl/api/inspections" "GET" $authHeaders $null 200 "Lista vistorias (legacy)"
    Test-Endpoint "Inspections Legacy - GET com limit" "$baseUrl/api/inspections?limit=5" "GET" $authHeaders $null 200 "Lista vistorias com limite"
    Test-Endpoint "Inspections Legacy - GET com status" "$baseUrl/api/inspections?status=pendente" "GET" $authHeaders $null 200 "Filtra vistorias por status"
    Test-Endpoint "Inspections Legacy - GET com vistoriadorId" "$baseUrl/api/inspections?vistoriadorId=test123" "GET" $authHeaders $null 200 "Filtra por vistoriador"
    Test-Endpoint "Inspections Legacy - GET com datas" "$baseUrl/api/inspections?dataInicio=2024-01-01&dataFim=2024-12-31" "GET" $authHeaders $null 200 "Filtra por período"
    Test-Endpoint "Inspections Legacy - GET completo" "$baseUrl/api/inspections?limit=3&status=concluida&vistoriadorId=test123&dataInicio=2024-01-01&dataFim=2024-12-31" "GET" $authHeaders $null 200 "Filtros combinados"
    
    # Inspections Legacy - POST
    $inspectionData = @{
        propertyId = "prop123"
        vistoriadorId = "vist123"
        dataVistoria = "2024-12-20T10:00:00Z"
        tipo = "entrada"
        status = "agendada"
        observacoes = "Vistoria de teste"
    } | ConvertTo-Json -Depth 3
    
    Test-Endpoint "Inspections Legacy - POST" "$baseUrl/api/inspections" "POST" $authHeaders $inspectionData 201 "Cria nova vistoria"
    
    # Users Legacy - GET
    Test-Endpoint "Users Legacy - GET" "$baseUrl/api/users" "GET" $authHeaders $null 200 "Lista usuários (legacy)"
    Test-Endpoint "Users Legacy - GET com role" "$baseUrl/api/users?role=vistoriador" "GET" $authHeaders $null 200 "Filtra usuários por role"
    Test-Endpoint "Users Legacy - GET com ativo" "$baseUrl/api/users?ativo=true" "GET" $authHeaders $null 200 "Filtra usuários ativos"
    Test-Endpoint "Users Legacy - GET com limit" "$baseUrl/api/users?limit=10" "GET" $authHeaders $null 200 "Lista usuários com limite"
    Test-Endpoint "Users Legacy - GET completo" "$baseUrl/api/users?role=admin&ativo=true&limit=5" "GET" $authHeaders $null 200 "Filtros combinados"
    
    # Users Legacy - POST
    $userData = @{
        nome = "Usuário Teste"
        email = "usuario@teste.com"
        role = "vistoriador"
        ativo = $true
    } | ConvertTo-Json -Depth 3
    
    Test-Endpoint "Users Legacy - POST" "$baseUrl/api/users" "POST" $authHeaders $userData 201 "Cria novo usuário"
    
    # Dashboard Legacy - GET
    Test-Endpoint "Dashboard Legacy - GET" "$baseUrl/api/dashboard" "GET" $authHeaders $null 200 "Dashboard principal (legacy)"
    Test-Endpoint "Dashboard Legacy - GET com vistoriadorId" "$baseUrl/api/dashboard?vistoriadorId=test123" "GET" $authHeaders $null 200 "Dashboard filtrado por vistoriador"
    Test-Endpoint "Dashboard Legacy - Stats" "$baseUrl/api/dashboard/stats" "GET" $authHeaders $null 200 "Estatísticas do dashboard"
    Test-Endpoint "Dashboard Legacy - Stats com vistoriadorId" "$baseUrl/api/dashboard/stats?vistoriadorId=test123" "GET" $authHeaders $null 200 "Stats filtradas por vistoriador"
    
    # Companies Legacy - GET
    Test-Endpoint "Companies Legacy - GET" "$baseUrl/api/empresas" "GET" $authHeaders $null 200 "Lista empresas (legacy)"
    Test-Endpoint "Companies Legacy - GET com ativo" "$baseUrl/api/empresas?ativo=true" "GET" $authHeaders $null 200 "Filtra empresas ativas"
    Test-Endpoint "Companies Legacy - GET com limit" "$baseUrl/api/empresas?limit=10" "GET" $authHeaders $null 200 "Lista empresas com limite"
    
    # Sync Legacy - GET
    Test-Endpoint "Sync Legacy - GET" "$baseUrl/api/sync" "GET" $authHeaders $null 200 "Informações de sincronização"
    Test-Endpoint "Sync Legacy - GET com empresaId" "$baseUrl/api/sync?empresaId=emp123" "GET" $authHeaders $null 200 "Sync filtrado por empresa"
    Test-Endpoint "Sync Legacy - GET com vistoriadorId" "$baseUrl/api/sync?empresaId=emp123&vistoriadorId=vist123" "GET" $authHeaders $null 200 "Sync filtrado por vistoriador"
    
    # Sync Legacy - POST
    $syncData = @{
        pendingInspections = @(
            @{
                id = "insp123"
                tipo = "entrada"
                status = "concluida"
                fotos = @("foto1.jpg", "foto2.jpg")
            }
        )
        vistoriadorId = "vist123"
        empresaId = "emp123"
    } | ConvertTo-Json -Depth 4
    
    Test-Endpoint "Sync Legacy - POST" "$baseUrl/api/sync/sync" "POST" $authHeaders $syncData 200 "Sincronização de dados"
    
    # Contestations Legacy - GET
    Test-Endpoint "Contestations Legacy - GET" "$baseUrl/api/contestations?empresaId=emp123" "GET" $authHeaders $null 200 "Lista contestações"
    Test-Endpoint "Contestations Legacy - GET com status" "$baseUrl/api/contestations?empresaId=emp123&status=pendente" "GET" $authHeaders $null 200 "Filtra contestações por status"
    Test-Endpoint "Contestations Legacy - GET com inspectionId" "$baseUrl/api/contestations?empresaId=emp123&inspectionId=insp123" "GET" $authHeaders $null 200 "Filtra por vistoria"
    
    # Contestations Legacy - POST
    $contestationData = @{
        empresaId = "emp123"
        inspectionId = "insp123"
        motivo = "Discordância com avaliação"
        detalhes = "Cliente discorda da avaliação realizada"
        clienteId = "client123"
    } | ConvertTo-Json -Depth 3
    
    Test-Endpoint "Contestations Legacy - POST" "$baseUrl/api/contestations" "POST" $authHeaders $contestationData 201 "Cria nova contestação"
    
    # FASE 4: ENDPOINTS V1 (versionados)
    Write-Host "=== FASE 4: ENDPOINTS V1 (VERSIONADOS) ===" -ForegroundColor Magenta
    Write-Host "Testando endpoints versionados para portais web" -ForegroundColor Gray
    Write-Host ""
    
    # Properties V1 - GET
    Test-Endpoint "Properties V1 - GET" "$baseUrl/api/v1/properties" "GET" $authHeaders $null 200 "Lista propriedades (v1)"
    Test-Endpoint "Properties V1 - GET com limit" "$baseUrl/api/v1/properties?limit=5" "GET" $authHeaders $null 200 "Lista propriedades com limite (v1)"
    Test-Endpoint "Properties V1 - GET com search" "$baseUrl/api/v1/properties?search=casa" "GET" $authHeaders $null 200 "Busca propriedades por termo (v1)"
    
    # Properties V1 - POST
    Test-Endpoint "Properties V1 - POST" "$baseUrl/api/v1/properties" "POST" $authHeaders $propertyData 201 "Cria nova propriedade (v1)"
    
    # Inspections V1 - GET
    Test-Endpoint "Inspections V1 - GET" "$baseUrl/api/v1/inspections" "GET" $authHeaders $null 200 "Lista vistorias (v1)"
    Test-Endpoint "Inspections V1 - GET com limit" "$baseUrl/api/v1/inspections?limit=5" "GET" $authHeaders $null 200 "Lista vistorias com limite (v1)"
    Test-Endpoint "Inspections V1 - GET com status" "$baseUrl/api/v1/inspections?status=pendente" "GET" $authHeaders $null 200 "Filtra vistorias por status (v1)"
    
    # Inspections V1 - POST
    Test-Endpoint "Inspections V1 - POST" "$baseUrl/api/v1/inspections" "POST" $authHeaders $inspectionData 201 "Cria nova vistoria (v1)"
    
    # Users V1 - GET
    Test-Endpoint "Users V1 - GET" "$baseUrl/api/v1/users" "GET" $authHeaders $null 200 "Lista usuários (v1)"
    Test-Endpoint "Users V1 - GET com role" "$baseUrl/api/v1/users?role=vistoriador" "GET" $authHeaders $null 200 "Filtra usuários por role (v1)"
    
    # Users V1 - POST
    Test-Endpoint "Users V1 - POST" "$baseUrl/api/v1/users" "POST" $authHeaders $userData 201 "Cria novo usuário (v1)"
    
    # Dashboard V1 - GET
    Test-Endpoint "Dashboard V1 - GET" "$baseUrl/api/v1/dashboard" "GET" $authHeaders $null 200 "Dashboard principal (v1)"
    Test-Endpoint "Dashboard V1 - Stats" "$baseUrl/api/v1/dashboard/stats" "GET" $authHeaders $null 200 "Estatísticas do dashboard (v1)"
    
    # Companies V1 - GET
    Test-Endpoint "Companies V1 - GET" "$baseUrl/api/v1/empresas" "GET" $authHeaders $null 200 "Lista empresas (v1)"
    
    # Sync V1 - GET
    Test-Endpoint "Sync V1 - GET" "$baseUrl/api/v1/sync" "GET" $authHeaders $null 200 "Informações de sincronização (v1)"
    
    # Sync V1 - POST
    Test-Endpoint "Sync V1 - POST" "$baseUrl/api/v1/sync/sync" "POST" $authHeaders $syncData 200 "Sincronização de dados (v1)"
    
    # Contestations V1 - GET
    Test-Endpoint "Contestations V1 - GET" "$baseUrl/api/v1/contestations?empresaId=emp123" "GET" $authHeaders $null 200 "Lista contestações (v1)"
    
    # Contestations V1 - POST
    Test-Endpoint "Contestations V1 - POST" "$baseUrl/api/v1/contestations" "POST" $authHeaders $contestationData 201 "Cria nova contestação (v1)"
    
    # FASE 5: TESTES DE ENDPOINTS ESPECÍFICOS COM IDs
    Write-Host "=== FASE 5: ENDPOINTS COM IDs ESPECÍFICOS ===" -ForegroundColor Magenta
    Write-Host "Testando endpoints que requerem IDs específicos" -ForegroundColor Gray
    Write-Host ""
    
    $testId = "test123"
    
    # Properties com ID - Legacy
    Test-Endpoint "Properties Legacy - GET by ID" "$baseUrl/api/properties/$testId" "GET" $authHeaders $null 404 "Busca propriedade por ID (legacy)"
    Test-Endpoint "Properties Legacy - PUT by ID" "$baseUrl/api/properties/$testId" "PUT" $authHeaders $propertyData 404 "Atualiza propriedade por ID (legacy)"
    
    # Properties com ID - V1
    Test-Endpoint "Properties V1 - GET by ID" "$baseUrl/api/v1/properties/$testId" "GET" $authHeaders $null 404 "Busca propriedade por ID (v1)"
    Test-Endpoint "Properties V1 - PUT by ID" "$baseUrl/api/v1/properties/$testId" "PUT" $authHeaders $propertyData 404 "Atualiza propriedade por ID (v1)"
    
    # Inspections com ID - Legacy
    Test-Endpoint "Inspections Legacy - GET by ID" "$baseUrl/api/inspections/$testId" "GET" $authHeaders $null 404 "Busca vistoria por ID (legacy)"
    Test-Endpoint "Inspections Legacy - PUT by ID" "$baseUrl/api/inspections/$testId" "PUT" $authHeaders $inspectionData 404 "Atualiza vistoria por ID (legacy)"
    
    # Inspections com ID - V1
    Test-Endpoint "Inspections V1 - GET by ID" "$baseUrl/api/v1/inspections/$testId" "GET" $authHeaders $null 404 "Busca vistoria por ID (v1)"
    Test-Endpoint "Inspections V1 - PUT by ID" "$baseUrl/api/v1/inspections/$testId" "PUT" $authHeaders $inspectionData 404 "Atualiza vistoria por ID (v1)"
    
    # Users com ID - Legacy
    Test-Endpoint "Users Legacy - GET by ID" "$baseUrl/api/users/$testId" "GET" $authHeaders $null 404 "Busca usuário por ID (legacy)"
    
    # Users com ID - V1
    Test-Endpoint "Users V1 - GET by ID" "$baseUrl/api/v1/users/$testId" "GET" $authHeaders $null 404 "Busca usuário por ID (v1)"
    
    # Companies com ID - Legacy
    Test-Endpoint "Companies Legacy - GET by ID" "$baseUrl/api/empresas/$testId" "GET" $authHeaders $null 404 "Busca empresa por ID (legacy)"
    
    # Companies com ID - V1
    Test-Endpoint "Companies V1 - GET by ID" "$baseUrl/api/v1/empresas/$testId" "GET" $authHeaders $null 404 "Busca empresa por ID (v1)"
    
    # Contestations com ID - Legacy
    Test-Endpoint "Contestations Legacy - GET by ID" "$baseUrl/api/contestations/$testId?empresaId=emp123" "GET" $authHeaders $null 404 "Busca contestação por ID (legacy)"
    
    # Contestations com ID - V1
    Test-Endpoint "Contestations V1 - GET by ID" "$baseUrl/api/v1/contestations/$testId?empresaId=emp123" "GET" $authHeaders $null 404 "Busca contestação por ID (v1)"
}

# FASE 6: TESTES DE ENDPOINTS SEM AUTENTICAÇÃO (devem retornar 401)
Write-Host "=== FASE 6: TESTES DE SEGURANÇA (SEM AUTENTICAÇÃO) ===" -ForegroundColor Magenta
Write-Host "Testando se endpoints protegidos retornam 401 sem token" -ForegroundColor Gray
Write-Host ""

# Endpoints que devem retornar 401 sem autenticação
$protectedEndpoints = @(
    @{ Name = "Properties Legacy - Sem Auth"; Url = "$baseUrl/api/properties" },
    @{ Name = "Inspections Legacy - Sem Auth"; Url = "$baseUrl/api/inspections" },
    @{ Name = "Users Legacy - Sem Auth"; Url = "$baseUrl/api/users" },
    @{ Name = "Dashboard Legacy - Sem Auth"; Url = "$baseUrl/api/dashboard" },
    @{ Name = "Companies Legacy - Sem Auth"; Url = "$baseUrl/api/empresas" },
    @{ Name = "Sync Legacy - Sem Auth"; Url = "$baseUrl/api/sync" },
    @{ Name = "Contestations Legacy - Sem Auth"; Url = "$baseUrl/api/contestations" },
    @{ Name = "Properties V1 - Sem Auth"; Url = "$baseUrl/api/v1/properties" },
    @{ Name = "Inspections V1 - Sem Auth"; Url = "$baseUrl/api/v1/inspections" },
    @{ Name = "Users V1 - Sem Auth"; Url = "$baseUrl/api/v1/users" },
    @{ Name = "Dashboard V1 - Sem Auth"; Url = "$baseUrl/api/v1/dashboard" },
    @{ Name = "Companies V1 - Sem Auth"; Url = "$baseUrl/api/v1/empresas" },
    @{ Name = "Sync V1 - Sem Auth"; Url = "$baseUrl/api/v1/sync" },
    @{ Name = "Contestations V1 - Sem Auth"; Url = "$baseUrl/api/v1/contestations" }
)

foreach ($endpoint in $protectedEndpoints) {
    Test-Endpoint $endpoint.Name $endpoint.Url "GET" @{} $null 401 "Deve retornar 401 sem autenticação"
}

# RELATÓRIO FINAL DETALHADO
Write-Host "=== RELATÓRIO FINAL DETALHADO ===" -ForegroundColor Cyan
Write-Host ""

# Estatísticas gerais
$successRate = if ($totalTests -gt 0) { [math]::Round(($successfulTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "ESTATISTICAS GERAIS" -ForegroundColor White
Write-Host "Total de testes executados: $totalTests" -ForegroundColor White
Write-Host "Testes bem-sucedidos: $successfulTests" -ForegroundColor Green
Write-Host "Testes falharam: $failedTests" -ForegroundColor Red
Write-Host "Taxa de sucesso: $successRate porcento" -ForegroundColor $(if ($successRate -ge 90) { 'Green' } elseif ($successRate -ge 70) { 'Yellow' } else { 'Red' })
Write-Host ""

# Detalhamento por categoria
Write-Host "DETALHAMENTO POR CATEGORIA" -ForegroundColor White

$categories = @{
    "Públicos" = $results | Where-Object { $_.ExpectedStatus -eq 200 -and $_.Url -notmatch "/api/(v1/)?[^/]+" }
    "Legacy" = $results | Where-Object { $_.Url -match "/api/[^v]" -and $_.Url -notmatch "/api/health" }
    "V1" = $results | Where-Object { $_.Url -match "/api/v1/" }
    "Segurança" = $results | Where-Object { $_.ExpectedStatus -eq 401 }
}

foreach ($category in $categories.Keys) {
    $categoryResults = $categories[$category]
    if ($categoryResults) {
        $categoryTotal = $categoryResults.Count
        $categorySuccess = ($categoryResults | Where-Object { $_.Success }).Count
        $categoryRate = if ($categoryTotal -gt 0) { [math]::Round(($categorySuccess / $categoryTotal) * 100, 2) } else { 0 }
        
        $categoryText = "$category`: $categorySuccess/$categoryTotal ($categoryRate porcento)"
        Write-Host $categoryText -ForegroundColor $(if ($categoryRate -ge 90) { 'Green' } elseif ($categoryRate -ge 70) { 'Yellow' } else { 'Red' })
    }
}

Write-Host ""

# Lista de falhas
if ($failedTests -gt 0) {
    Write-Host "TESTES QUE FALHARAM" -ForegroundColor Red
    $failedResults = $results | Where-Object { -not $_.Success }
    foreach ($failed in $failedResults) {
        Write-Host "   • $($failed.Name) - Esperado: $($failed.ExpectedStatus), Obtido: $($failed.ActualStatus)" -ForegroundColor Red
    }
    Write-Host ""
}

# Conclusão
Write-Host "CONCLUSAO" -ForegroundColor White
if ($successRate -eq 100) {
    Write-Host "PERFEITO! Todos os testes passaram com 100 porcento de sucesso!" -ForegroundColor Green
    Write-Host "A API está funcionando perfeitamente em todos os aspectos testados." -ForegroundColor Green
} elseif ($successRate -ge 90) {
    Write-Host "EXCELENTE! Taxa de sucesso muito alta: $successRate porcento" -ForegroundColor Green
    Write-Host "A API está funcionando muito bem com apenas pequenos problemas." -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "BOM! Taxa de sucesso aceitavel: $successRate porcento" -ForegroundColor Yellow
    Write-Host "A API está funcionando, mas há alguns problemas que precisam de atenção." -ForegroundColor Yellow
} else {
    Write-Host "ATENCAO! Taxa de sucesso baixa: $successRate porcento" -ForegroundColor Red
    Write-Host "Vários endpoints estão com problemas. Revisão necessária." -ForegroundColor Red
}

Write-Host ""
Write-Host "INFORMACOES UTEIS" -ForegroundColor White
Write-Host "• URL da API: $baseUrl" -ForegroundColor Gray
Write-Host "• Documentação: $baseUrl/api-docs" -ForegroundColor Gray
Write-Host "• Health Check: $baseUrl/api/health" -ForegroundColor Gray
Write-Host "• Total de endpoints testados: $totalTests" -ForegroundColor Gray
Write-Host ""
$finalMessage = "Teste 100 porcento completo finalizado em $(Get-Date)"
Write-Host $finalMessage -ForegroundColor Cyan