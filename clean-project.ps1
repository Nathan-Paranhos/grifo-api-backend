# Script para limpar arquivos e diretórios desnecessários do projeto Grifo Mobile

# Exibir cabeçalho
Write-Host "\n===== LIMPEZA DO PROJETO GRIFO MOBILE =====\n" -ForegroundColor Cyan
Write-Host "Este script removerá arquivos e diretórios desnecessários do projeto.\n" -ForegroundColor White

# Perguntar se deseja fazer backup antes de limpar
$fazerBackup = Read-Host "Deseja fazer backup do projeto antes de limpar? (S/N)"
if ($fazerBackup -eq "S" -or $fazerBackup -eq "s") {
    $dataHora = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "$PSScriptRoot\..\grifo-mobile-backup-$dataHora"
    Write-Host "\nCriando backup em: $backupDir" -ForegroundColor Yellow
    
    # Criar diretório de backup se não existir
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    
    # Copiar arquivos para backup (excluindo node_modules e outros diretórios grandes)
    Write-Host "Copiando arquivos para backup (isso pode levar alguns minutos)..." -ForegroundColor Yellow
    robocopy $PSScriptRoot $backupDir /E /XD "$PSScriptRoot\node_modules" "$PSScriptRoot\.expo" "$PSScriptRoot\android\build" "$PSScriptRoot\android\.gradle" /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    
    Write-Host "✓ Backup concluído com sucesso!" -ForegroundColor Green
}

# Confirmar antes de prosseguir com a limpeza
$confirmation = Read-Host "\nDeseja prosseguir com a limpeza do projeto? (S/N)"
if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Host "Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit
}

# Iniciar limpeza
Write-Host "\nIniciando limpeza...\n" -ForegroundColor Cyan

# Remover diretórios de build e cache
$diretoriosParaRemover = @(
    "$PSScriptRoot\dist",
    "$PSScriptRoot\android\build",
    "$PSScriptRoot\android\.gradle",
    "$PSScriptRoot\.expo\web\cache",
    "$PSScriptRoot\simple-camera-app",
    "$PSScriptRoot\.expo\web",
    "$PSScriptRoot\.expo\artifacts",
    "$PSScriptRoot\.expo\prebuild",
    "$PSScriptRoot\node_modules\.cache"
)

$totalRemovidos = 0
$totalFalhas = 0

foreach ($dir in $diretoriosParaRemover) {
    if (Test-Path $dir) {
        Write-Host "Removendo $dir..." -ForegroundColor Yellow
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $dir)) {
            Write-Host "✓ $dir removido com sucesso!" -ForegroundColor Green
            $totalRemovidos++
        } else {
            Write-Host "✗ Falha ao remover $dir" -ForegroundColor Red
            $totalFalhas++
        }
    }
}

# Remover arquivos
$arquivosParaRemover = @(
    "$PSScriptRoot\simple-camera-app.zip",
    "$PSScriptRoot\Área de Trabalho - Atalho.lnk",
    "$PSScriptRoot\build-apk-temp.ps1",
    "$PSScriptRoot\PROD-ATUALIZADA.md",
    "$PSScriptRoot\PROJETO_SEPARADO.md",
    "$PSScriptRoot\oqfalta.md",
    "$PSScriptRoot\prod.me",
    "$PSScriptRoot\resume.me",
    "$PSScriptRoot\build-apk-no-vcs.ps1",
    "$PSScriptRoot\build-apk-no-vcs.bat",
    "$PSScriptRoot\build-with-sdk.ps1",
    "$PSScriptRoot\copiar-para-android-studio.ps1",
    "$PSScriptRoot\copiar-para-android-studio.bat",
    "$PSScriptRoot\yarn-error.log",
    "$PSScriptRoot\npm-debug.log"
)

foreach ($arquivo in $arquivosParaRemover) {
    if (Test-Path $arquivo) {
        Write-Host "Removendo $arquivo..." -ForegroundColor Yellow
        Remove-Item -Path $arquivo -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $arquivo)) {
            Write-Host "✓ $arquivo removido com sucesso!" -ForegroundColor Green
            $totalRemovidos++
        } else {
            Write-Host "✗ Falha ao remover $arquivo" -ForegroundColor Red
            $totalFalhas++
        }
    }
}

# Perguntar se deseja limpar node_modules (isso pode levar tempo)
$limparNodeModules = Read-Host "\nDeseja limpar o diretório node_modules? Isso exigirá reinstalação dos pacotes depois. (S/N)"
if ($limparNodeModules -eq "S" -or $limparNodeModules -eq "s") {
    $nodeModulesPath = "$PSScriptRoot\node_modules"
    if (Test-Path $nodeModulesPath) {
        Write-Host "Removendo node_modules (isso pode levar alguns minutos)..." -ForegroundColor Yellow
        Remove-Item -Path $nodeModulesPath -Recurse -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $nodeModulesPath)) {
            Write-Host "✓ node_modules removido com sucesso!" -ForegroundColor Green
            $totalRemovidos++
        } else {
            Write-Host "✗ Falha ao remover node_modules" -ForegroundColor Red
            $totalFalhas++
        }
    }
}

# Limpar cache do npm/yarn
$limparCache = Read-Host "\nDeseja limpar o cache do npm/yarn? (S/N)"
if ($limparCache -eq "S" -or $limparCache -eq "s") {
    Write-Host "Limpando cache do npm..." -ForegroundColor Yellow
    npm cache clean --force
    
    # Verificar se yarn está instalado
    $yarnInstalado = $null
    try {
        $yarnInstalado = Get-Command yarn -ErrorAction SilentlyContinue
    } catch {}
    
    if ($yarnInstalado) {
        Write-Host "Limpando cache do yarn..." -ForegroundColor Yellow
        yarn cache clean
    }
    
    Write-Host "✓ Cache limpo com sucesso!" -ForegroundColor Green
}

# Exibir resumo
Write-Host "\n===== LIMPEZA CONCLUÍDA =====\n" -ForegroundColor Cyan
Write-Host "Itens removidos com sucesso: $totalRemovidos" -ForegroundColor Green
if ($totalFalhas -gt 0) {
    Write-Host "Itens com falha na remoção: $totalFalhas" -ForegroundColor Red
    Write-Host "Nota: Alguns arquivos e diretórios podem não ter sido removidos se estiverem em uso." -ForegroundColor Yellow
    Write-Host "Para uma limpeza completa, feche todos os programas que possam estar usando esses arquivos e execute este script novamente.\n" -ForegroundColor Yellow
} else {
    Write-Host "O projeto foi limpo com sucesso!\n" -ForegroundColor Green
}

# Perguntar se deseja reinstalar dependências
$reinstalarDeps = Read-Host "Deseja reinstalar as dependências do projeto agora? (S/N)"
if ($reinstalarDeps -eq "S" -or $reinstalarDeps -eq "s") {
    Write-Host "\nInstalando dependências do projeto..." -ForegroundColor Cyan
    
    # Verificar se yarn está instalado e se existe yarn.lock
    $usarYarn = $false
    if (Test-Path "$PSScriptRoot\yarn.lock") {
        $usarYarn = $true
        try {
            $yarnInstalado = Get-Command yarn -ErrorAction SilentlyContinue
            if (-not $yarnInstalado) { $usarYarn = $false }
        } catch {
            $usarYarn = $false
        }
    }
    
    if ($usarYarn) {
        Write-Host "Executando yarn install..." -ForegroundColor Yellow
        yarn install
    } else {
        Write-Host "Executando npm install..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "✓ Dependências instaladas com sucesso!" -ForegroundColor Green
}

Write-Host "\nProcesso finalizado!" -ForegroundColor Cyan