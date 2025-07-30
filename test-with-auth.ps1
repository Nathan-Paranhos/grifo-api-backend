# Script de Teste Completo com Autenticação Firebase
# Testa todos os endpoints da API Grifo com token real de produção

Write-Host "=== TESTE COMPLETO COM AUTENTICACAO FIREBASE ===" -ForegroundColor Cyan
Write-Host "Data/Hora: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Função para testar endpoint com autenticação
function Test-AuthenticatedEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Token,
        [string]$Method = "GET",
        [object]$Body = $null,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Host "Testando: $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    Write-Host "Método: $Method" -ForegroundColor Gray
    
    try {
        $headers = @{
            'Authorization' = "Bearer $Token"
            'Content-Type' = 'application/json'
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
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        
        Write-Host "[OK] Status: $status - OK" -ForegroundColor Green
        Write-Host "   Resposta: $($content.message -or 'Dados recebidos')" -ForegroundColor Gray
        
        if ($content.data) {
            $dataCount = if ($content.data -is [array]) { $content.data.Count } else { 1 }
            Write-Host "   Registros: $dataCount" -ForegroundColor Gray
        }
        
        return @{ Success = $true; Status = $status; Data = $content }
    }
    catch [System.Net.WebException] {
        $statusCode = $null
        $errorMessage = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                $errorMessage = $errorBody.error -or $errorMessage
            } catch {
                # Ignore JSON parsing errors
            }
        }
        
        Write-Host "[ERRO] Erro HTTP: $statusCode - $errorMessage" -ForegroundColor Red
        return @{ Success = $false; Status = $statusCode; Error = $errorMessage }
    }
    catch {
        Write-Host "[ERRO] Erro: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
    finally {
        Write-Host ""
    }
}

# Função para obter token Firebase (simulação - em produção seria obtido via login)
function Get-FirebaseToken {
    Write-Host "CONFIGURACAO DE AUTENTICACAO" -ForegroundColor Magenta
    Write-Host "Para testar com autenticação real, você precisa:" -ForegroundColor Yellow
    Write-Host "1. Fazer login no Firebase Auth" -ForegroundColor Gray
    Write-Host "2. Obter o ID Token do usuário autenticado" -ForegroundColor Gray
    Write-Host "3. Inserir o token quando solicitado" -ForegroundColor Gray
    Write-Host ""
    
    # Solicitar token do usuário
    $token = Read-Host "Digite o Firebase ID Token (ou pressione Enter para pular testes autenticados)"
    
    if ([string]::IsNullOrWhiteSpace($token)) {
        Write-Host "[AVISO] Nenhum token fornecido. Pulando testes autenticados." -ForegroundColor Yellow
        return $null
    }
    
    # Validar formato básico do token
    if ($token.Length -lt 100) {
        Write-Host "[AVISO] Token parece muito curto. Tokens Firebase geralmente têm mais de 100 caracteres." -ForegroundColor Yellow
        $continue = Read-Host "Continuar mesmo assim? (s/N)"
        if ($continue -ne 's' -and $continue -ne 'S') {
            return $null
        }
    }
    
    Write-Host "[OK] Token configurado. Iniciando testes autenticados..." -ForegroundColor Green
    Write-Host ""
    return $token
}

# Configuração
$baseUrl = "https://grifo-api.onrender.com"
$results = @()

# === TESTES PÚBLICOS PRIMEIRO ===
Write-Host "=== ENDPOINTS PÚBLICOS (Sem Autenticação) ===" -ForegroundColor Magenta

$publicTests = @(
    @{ Name = "Health Check"; Url = "$baseUrl/api/health" },
    @{ Name = "Informações da API"; Url = "$baseUrl/" },
    @{ Name = "Documentação Swagger"; Url = "$baseUrl/api-docs" }
)

foreach ($test in $publicTests) {
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method GET -TimeoutSec 30
        Write-Host "[OK] $($test.Name): Status $($response.StatusCode)" -ForegroundColor Green
        $results += @{ Success = $true; Test = $test.Name }
    }
    catch {
        Write-Host "[ERRO] $($test.Name): Falhou" -ForegroundColor Red
        $results += @{ Success = $false; Test = $test.Name }
    }
}

Write-Host ""

# === OBTER TOKEN DE AUTENTICAÇÃO ===
$firebaseToken = Get-FirebaseToken

if ($firebaseToken) {
    # === TESTES COM AUTENTICAÇÃO ===
    Write-Host "=== ENDPOINTS PROTEGIDOS (Com Autenticação) ===" -ForegroundColor Magenta
    
    # Testes de leitura (GET)
    $readTests = @(
        @{ Name = "Listar Propriedades (v1)"; Url = "$baseUrl/api/v1/properties" },
        @{ Name = "Listar Usuários (v1)"; Url = "$baseUrl/api/v1/users" },
        @{ Name = "Dashboard (v1)"; Url = "$baseUrl/api/v1/dashboard" },
        @{ Name = "Listar Vistorias (v1)"; Url = "$baseUrl/api/v1/inspections" },
        @{ Name = "Listar Empresas (v1)"; Url = "$baseUrl/api/v1/empresas" },
        @{ Name = "Propriedades Legacy"; Url = "$baseUrl/api/properties" },
        @{ Name = "Usuários Legacy"; Url = "$baseUrl/api/users" },
        @{ Name = "Dashboard Legacy"; Url = "$baseUrl/api/dashboard" }
    )
    
    Write-Host "TESTES DE LEITURA (GET)" -ForegroundColor Cyan
    foreach ($test in $readTests) {
        $result = Test-AuthenticatedEndpoint $test.Name $test.Url $firebaseToken "GET"
        $results += $result
    }
    
    # === TESTES DE CRIACAO (POST) ===
    Write-Host "TESTES DE CRIACAO (POST)" -ForegroundColor Cyan
    
    # Teste de criação de propriedade
    $newProperty = @{
        endereco = "Rua Teste, 123 - Teste"
        tipo = "residencial"
        valor = 250000
        descricao = "Propriedade de teste criada via API"
        status = "disponivel"
    }
    
    $createResult = Test-AuthenticatedEndpoint "Criar Propriedade" "$baseUrl/api/v1/properties" $firebaseToken "POST" $newProperty
    $results += $createResult
    
    # Se a criação foi bem-sucedida, tentar buscar a propriedade criada
    if ($createResult.Success -and $createResult.Data.data.id) {
        $propertyId = $createResult.Data.data.id
        Write-Host "Testando busca da propriedade criada (ID: $propertyId)" -ForegroundColor Cyan
        $getResult = Test-AuthenticatedEndpoint "Buscar Propriedade Criada" "$baseUrl/api/v1/properties/$propertyId" $firebaseToken "GET"
        $results += $getResult
    }
    
    # === TESTE DE VALIDAÇÃO ===
    Write-Host "TESTES DE VALIDACAO" -ForegroundColor Cyan
    
    # Teste com dados inválidos
    $invalidProperty = @{
        endereco = ""
        tipo = "tipo_invalido"
        valor = -1000
    }
    
    $validationResult = Test-AuthenticatedEndpoint "Validação de Dados Inválidos" "$baseUrl/api/v1/properties" $firebaseToken "POST" $invalidProperty
    $results += $validationResult
    
} else {
    Write-Host "[INFO] Pulando testes autenticados (token nao fornecido)" -ForegroundColor Yellow
}

# === RESUMO FINAL ===
Write-Host "=== RESUMO DOS TESTES ===" -ForegroundColor Cyan

$totalTests = $results.Count
$successfulTests = ($results | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $successfulTests

Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "[OK] Sucessos: $successfulTests" -ForegroundColor Green
Write-Host "[ERRO] Falhas: $failedTests" -ForegroundColor Red

if ($totalTests -gt 0) {
    $successRate = [math]::Round(($successfulTests / $totalTests) * 100, 2)
    Write-Host "Taxa de sucesso: $successRate%" -ForegroundColor Cyan
}

if ($failedTests -eq 0 -and $totalTests -gt 0) {
    Write-Host "`nTODOS OS TESTES PASSARAM! A API esta funcionando perfeitamente em producao." -ForegroundColor Green
} elseif ($failedTests -gt 0) {
    Write-Host "`nAlguns testes falharam. Verifique os detalhes acima." -ForegroundColor Yellow
    
    # Mostrar falhas
    $failures = $results | Where-Object { -not $_.Success }
    if ($failures) {
        Write-Host "`nFALHAS DETECTADAS:" -ForegroundColor Red
        foreach ($failure in $failures) {
            Write-Host "   - $($failure.Test -or 'Teste'): $($failure.Error)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== INFORMACOES DE PRODUCAO ===" -ForegroundColor Cyan
Write-Host "URL da API: $baseUrl" -ForegroundColor White
Write-Host "Documentacao: $baseUrl/api-docs" -ForegroundColor White
Write-Host "Health Check: $baseUrl/api/health" -ForegroundColor White
Write-Host "Autenticacao: Firebase Auth obrigatoria para endpoints protegidos" -ForegroundColor White

Write-Host "`nCOMO OBTER TOKEN FIREBASE:" -ForegroundColor Yellow
Write-Host "   1. Acesse o console do Firebase: https://console.firebase.google.com" -ForegroundColor Gray
Write-Host "   2. Faca login com uma conta autorizada" -ForegroundColor Gray
Write-Host "   3. Use o SDK do Firebase para obter o ID Token" -ForegroundColor Gray
Write-Host "   4. Exemplo: await firebase.auth().currentUser.getIdToken()" -ForegroundColor Gray

Write-Host "`nTeste concluido em $(Get-Date)" -ForegroundColor Cyan