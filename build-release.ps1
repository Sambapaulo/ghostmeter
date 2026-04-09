# ================================
# GHOSTMETER - BUILD PLAY STORE
# ================================

 $KEYSTORE_NAME="ghostmeter-release.jks"
 $KEY_ALIAS="ghostmeter-key"
 $KEYSTORE_PASSWORD="Promise2026!"
 $KEY_PASSWORD="Promise2026!"

 $JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
 $PROJECT_PATH="C:\Users\topet\ghostmeter"

 $env:JAVA_HOME=$JAVA_HOME
 $env:Path="$env:JAVA_HOME\bin;$env:Path"

Write-Host "Build AAB + APK..." -ForegroundColor Cyan

Set-Location "$PROJECT_PATH\android"
& .\gradlew clean

& .\gradlew bundleRelease `
    -Pandroid.injected.signing.store.file="../$KEYSTORE_NAME" `
    -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD `
    -Pandroid.injected.signing.key.alias=$KEY_ALIAS `
    -Pandroid.injected.signing.key.password=$KEY_PASSWORD

& .\gradlew assembleRelease `
    -Pandroid.injected.signing.store.file="../$KEYSTORE_NAME" `
    -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD `
    -Pandroid.injected.signing.key.alias=$KEY_ALIAS `
    -Pandroid.injected.signing.key.password=$KEY_PASSWORD

Write-Host "AAB: $PROJECT_PATH\android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Green
Write-Host "APK: $PROJECT_PATH\android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Green
