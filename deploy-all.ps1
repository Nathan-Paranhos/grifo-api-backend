# Script de deploy para Grifo API e Portal

Write-Host "Iniciando processo de deploy para Grifo API e Portal..." -ForegroundColor Green

# Função para verificar se um comando existe
function Test-CommandExists {
    param ($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Verificar se o Netlify CLI está instalado
if (-not (Test-CommandExists "netlify")) {
    Write-Host "Netlify CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g netlify-cli
}

# Deploy da API para o Render.com
Write-Host "\nIniciando deploy da API para o Render.com..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\grifo-api-backend"

# Executar o script de deploy da API
if (Test-Path "deploy.ps1") {
    Write-Host "Executando script de deploy da API..." -ForegroundColor Yellow
    .\deploy.ps1
} else {
    Write-Host "Erro: Script de deploy da API não encontrado." -ForegroundColor Red
    exit 1
}

Pop-Location

# Deploy do Portal para o Netlify
Write-Host "\nIniciando deploy do Portal para o Netlify..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\grifo-portal"

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "Erro: Arquivo package.json não encontrado no diretório do portal." -ForegroundColor Red
    exit 1
}

# Configurar variáveis de ambiente para produção
Write-Host "Configurando variáveis de ambiente para produção..." -ForegroundColor Yellow

# Verificar se .env.production existe, caso contrário, criar a partir de .env
if (-not (Test-Path ".env.production")) {
    if (Test-Path ".env") {
        Copy-Item ".env" ".env.production"
        Write-Host "Arquivo .env.production criado a partir de .env" -ForegroundColor Green
    } else {
        Write-Host "Aviso: Arquivo .env não encontrado. Criando .env.production vazio." -ForegroundColor Yellow
        New-Item -Path ".env.production" -ItemType File
    }
}

# Atualizar variáveis de ambiente para produção
$envContent = Get-Content ".env.production"
$envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=https://grifo-api.onrender.com"
$envContent | Set-Content ".env.production"

# Compilar o projeto
Write-Host "Compilando o projeto do portal..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro durante a compilação do projeto do portal." -ForegroundColor Red
    exit 1
}

Write-Host "Projeto do portal compilado com sucesso!" -ForegroundColor Green

# Deploy para o Netlify
Write-Host "Fazendo deploy para o Netlify..." -ForegroundColor Yellow

# Verificar se já existe configuração do Netlify
if (Test-Path ".netlify\state.json") {
    Write-Host "Configuração do Netlify encontrada. Fazendo deploy..." -ForegroundColor Green
    netlify deploy --prod
} else {
    Write-Host "Configuração do Netlify não encontrada. Iniciando configuração..." -ForegroundColor Yellow
    netlify login
    netlify init
    netlify deploy --prod
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro durante o deploy para o Netlify." -ForegroundColor Red
    exit 1
}

Write-Host "Deploy do portal para o Netlify concluído com sucesso!" -ForegroundColor Green

Pop-Location

Write-Host "\nDeploy completo da API e Portal concluído com sucesso!" -ForegroundColor Green
Write-Host "\nURLs de acesso:" -ForegroundColor Cyan
Write-Host "API: https://grifo-api.onrender.com" -ForegroundColor White
Write-Host "Portal: Verifique a URL fornecida pelo Netlify no final do deploy" -ForegroundColor White