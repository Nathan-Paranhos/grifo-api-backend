# Teste da API Grifo com Token Firebase
# Token obtido do firebase-auth-test.html

$token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjZkZTQwZjA0ODgxYzZhMDE2MTFlYjI4NGE0Yzk1YTI1MWU5MTEyNTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYmFuY28tdmlzaW9uYXJpYSIsImF1ZCI6ImJhbmNvLXZpc2lvbmFyaWEiLCJhdXRoX3RpbWUiOjE3NTM3NTM4MDEsInVzZXJfaWQiOiI0WURDNG5hQUZuV0l0dU1FTE1lZjBTZEhFWXEyIiwic3ViIjoiNFlEQzRuYUFGbldJdHVNRUxNZWYwU2RIRVlxMiIsImlhdCI6MTc1Mzc1MzgwMSwiZXhwIjoxNzUzNzU3NDAxLCJlbWFpbCI6InBhcmFuaG9zY29udGF0by5uQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJwYXJhbmhvc2NvbnRhdG8ubkBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.Eh6Bgpna-yfPIyogu2gidg9cBBqQQx7mMyHPmmKaDtofHo2u_qFhif8akGpMoi4_5yTozkhlFsGvqFESk5MfLX-GNTQOo4HeNik_wvBpZXsj_76dVzcTQbE8qd-FAkxdyCoufjdZ0r-UQIE9IXZdWfqZWskfGzn-pW9qFnnwVAmbFI6vD_gSIOcnA8I9ElIPVhIW4nUJOfNu7kUZHuUtWzcKPQgEf3RSzEprPrY79oogtieTsBhtIk_APkJ5nb-sp8fmJQ9iWOg5VOGCnozvk0ha--IzAPQRiewnFYST-7oDG00uVg_Ep_hU8ShgvUy40AEgqeHB6i7g6jISQet1SA'

Write-Host "=== TESTE DA API GRIFO COM TOKEN FIREBASE ===" -ForegroundColor Green
Write-Host "Usuario: paranhoscontato.n@gmail.com" -ForegroundColor Yellow
Write-Host ""

$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

# Funcao para testar endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = 'GET',
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    Write-Host "Testando: $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url"
    Write-Host "Metodo: $Method"
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body -TimeoutSec 30
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -TimeoutSec 30
        }
        
        $stopwatch.Stop()
        
        Write-Host "[SUCESSO] Status: 200" -ForegroundColor Green
        Write-Host "Tempo de resposta: $($stopwatch.ElapsedMilliseconds)ms"
        
        if ($response -is [array]) {
            Write-Host "Itens retornados: $($response.Count)"
        } elseif ($response.PSObject.Properties.Name -contains 'id') {
            Write-Host "ID do item: $($response.id)"
        }
        
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "[ERRO] $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        }
        Write-Host ""
        return $false
    }
}

# Testes dos endpoints autenticados
$sucessos = 0
$total = 0

# Teste 1: Propriedades v1
$total++
if (Test-Endpoint "Propriedades v1" "https://grifo-api.onrender.com/api/v1/properties" "GET" $headers) {
    $sucessos++
}

# Teste 2: Usuarios v1
$total++
if (Test-Endpoint "Usuarios v1" "https://grifo-api.onrender.com/api/v1/users" "GET" $headers) {
    $sucessos++
}

# Teste 3: Dashboard v1
$total++
if (Test-Endpoint "Dashboard v1" "https://grifo-api.onrender.com/api/v1/dashboard" "GET" $headers) {
    $sucessos++
}

# Teste 4: Vistorias v1
$total++
if (Test-Endpoint "Vistorias v1" "https://grifo-api.onrender.com/api/v1/inspections" "GET" $headers) {
    $sucessos++
}

# Teste 5: Propriedades Legacy
$total++
if (Test-Endpoint "Propriedades Legacy" "https://grifo-api.onrender.com/api/properties" "GET" $headers) {
    $sucessos++
}

# Teste 6: Usuarios Legacy
$total++
if (Test-Endpoint "Usuarios Legacy" "https://grifo-api.onrender.com/api/users" "GET" $headers) {
    $sucessos++
}

# Relatorio final
Write-Host "=== RELATORIO FINAL ===" -ForegroundColor Green
Write-Host "Total de testes: $total"
Write-Host "Sucessos: $sucessos" -ForegroundColor Green
Write-Host "Falhas: $($total - $sucessos)" -ForegroundColor Red
Write-Host "Taxa de sucesso: $([math]::Round(($sucessos / $total) * 100, 2))%"

if ($sucessos -eq $total) {
    Write-Host "\n🎉 TODOS OS TESTES PASSARAM! A API GRIFO ESTA FUNCIONANDO PERFEITAMENTE COM AUTENTICACAO FIREBASE!" -ForegroundColor Green
} else {
    Write-Host "\n⚠️  Alguns testes falharam. Verifique os logs acima para mais detalhes." -ForegroundColor Yellow
}