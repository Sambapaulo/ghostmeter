# build-apk.ps1 - Script complet pour reconstruire l'APK GhostMeter avec la nouvelle icône

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "👻 GhostMeter - Build APK Complet" -ForegroundColor Magenta
Write-Host "================================="

# Aller dans le dossier du projet
$scriptPath = Split-Path -Parent $PSScriptRoot
if (-not $scriptPath) {
    $scriptPath = "C:\Users\topet\ghostmeter"
}

Set-Location $scriptPath
Write-Host "📁 Dossier projet: $scriptPath" -ForegroundColor Cyan

# 1. Git pull
Write-Host ""
Write-Host "1️⃣  Récupération des derniers changements..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Git pull a eu des problèmes, on continue..." -ForegroundColor Yellow
}

# 2. Capacitor sync
Write-Host ""
Write-Host "2️⃣  Synchronisation Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la synchronisation Capacitor" -ForegroundColor Red
    exit 1
}

# 3. Mise à jour des icônes
Write-Host ""
Write-Host "3️⃣  Mise à jour des icônes Android..." -ForegroundColor Yellow

$androidRes = "$scriptPath\android\app\src\main\res"
$sourceIcon = "$scriptPath\resources\icon.png"

$iconSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

Add-Type -AssemblyName System.Drawing

foreach ($folder in $iconSizes.Keys) {
    $path = "$androidRes\$folder"
    
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
    
    $size = $iconSizes[$folder]
    $dest = "$path\ic_launcher.png"
    $destRound = "$path\ic_launcher_round.png"
    
    $img = [System.Drawing.Image]::FromFile($sourceIcon)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $size, $size)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($destRound, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    
    Write-Host "   ✅ $folder ($size x $size)" -ForegroundColor Green
}

# 4. Build APK
Write-Host ""
Write-Host "4️⃣  Build de l'APK signé..." -ForegroundColor Yellow
Set-Location "$scriptPath\android"

.\gradlew clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du clean" -ForegroundColor Red
    exit 1
}

.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build" -ForegroundColor Red
    exit 1
}

# 5. Résultat
Write-Host ""
Write-Host "=================================" -ForegroundColor Magenta
Write-Host "✨ BUILD RÉUSSI !" -ForegroundColor Green
Write-Host ""
Write-Host "📦 APK:" -ForegroundColor Cyan
Write-Host "   $scriptPath\android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
Write-Host ""
Write-Host "📱 Installez l'APK sur votre téléphone pour voir la nouvelle icône !" -ForegroundColor Yellow
