# Script para renomear o projeto de apk-react para grifo-mobile

# Definir caminhos
$currentPath = "$PSScriptRoot\.."
$parentPath = (Get-Item $currentPath).Parent.FullName
$newPath = "$parentPath\grifo-mobile"

# Verificar se o diretório de destino já existe
if (Test-Path $newPath) {
    Write-Host "O diretório $newPath já existe. Por favor, remova-o antes de continuar."
    exit 1
}

# Atualizar package.json
$packageJsonPath = "$currentPath\package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$packageJson.name = "grifo-mobile"
$packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath

Write-Host "package.json atualizado com o novo nome: grifo-mobile"

# Atualizar app.json
$appJsonPath = "$currentPath\app.json"
$appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
$appJson.expo.slug = "grifo-mobile"
$appJson | ConvertTo-Json -Depth 100 | Set-Content $appJsonPath

Write-Host "app.json atualizado com o novo slug: grifo-mobile"

# Instruções para renomear o diretório
Write-Host ""
Write-Host "Para completar a renomeação do projeto, execute os seguintes passos manualmente:"
Write-Host "1. Certifique-se de que todos os arquivos estão salvos e que não há processos em execução no diretório."
Write-Host "2. Feche o Visual Studio Code ou qualquer outro editor que esteja usando."
Write-Host "3. Navegue até o diretório pai: $parentPath"
Write-Host "4. Renomeie a pasta 'apk-react' para 'grifo-mobile'"
Write-Host "5. Abra o projeto novamente no seu editor"
Write-Host ""
Write-Host "Comando para renomear no PowerShell:"
Write-Host "Rename-Item -Path \"$currentPath\" -NewName \"grifo-mobile\""