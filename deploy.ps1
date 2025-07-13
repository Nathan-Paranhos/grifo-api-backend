# Script de deploy para o Render.com

Write-Host "Iniciando processo de deploy para o Render.com..." -ForegroundColor Green

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "Erro: Arquivo package.json não encontrado. Certifique-se de estar no diretório raiz do projeto." -ForegroundColor Red
    exit 1
}

# Configurar variáveis de ambiente para produção
Write-Host "Configurando variáveis de ambiente para produção..." -ForegroundColor Yellow
$envContent = Get-Content ".env"
$envContent = $envContent -replace "NODE_ENV=development", "NODE_ENV=production"
$envContent = $envContent -replace "BYPASS_AUTH=true", "BYPASS_AUTH=false"
$envContent = $envContent -replace "CORS_ORIGIN=\*", "CORS_ORIGIN=https://app.grifovistorias.com,android-app://com.grifo.vistorias"
$envContent | Set-Content ".env.production"

Write-Host "Arquivo .env.production criado com sucesso!" -ForegroundColor Green

# Compilar o projeto
Write-Host "Compilando o projeto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro durante a compilação do projeto." -ForegroundColor Red
    exit 1
}

Write-Host "Projeto compilado com sucesso!" -ForegroundColor Green

# Criar arquivo de configuração para o Render.com
Write-Host "Criando arquivo render.yaml..." -ForegroundColor Yellow
$renderYaml = @"
services:
  - type: web
    name: grifo-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: CORS_ORIGIN
        value: https://app.grifovistorias.com,android-app://com.grifo.vistorias
      - key: LOG_LEVEL
        value: info
      - key: RATE_LIMIT_WINDOW_MS
        value: 900000
      - key: RATE_LIMIT_MAX
        value: 100
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 1d
"@

$renderYaml | Set-Content "render.yaml"

Write-Host "Arquivo render.yaml criado com sucesso!" -ForegroundColor Green

# Instruções para deploy manual no Render.com
Write-Host "
Para fazer o deploy no Render.com, siga estas etapas:" -ForegroundColor Cyan
Write-Host "1. Faça commit das alterações no repositório Git" -ForegroundColor White
Write-Host "2. Faça push para o repositório remoto" -ForegroundColor White
Write-Host "3. Acesse o dashboard do Render.com" -ForegroundColor White
Write-Host "4. Selecione seu serviço 'grifo-api'" -ForegroundColor White
Write-Host "5. Clique em 'Manual Deploy' > 'Deploy latest commit'" -ForegroundColor White
Write-Host "6. Aguarde o processo de build e deploy concluir" -ForegroundColor White
Write-Host "7. Teste a API usando: curl https://grifo-api.onrender.com/api/health" -ForegroundColor White

Write-Host "
Preparação para deploy concluída com sucesso!" -ForegroundColor Green