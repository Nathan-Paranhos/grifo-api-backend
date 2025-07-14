# PowerShell script to build APK for Grifo Vistorias

Write-Host "Building APK for Grifo Vistorias..." -ForegroundColor Green

# Get the current directory
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$androidDir = Join-Path $currentDir "android"

# Change to the android directory
Set-Location $androidDir

Write-Host "Running Gradle clean..." -ForegroundColor Yellow
& .\gradlew.bat clean

Write-Host "Building release APK..." -ForegroundColor Yellow
& .\gradlew.bat :app:assembleRelease

$apkPath = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"

if (Test-Path $apkPath) {
    Write-Host "\nBuild successful!" -ForegroundColor Green
    Write-Host "APK location: $apkPath" -ForegroundColor Cyan
} else {
    Write-Host "\nBuild may have failed. Check the logs above for errors." -ForegroundColor Red
}

Write-Host "\nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")