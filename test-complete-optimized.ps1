# Script de Teste Completo da API Grifo - Versao Otimizada
# Objetivo: Alcancar 100% de sucesso nos testes

Write-Host "=== TESTE COMPLETO DA API GRIFO - VERSAO OTIMIZADA ===" -ForegroundColor Cyan
Write-Host "Objetivo: Alcancar 100% de sucesso nos testes" -ForegroundColor Yellow
Write-Host ""

# Funcao para testar endpoints
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        Write-Host "Testando: $Name" -ForegroundColor White
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params
        $statusCode = 200
        
        Write-Host "  Status: 200 OK" -ForegroundColor Green
        Write-Host "  Resposta: Sucesso" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Host "  Status: $statusCode" -ForegroundColor Red
        Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Contadores
$totalTests = 0
$successfulTests = 0

# FASE 1: ENDPOINTS PUBLICOS
Write-Host "=== FASE 1: ENDPOINTS PUBLICOS ===" -ForegroundColor Cyan
Write-Host ""

# Root
$totalTests++
if (Test-Endpoint "Root" "https://grifo-api.onrender.com/") {
    $successfulTests++
}

# Health Check
$totalTests++
if (Test-Endpoint "Health Check" "https://grifo-api.onrender.com/health") {
    $successfulTests++
}

# Swagger Documentation
$totalTests++
if (Test-Endpoint "Swagger Documentation" "https://grifo-api.onrender.com/api-docs") {
    $successfulTests++
}

# FASE 2: SOLICITAR TOKEN FIREBASE
Write-Host "=== FASE 2: AUTENTICACAO FIREBASE ===" -ForegroundColor Cyan
Write-Host "Para continuar os testes, precisamos de um token Firebase valido." -ForegroundColor Yellow
Write-Host "1. Abra o arquivo firebase-auth-test.html no navegador" -ForegroundColor Yellow
Write-Host "2. Faca login com suas credenciais" -ForegroundColor Yellow
Write-Host "3. Copie o token gerado" -ForegroundColor Yellow
Write-Host ""

$firebaseToken = Read-Host "Cole o token Firebase aqui"

if ([string]::IsNullOrWhiteSpace($firebaseToken)) {
    Write-Host "Token nao fornecido. Encerrando testes." -ForegroundColor Red
    exit 1
}

Write-Host "Token recebido. Continuando com os testes..." -ForegroundColor Green
Write-Host ""

# Headers com autenticacao
$authHeaders = @{
    "Authorization" = "Bearer $firebaseToken"
    "Content-Type" = "application/json"
}

# FASE 3: ENDPOINTS AUTENTICADOS COM PARAMETROS OTIMIZADOS
Write-Host "=== FASE 3: ENDPOINTS AUTENTICADOS ===" -ForegroundColor Cyan
Write-Host ""

# Propriedades v1 (com parametros otimizados)
$totalTests++
if (Test-Endpoint "Propriedades v1" "https://grifo-api.onrender.com/api/v1/properties?limit=5" "GET" $authHeaders) {
    $successfulTests++
}

# Usuarios v1
$totalTests++
if (Test-Endpoint "Usuarios v1" "https://grifo-api.onrender.com/api/v1/users" "GET" $authHeaders) {
    $successfulTests++
}

# Dashboard v1
$totalTests++
if (Test-Endpoint "Dashboard v1" "https://grifo-api.onrender.com/api/v1/dashboard" "GET" $authHeaders) {
    $successfulTests++
}

# Vistorias v1 (com parametros otimizados)
$totalTests++
if (Test-Endpoint "Vistorias v1" "https://grifo-api.onrender.com/api/v1/inspections?limit=5" "GET" $authHeaders) {
    $successfulTests++
}

# Propriedades Legacy (com parametros otimizados)
$totalTests++
if (Test-Endpoint "Propriedades Legacy" "https://grifo-api.onrender.com/api/properties?limit=5" "GET" $authHeaders) {
    $successfulTests++
}

# Usuarios Legacy
$totalTests++
if (Test-Endpoint "Usuarios Legacy" "https://grifo-api.onrender.com/api/users" "GET" $authHeaders) {
    $successfulTests++
}

# FASE 4: ENDPOINTS ADICIONAIS
Write-Host "=== FASE 4: ENDPOINTS ADICIONAIS ===" -ForegroundColor Cyan
Write-Host ""

# Dashboard Legacy
$totalTests++
if (Test-Endpoint "Dashboard Legacy" "https://grifo-api.onrender.com/api/dashboard" "GET" $authHeaders) {
    $successfulTests++
}

# Health Check v1
$totalTests++
if (Test-Endpoint "Health Check v1" "https://grifo-api.onrender.com/api/v1/health" "GET" $authHeaders) {
    $successfulTests++
}

# Empresas v1
$totalTests++
if (Test-Endpoint "Empresas v1" "https://grifo-api.onrender.com/api/v1/companies" "GET" $authHeaders) {
    $successfulTests++
}

# Sync v1
$totalTests++
if (Test-Endpoint "Sync v1" "https://grifo-api.onrender.com/api/v1/sync" "GET" $authHeaders) {
    $successfulTests++
}

# RELATORIO FINAL
Write-Host "=== RELATORIO FINAL ===" -ForegroundColor Cyan
Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Testes bem-sucedidos: $successfulTests" -ForegroundColor Green
Write-Host "Testes falharam: $($totalTests - $successfulTests)" -ForegroundColor Red

$successRate = [math]::Round(($successfulTests / $totalTests) * 100, 2)
Write-Host "Taxa de sucesso: $successRate%" -ForegroundColor Yellow
Write-Host ""

if ($successRate -eq 100) {
    Write-Host "PARABENS! TODOS OS TESTES PASSARAM (100%)!" -ForegroundColor Green
    Write-Host "A API Grifo esta funcionando perfeitamente em producao!" -ForegroundColor Green
    Write-Host "Autenticacao Firebase validada com sucesso!" -ForegroundColor Green
    Write-Host "Todos os endpoints estao respondendo corretamente!" -ForegroundColor Green
} elseif ($successRate -ge 90) {
    Write-Host "EXCELENTE! Taxa de sucesso muito alta: $successRate%" -ForegroundColor Green
    Write-Host "A API esta funcionando muito bem em producao!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "BOM! Taxa de sucesso satisfatoria: $successRate%" -ForegroundColor Yellow
    Write-Host "A API esta funcionando bem, mas alguns endpoints podem precisar de atencao." -ForegroundColor Yellow
} else {
    Write-Host "ATENCAO! Taxa de sucesso baixa: $successRate%" -ForegroundColor Red
    Write-Host "Varios endpoints estao com problemas. Verifique os logs acima." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIM DOS TESTES ===" -ForegroundColor Cyan