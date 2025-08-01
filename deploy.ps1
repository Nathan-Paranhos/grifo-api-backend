# Script de Deploy para Render via GitHub
# Execute este script para fazer deploy da aplicação

Write-Host "🚀 Iniciando processo de deploy..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na pasta grifo-api-backend" -ForegroundColor Red
    exit 1
}

# Verificar se há mudanças não commitadas
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Detectadas mudanças não commitadas:" -ForegroundColor Yellow
    git status --short
    
    $commit = Read-Host "Deseja fazer commit das mudanças? (s/n)"
    if ($commit -eq "s" -or $commit -eq "S") {
        $message = Read-Host "Digite a mensagem do commit"
        if ([string]::IsNullOrWhiteSpace($message)) {
            $message = "feat: atualizações para deploy"
        }
        
        Write-Host "📦 Fazendo commit..." -ForegroundColor Blue
        git add .
        git commit -m $message
    }
}

# Fazer push para o GitHub
Write-Host "📤 Enviando para o GitHub..." -ForegroundColor Blue
try {
    git push origin main
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao fazer push: $_" -ForegroundColor Red
    exit 1
}

# Verificar se o build local funciona
Write-Host "🔨 Testando build local..." -ForegroundColor Blue
try {
    npm run build
    Write-Host "✅ Build local bem-sucedido!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Aviso: Build local falhou. Verifique os erros antes do deploy." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deploy iniciado!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Acesse https://dashboard.render.com" -ForegroundColor White
Write-Host "   2. Verifique o status do deploy" -ForegroundColor White
Write-Host "   3. Monitore os logs em caso de erro" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Endpoints importantes:" -ForegroundColor Cyan
Write-Host "   Health Check: https://seu-app.onrender.com/health" -ForegroundColor White
Write-Host "   API Docs: https://seu-app.onrender.com/api-docs" -ForegroundColor White