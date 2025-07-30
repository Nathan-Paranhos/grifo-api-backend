# Script de Teste da API Grifo
# Testa todos os endpoints públicos e protegidos

Write-Host "=== TESTE DA API GRIFO ===" -ForegroundColor Green
Write-Host "URL Base: https://grifo-api.onrender.com" -ForegroundColor Cyan
Write-Host ""

# Função para testar endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "Testando: $Description" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -ErrorAction Stop
        Write-Host "✅ Status: $($response.StatusCode) - $($response.StatusDescription)" -ForegroundColor Green
        
        # Mostra parte do conteúdo se for JSON
        if ($response.Headers['Content-Type'] -like "*application/json*") {
            $content = $response.Content
            if ($content.Length -gt 200) {
                $content = $content.Substring(0, 200) + "..."
            }
            Write-Host "Resposta: $content" -ForegroundColor White
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        if ($ExpectedStatus -eq "401" -and $statusCode -eq 401) {
            Write-Host "✅ Status: $statusCode - $statusDescription (Esperado - Endpoint Protegido)" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Erro: $statusCode - $statusDescription" -ForegroundColor Red
        }
    }
    
    Write-Host "" # Linha em branco
}

# Testes de Endpoints Públicos
Write-Host "=== ENDPOINTS PÚBLICOS ===" -ForegroundColor Magenta
Test-Endpoint "https://grifo-api.onrender.com/" "Informações da API"
Test-Endpoint "https://grifo-api.onrender.com/api/health" "Health Check"
Test-Endpoint "https://grifo-api.onrender.com/api-docs" "Documentação Swagger"

# Testes de Endpoints Protegidos (devem retornar 401)
Write-Host "=== ENDPOINTS PROTEGIDOS (Devem retornar 401) ===" -ForegroundColor Magenta
Test-Endpoint "https://grifo-api.onrender.com/api/v1/properties" "Propriedades v1" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/v1/users" "Usuários v1" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/v1/dashboard" "Dashboard v1" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/v1/inspections" "Vistorias v1" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/v1/companies" "Empresas v1" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/v1/health" "Health Check v1" "401"

# Testes de Endpoints Legacy (devem retornar 401)
Write-Host "=== ENDPOINTS LEGACY (Devem retornar 401) ===" -ForegroundColor Magenta
Test-Endpoint "https://grifo-api.onrender.com/api/properties" "Propriedades Legacy" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/users" "Usuários Legacy" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/dashboard" "Dashboard Legacy" "401"
Test-Endpoint "https://grifo-api.onrender.com/api/inspections" "Vistorias Legacy" "401"

Write-Host "=== RESUMO DOS TESTES ===" -ForegroundColor Green
Write-Host "✅ Endpoints públicos devem retornar 200 OK"
Write-Host "✅ Endpoints protegidos devem retornar 401 Unauthorized"
Write-Host "✅ Documentação Swagger deve estar acessível"
Write-Host "✅ Health check deve mostrar status da API"
Write-Host ""
Write-Host "Para testar endpoints protegidos com autenticação:" -ForegroundColor Cyan
Write-Host "1. Obtenha um token Firebase válido"
Write-Host "2. Use: Invoke-WebRequest -Uri <URL> -Headers @{'Authorization'='Bearer <token>'}" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentação completa: https://grifo-api.onrender.com/api-docs" -ForegroundColor Blue