# Script de Deploy para Render - Grifo API Backend
# Execute este script após configurar as variáveis de ambiente no Render

Write-Host "🚀 Preparando deploy para Render..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório grifo-api-backend" -ForegroundColor Red
    exit 1
}

# Limpar build anterior
Write-Host "🧹 Limpando build anterior..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# Build do projeto
Write-Host "🔨 Compilando projeto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na compilação" -ForegroundColor Red
    exit 1
}

# Testar localmente
Write-Host "🧪 Testando build local..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
Start-Job -ScriptBlock { 
    Set-Location $using:PWD
    node dist/index.js 
} -Name "TestServer"

Start-Sleep -Seconds 3

# Testar health check
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host "✅ Health check funcionando!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Health check retornou status inesperado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro no health check: $($_.Exception.Message)" -ForegroundColor Red
}

# Parar servidor de teste
Get-Job -Name "TestServer" | Stop-Job
Get-Job -Name "TestServer" | Remove-Job

Write-Host ""
Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS NO RENDER:" -ForegroundColor Cyan
Write-Host "1. Configure as variáveis de ambiente (veja RENDER-DEPLOY-INSTRUCTIONS.md)" -ForegroundColor White
Write-Host "2. Faça commit e push das alterações" -ForegroundColor White
Write-Host "3. Execute deploy manual no dashboard do Render" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Health check estará disponível em: https://seu-app.onrender.com/health" -ForegroundColor Cyan
Write-Host "📚 Documentação: https://seu-app.onrender.com/api-docs" -ForegroundColor Cyan

Write-Host ""
Write-Host "⚠️ IMPORTANTE: Certifique-se de configurar as credenciais Firebase REAIS no Render!" -ForegroundColor Yellow