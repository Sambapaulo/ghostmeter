# ================================
# GHOSTMETER - BUILD PLAY STORE
# ================================

$KEYSTORE_NAME="ghostmeter-release.jks"
$KEY_ALIAS="ghostmeter-key"
$KEYSTORE_PASSWORD="Promise2026!!"  # ⚠️ CHANGEZ CECI
$KEY_PASSWORD="Promise2026!!"        # ⚠️ CHANGEZ CECI

$JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$PROJECT_PATH="C:\Users\topet\Desktop\Ghostmeter"

# ================================
# ENV JAVA
# ================================

$env:JAVA_HOME=$JAVA_HOME
$env:Path="$env:JAVA_HOME\bin;$env:Path"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   GHOSTMETER - BUILD PLAY STORE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Java version:" -ForegroundColor Yellow
java -version
Write-Host ""

# ================================
# CHECK PROJECT PATH
# ================================

if (!(Test-Path $PROJECT_PATH)) {
    Write-Host "ERREUR: Dossier projet introuvable: $PROJECT_PATH" -ForegroundColor Red
    Write-Host "Modifiez PROJECT_PATH dans le script" -ForegroundColor Red
    pause
    exit
}

Set-Location $PROJECT_PATH
Write-Host "Dossier projet: $PROJECT_PATH" -ForegroundColor Green

# ================================
# CREATE KEYSTORE (si pas existant)
# ================================

if (!(Test-Path $KEYSTORE_NAME)) {
    Write-Host ""
    Write-Host "Creation du keystore..." -ForegroundColor Yellow
    
    & keytool -genkeypair `
        -v `
        -keystore $KEYSTORE_NAME `
        -alias $KEY_ALIAS `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $KEYSTORE_PASSWORD `
        -keypass $KEY_PASSWORD `
        -dname "CN=GhostMeter, OU=Development, O=Sambapaulo, L=Paris, S=IleDeFrance, C=FR"
    
    Write-Host "Keystore cree: $KEYSTORE_NAME" -ForegroundColor Green
}
else {
    Write-Host "Keystore deja existant: $KEYSTORE_NAME" -ForegroundColor Green
}

# ================================
# CLEAN PROJECT
# ================================

Write-Host ""
Write-Host "Nettoyage du projet..." -ForegroundColor Yellow

Set-Location "$PROJECT_PATH\android"

if (!(Test-Path ".\gradlew.bat")) {
    Write-Host "ERREUR: gradlew introuvable dans android\" -ForegroundColor Red
    pause
    exit
}

& .\gradlew clean

# ================================
# BUILD AAB (Android App Bundle) - POUR PLAY STORE
# ================================

Write-Host ""
Write-Host "Build AAB (Play Store)..." -ForegroundColor Yellow

& .\gradlew bundleRelease `
-Pandroid.injected.signing.store.file="../$KEYSTORE_NAME" `
-Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD `
-Pandroid.injected.signing.key.alias=$KEY_ALIAS `
-Pandroid.injected.signing.key.password=$KEY_PASSWORD

# ================================
# BUILD APK (pour tester)
# ================================

Write-Host ""
Write-Host "Build APK (test)..." -ForegroundColor Yellow

& .\gradlew assembleRelease `
-Pandroid.injected.signing.store.file="../$KEYSTORE_NAME" `
-Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD `
-Pandroid.injected.signing.key.alias=$KEY_ALIAS `
-Pandroid.injected.signing.key.password=$KEY_PASSWORD

# ================================
# RESULTAT
# ================================

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "         RESULTATS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$AAB_PATH="$PROJECT_PATH\android\app\build\outputs\bundle\release\app-release.aab"
$APK_PATH="$PROJECT_PATH\android\app\build\outputs\apk\release\app-release.apk"

Write-Host ""

if (Test-Path $AAB_PATH) {
    $AAB_SIZE = [math]::Round((Get-Item $AAB_PATH).Length / 1MB, 2)
    Write-Host "AAB (Play Store):" -ForegroundColor Green
    Write-Host "  $AAB_PATH" -ForegroundColor White
    Write-Host "  Taille: $AAB_SIZE MB" -ForegroundColor Gray
}
else {
    Write-Host "AAB: ERREUR - non cree" -ForegroundColor Red
}

Write-Host ""

if (Test-Path $APK_PATH) {
    $APK_SIZE = [math]::Round((Get-Item $APK_PATH).Length / 1MB, 2)
    Write-Host "APK (Test):" -ForegroundColor Green
    Write-Host "  $APK_PATH" -ForegroundColor White
    Write-Host "  Taille: $APK_SIZE MB" -ForegroundColor Gray
}
else {
    Write-Host "APK: ERREUR - non cree" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "SAUVEGARDEZ VOTRE KEYSTORE !" -ForegroundColor Yellow
Write-Host $KEYSTORE_NAME -ForegroundColor White
Write-Host "Sans lui, impossible de mettre a jour l'app !" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

Set-Location $PROJECT_PATH
pause
