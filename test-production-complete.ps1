# Script de Teste Completo de Produção - API Grifo
# Este script demonstra como testar a API com token Firebase real

Write-Host "=== TESTE COMPLETO DE PRODUCAO - API GRIFO ===" -ForegroundColor Cyan
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Função para testar endpoint com tratamento robusto de erros
function Test-ProductionEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Token = $null,
        [string]$Method = "GET",
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Host "Testando: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    Write-Host "Metodo: $Method" -ForegroundColor Gray
    Write-Host "Status esperado: $ExpectedStatus" -ForegroundColor Gray
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
            'User-Agent' = 'Grifo-API-Test/1.0'
        }
        
        if ($Token) {
            $headers['Authorization'] = "Bearer $Token"
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            TimeoutSec = $TimeoutSeconds
            ErrorAction = 'Stop'
        }
        
        if ($Body -and $Method -ne "GET") {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $startTime = Get-Date
        $response = Invoke-WebRequest @params
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        $status = $response.StatusCode
        $success = ($status -eq $ExpectedStatus)
        
        if ($success) {
            Write-Host "[OK] Status: $status (esperado: $ExpectedStatus)" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] Status: $status (esperado: $ExpectedStatus)" -ForegroundColor Yellow
        }
        
        Write-Host "   Tempo de resposta: $([math]::Round($responseTime, 2))ms" -ForegroundColor Gray
        
        # Parse response if JSON
        $content = $null
        try {
            $content = $response.Content | ConvertFrom-Json
            if ($content.message) {
                Write-Host "   Mensagem: $($content.message)" -ForegroundColor Gray
            }
            if ($content.data) {
                $dataCount = if ($content.data -is [array]) { $content.data.Count } else { 1 }
                Write-Host "   Registros: $dataCount" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   Resposta nao-JSON recebida" -ForegroundColor Gray
        }
        
        return @{ 
            Success = $success
            Status = $status
            ExpectedStatus = $ExpectedStatus
            ResponseTime = $responseTime
            Data = $content
            Error = $null
        }
    }
    catch [System.Net.WebException] {
        $statusCode = $null
        $errorMessage = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $success = ($statusCode -eq $ExpectedStatus)
            
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                $errorMessage = $errorBody.error -or $errorMessage
            } catch {
                # Ignore JSON parsing errors
            }
        } else {
            $success = $false
        }
        
        if ($success) {
            Write-Host "[OK] Status: $statusCode (esperado: $ExpectedStatus)" -ForegroundColor Green
        } else {
            Write-Host "[ERRO] Status: $statusCode - $errorMessage" -ForegroundColor Red
        }
        
        return @{ 
            Success = $success
            Status = $statusCode
            ExpectedStatus = $ExpectedStatus
            Error = $errorMessage
        }
    }
    catch {
        Write-Host "[ERRO] Excecao: $($_.Exception.Message)" -ForegroundColor Red
        return @{ 
            Success = $false
            Status = $null
            ExpectedStatus = $ExpectedStatus
            Error = $_.Exception.Message
        }
    }
    finally {
        Write-Host ""
    }
}

# Configuração
$baseUrl = "https://grifo-api.onrender.com"
$results = @()

# === FASE 1: TESTES PUBLICOS ===
Write-Host "=== FASE 1: ENDPOINTS PUBLICOS ===" -ForegroundColor Magenta
Write-Host "Testando endpoints que nao requerem autenticacao..." -ForegroundColor Gray
Write-Host ""

$publicTests = @(
    @{ Name = "Root - Informacoes da API"; Url = "$baseUrl/"; Expected = 200 },
    @{ Name = "Health Check"; Url = "$baseUrl/api/health"; Expected = 200 },
    @{ Name = "Documentacao Swagger"; Url = "$baseUrl/api-docs"; Expected = 200 }
)

foreach ($test in $publicTests) {
    $result = Test-ProductionEndpoint $test.Name $test.Url -ExpectedStatus $test.Expected
    $results += $result
}

# === FASE 2: VERIFICACAO DE SEGURANCA ===
Write-Host "=== FASE 2: VERIFICACAO DE SEGURANCA ===" -ForegroundColor Magenta
Write-Host "Verificando se endpoints protegidos negam acesso sem token..." -ForegroundColor Gray
Write-Host ""

$securityTests = @(
    @{ Name = "Propriedades v1 (sem token)"; Url = "$baseUrl/api/v1/properties"; Expected = 401 },
    @{ Name = "Usuarios v1 (sem token)"; Url = "$baseUrl/api/v1/users"; Expected = 401 },
    @{ Name = "Dashboard v1 (sem token)"; Url = "$baseUrl/api/v1/dashboard"; Expected = 401 },
    @{ Name = "Vistorias v1 (sem token)"; Url = "$baseUrl/api/v1/inspections"; Expected = 401 },
    @{ Name = "Propriedades Legacy (sem token)"; Url = "$baseUrl/api/properties"; Expected = 401 },
    @{ Name = "Usuarios Legacy (sem token)"; Url = "$baseUrl/api/users"; Expected = 401 }
)

foreach ($test in $securityTests) {
    $result = Test-ProductionEndpoint $test.Name $test.Url -ExpectedStatus $test.Expected
    $results += $result
}

# === FASE 3: TESTES COM AUTENTICACAO ===
Write-Host "=== FASE 3: TESTES COM AUTENTICACAO ===" -ForegroundColor Magenta
Write-Host "Para testes completos com autenticacao, voce precisa de um token Firebase valido." -ForegroundColor Yellow
Write-Host ""
Write-Host "OPCOES PARA OBTER TOKEN:" -ForegroundColor Cyan
Write-Host "1. Abra o arquivo 'firebase-auth-test.html' no navegador" -ForegroundColor Gray
Write-Host "2. Configure suas credenciais Firebase" -ForegroundColor Gray
Write-Host "3. Faca login e copie o token gerado" -ForegroundColor Gray
Write-Host "4. Execute este script novamente com o token" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Digite o Firebase ID Token (ou pressione Enter para pular)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "[INFO] Pulando testes autenticados" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "[INFO] Iniciando testes com autenticacao..." -ForegroundColor Green
    Write-Host ""
    
    # Validar token basico
    if ($token.Length -lt 100) {
        Write-Host "[AVISO] Token parece muito curto para um token Firebase" -ForegroundColor Yellow
    }
    
    # Testes de leitura autenticados
    Write-Host "TESTES DE LEITURA (GET)" -ForegroundColor Cyan
    $authReadTests = @(
        @{ Name = "Listar Propriedades v1"; Url = "$baseUrl/api/v1/properties" },
        @{ Name = "Listar Usuarios v1"; Url = "$baseUrl/api/v1/users" },
        @{ Name = "Dashboard v1"; Url = "$baseUrl/api/v1/dashboard" },
        @{ Name = "Listar Vistorias v1"; Url = "$baseUrl/api/v1/inspections" },
        @{ Name = "Propriedades Legacy"; Url = "$baseUrl/api/properties" },
        @{ Name = "Usuarios Legacy"; Url = "$baseUrl/api/users" }
    )
    
    foreach ($test in $authReadTests) {
        $result = Test-ProductionEndpoint $test.Name $test.Url -Token $token -ExpectedStatus 200
        $results += $result
    }
    
    # Teste de criacao
    Write-Host "TESTES DE CRIACAO (POST)" -ForegroundColor Cyan
    $newProperty = @{
        endereco = "Rua de Teste $(Get-Date -Format 'HHmmss'), 123"
        tipo = "residencial"
        valor = 350000
        descricao = "Propriedade criada via teste automatizado em $(Get-Date)"
        status = "disponivel"
    }
    
    $createResult = Test-ProductionEndpoint "Criar Propriedade" "$baseUrl/api/v1/properties" -Token $token -Method "POST" -Body $newProperty -ExpectedStatus 201
    $results += $createResult
    
    # Se criacao foi bem-sucedida, testar busca
    if ($createResult.Success -and $createResult.Data.data.id) {
        $propertyId = $createResult.Data.data.id
        Write-Host "TESTE DE BUSCA ESPECIFICA" -ForegroundColor Cyan
        $getResult = Test-ProductionEndpoint "Buscar Propriedade Criada" "$baseUrl/api/v1/properties/$propertyId" -Token $token -ExpectedStatus 200
        $results += $getResult
    }
    
    # Teste de validacao
    Write-Host "TESTE DE VALIDACAO" -ForegroundColor Cyan
    $invalidData = @{
        endereco = ""
        tipo = "tipo_invalido"
        valor = -1000
    }
    
    $validationResult = Test-ProductionEndpoint "Validacao de Dados Invalidos" "$baseUrl/api/v1/properties" -Token $token -Method "POST" -Body $invalidData -ExpectedStatus 400
    $results += $validationResult
}

# === RELATORIO FINAL ===
Write-Host "=== RELATORIO FINAL ===" -ForegroundColor Cyan

$totalTests = $results.Count
$successfulTests = ($results | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $successfulTests

Write-Host "ESTATISTICAS:" -ForegroundColor White
Write-Host "  Total de testes: $totalTests" -ForegroundColor Gray
Write-Host "  Sucessos: $successfulTests" -ForegroundColor Green
Write-Host "  Falhas: $failedTests" -ForegroundColor Red

if ($totalTests -gt 0) {
    $successRate = [math]::Round(($successfulTests / $totalTests) * 100, 2)
    Write-Host "  Taxa de sucesso: $successRate%" -ForegroundColor Cyan
}

# Calcular tempo medio de resposta
$responseTimes = $results | Where-Object { $_.ResponseTime } | ForEach-Object { $_.ResponseTime }
if ($responseTimes.Count -gt 0) {
    $avgResponseTime = [math]::Round(($responseTimes | Measure-Object -Average).Average, 2)
    Write-Host "  Tempo medio de resposta: ${avgResponseTime}ms" -ForegroundColor Cyan
}

Write-Host ""

# Mostrar falhas detalhadas
if ($failedTests -gt 0) {
    Write-Host "FALHAS DETECTADAS:" -ForegroundColor Red
    $failures = $results | Where-Object { -not $_.Success }
    foreach ($failure in $failures) {
        $testName = $failure.Test -or "Teste desconhecido"
        $error = $failure.Error -or "Status: $($failure.Status) (esperado: $($failure.ExpectedStatus))"
        Write-Host "  - $testName : $error" -ForegroundColor Red
    }
    Write-Host ""
}

# Status final
if ($failedTests -eq 0 -and $totalTests -gt 0) {
    Write-Host "RESULTADO: TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "A API Grifo esta funcionando perfeitamente em producao." -ForegroundColor Green
} elseif ($failedTests -gt 0) {
    Write-Host "RESULTADO: ALGUNS TESTES FALHARAM" -ForegroundColor Yellow
    Write-Host "Verifique os detalhes das falhas acima." -ForegroundColor Yellow
} else {
    Write-Host "RESULTADO: NENHUM TESTE EXECUTADO" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== INFORMACOES DE PRODUCAO ===" -ForegroundColor Cyan
Write-Host "URL da API: $baseUrl" -ForegroundColor White
Write-Host "Documentacao: $baseUrl/api-docs" -ForegroundColor White
Write-Host "Health Check: $baseUrl/api/health" -ForegroundColor White
Write-Host "Autenticacao: Firebase Auth obrigatoria para endpoints protegidos" -ForegroundColor White

Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Para testes completos, obtenha um token Firebase valido" -ForegroundColor Gray
Write-Host "2. Use o arquivo 'firebase-auth-test.html' para autenticacao web" -ForegroundColor Gray
Write-Host "3. Execute testes de carga com ferramentas como Apache Bench ou k6" -ForegroundColor Gray
Write-Host "4. Configure monitoramento continuo da API" -ForegroundColor Gray

Write-Host ""
Write-Host "Teste concluido em $(Get-Date)" -ForegroundColor Cyan