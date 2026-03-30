# update-icons.ps1 - Mettre à jour les icônes Android pour GhostMeter
# Exécuter ce script après avoir fait git pull et npx cap sync android

$projectPath = Split-Path -Parent $PSScriptRoot
if (-not $projectPath) {
    $projectPath = "C:\Users\topet\ghostmeter"
}

$androidRes = "$projectPath\android\app\src\main\res"

Write-Host "👻 GhostMeter - Mise à jour des icônes Android" -ForegroundColor Magenta
Write-Host "============================================="

# Vérifier que le dossier Android existe
if (-not (Test-Path "$projectPath\android")) {
    Write-Host "❌ Dossier Android non trouvé. Exécutez d'abord: npx cap sync android" -ForegroundColor Red
    exit 1
}

# Tailles des icônes Android
$iconSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Source icon
$sourceIcon = "$projectPath\resources\icon.png"

if (-not (Test-Path $sourceIcon)) {
    Write-Host "❌ Icône source non trouvée: $sourceIcon" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Source: $sourceIcon" -ForegroundColor Cyan

# Charger System.Drawing
Add-Type -AssemblyName System.Drawing

# Créer les dossiers et redimensionner les icônes
foreach ($folder in $iconSizes.Keys) {
    $path = "$androidRes\$folder"
    
    # Créer le dossier si nécessaire
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "📁 Dossier créé: $folder" -ForegroundColor Yellow
    }
    
    $size = $iconSizes[$folder]
    $dest = "$path\ic_launcher.png"
    $destRound = "$path\ic_launcher_round.png"
    
    # Charger et redimensionner l'image
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
    
    Write-Host "✅ $folder\ic_launcher.png ($size x $size)" -ForegroundColor Green
    Write-Host "✅ $folder\ic_launcher_round.png ($size x $size)" -ForegroundColor Green
}

# Mettre à jour les icônes de notification si le dossier existe
$notifSizes = @{
    "drawable-mdpi" = 24
    "drawable-hdpi" = 36
    "drawable-xhdpi" = 48
    "drawable-xxhdpi" = 72
    "drawable-xxxhdpi" = 96
}

foreach ($folder in $notifSizes.Keys) {
    $path = "$androidRes\$folder"
    
    if (Test-Path $path) {
        $size = $notifSizes[$folder]
        $dest = "$path\ic_notification.png"
        
        $img = [System.Drawing.Image]::FromFile($sourceIcon)
        $bmp = New-Object System.Drawing.Bitmap($size, $size)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $size, $size)
        $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $g.Dispose()
        $bmp.Dispose()
        $img.Dispose()
        
        Write-Host "✅ $folder\ic_notification.png ($size x $size)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✨ Icônes Android mises à jour avec succès !" -ForegroundColor Magenta
Write-Host ""
Write-Host "📱 Maintenant, reconstruisez l'APK:" -ForegroundColor Cyan
Write-Host "   cd android" -ForegroundColor White
Write-Host "   .\gradlew clean" -ForegroundColor White
Write-Host "   .\gradlew assembleRelease" -ForegroundColor White
Write-Host ""
Write-Host "📦 APK: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Yellow
