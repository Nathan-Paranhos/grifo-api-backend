# Script para testar as rotas da API localmente

Write-Host "Iniciando testes das rotas da API..." -ForegroundColor Green

# Definir URL base (local ou remota)
$baseUrl = "http://localhost:3000"
# Para testar a versão em produção, descomente a linha abaixo
# $baseUrl = "https://grifo-api.onrender.com"

# Função para fazer requisições HTTP e exibir resultados formatados
function Invoke-ApiRequest {
    param (
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )

    $url = "$baseUrl$Endpoint"
    $params = @{
        Method = $Method
        Uri = $url
        Headers = $Headers
        ContentType = "application/json"
    }

    if ($Body -ne $null) {
        $jsonBody = $Body | ConvertTo-Json -Depth 10
        $params.Add("Body", $jsonBody)
    }

    Write-Host "\n[$Method] $Description" -ForegroundColor Cyan
    Write-Host "URL: $url" -ForegroundColor Gray
    
    if ($Headers.Count -gt 0) {
        Write-Host "Headers:" -ForegroundColor Gray
        $Headers.GetEnumerator() | ForEach-Object {
            Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
        }
    }

    if ($Body -ne $null) {
        Write-Host "Body:" -ForegroundColor Gray
        Write-Host "  $jsonBody" -ForegroundColor Gray
    }

    try {
        $response = Invoke-RestMethod @params -ErrorVariable responseError
        Write-Host "Resposta (Status: 200):" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5 | Write-Host
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Erro (Status: $statusCode):" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            $responseBody | Write-Host
        } catch {
            Write-Host $_.Exception.Message
        }
    }
}

# Testar rota de saúde (health)
Invoke-ApiRequest -Method "GET" -Endpoint "/api/health" -Description "Verificar status da API"

# Testar rota do dashboard
Invoke-ApiRequest -Method "GET" -Endpoint "/api/dashboard?empresaId=emp_001" -Description "Obter informações do dashboard"

# Testar rota de estatísticas do dashboard
Invoke-ApiRequest -Method "GET" -Endpoint "/api/dashboard/stats?empresaId=emp_001" -Description "Obter estatísticas do dashboard"

# Testar rota de inspeções
Invoke-ApiRequest -Method "GET" -Endpoint "/api/inspections?empresaId=emp_001" -Description "Listar inspeções"

# Testar rota de detalhes de inspeção
Invoke-ApiRequest -Method "GET" -Endpoint "/api/inspections/insp_001?empresaId=emp_001" -Description "Obter detalhes de uma inspeção"

# Testar rota de sincronização
Invoke-ApiRequest -Method "GET" -Endpoint "/api/sync?empresaId=emp_001" -Description "Obter informações de sincronização"

# Testar rota de status de sincronização
Invoke-ApiRequest -Method "GET" -Endpoint "/api/sync/status?empresaId=emp_001" -Description "Obter status de sincronização"

# Testar rota de propriedades
Invoke-ApiRequest -Method "GET" -Endpoint "/api/properties?empresaId=emp_001" -Description "Listar propriedades"

# Testar rota de contestações
Invoke-ApiRequest -Method "GET" -Endpoint "/api/contestations?empresaId=emp_001" -Description "Listar contestações"

# Testar criação de contestação para uma inspeção
$contestationBody = @{
    empresaId = "emp_001"
    motivo = "Informações incorretas"
    detalhes = "A metragem do imóvel está incorreta"
    itensContestados = @(
        @{
            categoria = "Características"
            item = "Metragem"
            motivoContestacao = "Valor incorreto"
            evidencia = "https://example.com/evidence1.jpg"
        }
    )
}

Invoke-ApiRequest -Method "POST" -Endpoint "/api/inspections/insp_001/contest" -Description "Contestar uma inspeção" -Body $contestationBody

Write-Host "\nTestes concluídos!" -ForegroundColor Green