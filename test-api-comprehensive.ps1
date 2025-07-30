# Script de Teste Abrangente da API Grifo
# Versão melhorada com tratamento de erros e timeouts

Write-Host "=== TESTE ABRANGENTE DA API GRIFO ===" -ForegroundColor Cyan
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Função para testar endpoint com tratamento de erro melhorado
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Host "Testando: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq $ExpectedStatus) {
            Write-Host "✅ Status: $status - $(Get-StatusDescription $status)" -ForegroundColor Green
            if ($ExpectedStatus -eq 200) {
                $contentLength = $response.Content.Length
                Write-Host "   📄 Conteúdo: $contentLength caracteres" -ForegroundColor Gray
            }
        } else {
            Write-Host "⚠️  Status: $status - Esperado: $ExpectedStatus" -ForegroundColor Yellow
        }
        
        return @{ Success = $true; Status = $status; Content = $response.Content }
    }
    catch [System.Net.WebException] {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ Status: $statusCode - $(Get-StatusDescription $statusCode) (Esperado)" -ForegroundColor Green
            return @{ Success = $true; Status = $statusCode }
        } else {
            Write-Host "❌ Erro HTTP: $statusCode - $($_.Exception.Message)" -ForegroundColor Red
            return @{ Success = $false; Status = $statusCode; Error = $_.Exception.Message }
        }
    }
    catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
    finally {
        Write-Host ""
    }
}

# Função para obter descrição do status HTTP
function Get-StatusDescription {
    param([int]$StatusCode)
    
    switch ($StatusCode) {
        200 { return "OK" }
        401 { return "Unauthorized" }
        403 { return "Forbidden" }
        404 { return "Not Found" }
        500 { return "Internal Server Error" }
        502 { return "Bad Gateway" }
        503 { return "Service Unavailable" }
        default { return "Unknown" }
    }
}

# Variáveis de configuração
$baseUrl = "https://grifo-api.onrender.com"
$results = @()

# === TESTE DE CONECTIVIDADE BÁSICA ===
Write-Host "=== TESTE DE CONECTIVIDADE BÁSICA ===" -ForegroundColor Magenta
$pingResult = Test-Endpoint "Conectividade Básica" "$baseUrl" 200
$results += $pingResult

if (-not $pingResult.Success) {
    Write-Host "❌ FALHA CRÍTICA: Não foi possível conectar à API" -ForegroundColor Red
    Write-Host "Verifique se a API está online em: $baseUrl" -ForegroundColor Yellow
    exit 1
}

# === ENDPOINTS PÚBLICOS ===
Write-Host "=== ENDPOINTS PÚBLICOS (Devem retornar 200) ===" -ForegroundColor Magenta

$publicEndpoints = @(
    @{ Name = "Health Check Principal"; Url = "$baseUrl/api/health" },
    @{ Name = "Documentação Swagger"; Url = "$baseUrl/api-docs" },
    @{ Name = "Health Check Simples"; Url = "$baseUrl/health" }
)

foreach ($endpoint in $publicEndpoints) {
    $result = Test-Endpoint $endpoint.Name $endpoint.Url 200
    $results += $result
}

# === ENDPOINTS PROTEGIDOS V1 ===
Write-Host "=== ENDPOINTS PROTEGIDOS V1 (Devem retornar 401) ===" -ForegroundColor Magenta

$protectedV1Endpoints = @(
    @{ Name = "Propriedades v1"; Url = "$baseUrl/api/v1/properties" },
    @{ Name = "Usuários v1"; Url = "$baseUrl/api/v1/users" },
    @{ Name = "Dashboard v1"; Url = "$baseUrl/api/v1/dashboard" },
    @{ Name = "Vistorias v1"; Url = "$baseUrl/api/v1/inspections" },
    @{ Name = "Empresas v1"; Url = "$baseUrl/api/v1/empresas" }
)

foreach ($endpoint in $protectedV1Endpoints) {
    $result = Test-Endpoint $endpoint.Name $endpoint.Url 401
    $results += $result
}

# === ENDPOINTS LEGACY ===
Write-Host "=== ENDPOINTS LEGACY (Devem retornar 401) ===" -ForegroundColor Magenta

$legacyEndpoints = @(
    @{ Name = "Propriedades Legacy"; Url = "$baseUrl/api/properties" },
    @{ Name = "Usuários Legacy"; Url = "$baseUrl/api/users" },
    @{ Name = "Dashboard Legacy"; Url = "$baseUrl/api/dashboard" },
    @{ Name = "Vistorias Legacy"; Url = "$baseUrl/api/inspections" }
)

foreach ($endpoint in $legacyEndpoints) {
    $result = Test-Endpoint $endpoint.Name $endpoint.Url 401
    $results += $result
}

# === RESUMO DOS RESULTADOS ===
Write-Host "=== RESUMO DOS RESULTADOS ===" -ForegroundColor Cyan

$totalTests = $results.Count
$successfulTests = ($results | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $successfulTests

Write-Host "📊 Total de testes: $totalTests" -ForegroundColor White
Write-Host "✅ Sucessos: $successfulTests" -ForegroundColor Green
Write-Host "❌ Falhas: $failedTests" -ForegroundColor Red
Write-Host "📈 Taxa de sucesso: $([math]::Round(($successfulTests / $totalTests) * 100, 2))%" -ForegroundColor Cyan

if ($failedTests -eq 0) {
    Write-Host "\n🎉 TODOS OS TESTES PASSARAM! A API está funcionando corretamente." -ForegroundColor Green
} else {
    Write-Host "\n⚠️  Alguns testes falharam. Verifique os detalhes acima." -ForegroundColor Yellow
}

Write-Host "\n=== INFORMAÇÕES ADICIONAIS ===" -ForegroundColor Cyan
Write-Host "🌐 URL da API: $baseUrl" -ForegroundColor White
Write-Host "📚 Documentação: $baseUrl/api-docs" -ForegroundColor White
Write-Host "🔍 Health Check: $baseUrl/api/health" -ForegroundColor White
Write-Host "\n💡 Para testar endpoints protegidos com autenticação:" -ForegroundColor Yellow
Write-Host "   1. Obtenha um token Firebase válido" -ForegroundColor Gray
Write-Host "   2. Use: Invoke-WebRequest -Uri <URL> -Headers @{'Authorization'='Bearer <token>'}" -ForegroundColor Gray

Write-Host "\n✨ Teste concluído em $(Get-Date)" -ForegroundColor Cyan