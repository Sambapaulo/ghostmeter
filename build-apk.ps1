# Script de build Android - corrige automatiquement Java 21 -> 17

Write-Host "Sync Capacitor..."
npx cap sync android

Write-Host "Fixing Java version to 17..."

# Fixer tous les fichiers gradle
Get-ChildItem -Path "android\app", "android\capacitor-cordova-android-plugins" -Recurse -Include "*.gradle" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content.Contains('VERSION_21')) {
        $content = $content -replace 'VERSION_21', 'VERSION_17'
        Set-Content $_.FullName -Value $content -Encoding UTF8
    }
}

# Fixer variables.gradle
if (Test-Path "android\variables.gradle") {
    $content = Get-Content "android\variables.gradle" -Raw
    $content = $content -replace '= 21', '= 17'
    Set-Content "android\variables.gradle" -Value $content -Encoding UTF8
}

Write-Host "Building APK..."
cd android
.\gradlew assembleDebug

Write-Host ""
Write-Host "APK ready: android\app\build\outputs\apk\debug\app-debug.apk"
