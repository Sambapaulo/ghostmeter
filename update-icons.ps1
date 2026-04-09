 $projectPath = "C:\Users\topet\ghostmeter"
 $androidRes = "$projectPath\android\app\src\main\res"
 $sourceIcon = "$projectPath\resources\icon.png"

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
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
    
    $size = $iconSizes[$folder]
    $img = [System.Drawing.Image]::FromFile($sourceIcon)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $size, $size)
    $bmp.Save("$path\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save("$path\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    Write-Host "✅ $folder ($size x $size)" -ForegroundColor Green
}
Write-Host "`n✨ Icônes mises à jour!" -ForegroundColor Magenta
