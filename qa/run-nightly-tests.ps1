# Orquestador nocturno: emulador headless + Appium + pruebas UI + simulación API.
# Funciona con la pantalla del equipo bloqueada: el emulador corre sin ventana.
$ErrorActionPreference = 'Continue'
$sdk = 'C:\Users\Sistemas\AppData\Local\Android\Sdk'
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
# El APK de la app es arm64; el AVD ARM necesita emulación TCG.
$env:ANDROID_I_WANT_MY_TCG = 'yes'
$adb = Join-Path $sdk 'platform-tools\adb.exe'
$emu = Join-Path $sdk 'emulator\emulator.exe'

function Test-Emulator {
  $out = & $adb devices 2>$null
  return ($out -match 'emulator-\d+\s+device')
}

if (-not (Test-Emulator)) {
  # Quita procesos qemu huérfanos que bloquean el mismo AVD.
  Get-Process -Name 'qemu-system-x86_64-headless','qemu-system-x86_64','qemu-system-aarch64-headless' -ErrorAction SilentlyContinue | Stop-Process -Force
  & $adb kill-server 2>$null
  Start-Process -FilePath $emu -ArgumentList '-avd yayika-arm -no-window -noaudio -no-boot-anim -accel off -port 5554' -WindowStyle Hidden | Out-Null
  & $adb wait-for-device
  for ($i = 0; $i -lt 90; $i++) {
    $boot = & $adb shell getprop sys.boot_completed 2>$null
    if ($boot.Trim() -eq '1') { break }
    Start-Sleep -Seconds 5
  }
}

# Pantalla del AVD nunca se bloquea ni se apaga (no depende de la pantalla física).
& $adb shell settings put secure lock_screen_lock_after_timeout 0 2>$null
& $adb shell settings put system screen_off_timeout 2147483647 2>$null
& $adb shell settings put global stay_on_while_plugged_in 7 2>$null
& $adb shell input keyevent 82 2>$null

# Appium en segundo plano, sin ventana.
$appiumUp = $false
try { $appiumUp = (Invoke-WebRequest -Uri 'http://127.0.0.1:4723/status' -TimeoutSec 3 -UseBasicParsing).StatusCode -eq 200 } catch {}
if (-not $appiumUp) {
  $appiumIndex = 'C:\Users\Sistemas\AppData\Roaming\npm\node_modules\appium\index.js'
  Start-Process -FilePath 'node' -ArgumentList "`"$appiumIndex`" --base-path /" -WindowStyle Hidden | Out-Null
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 2
    try { if ((Invoke-WebRequest -Uri 'http://127.0.0.1:4723/status' -TimeoutSec 2 -UseBasicParsing).StatusCode -eq 200) { $appiumUp = $true; break } } catch {}
  }
}

# UI real una vez por noche (5 idiomas con reinstall y screenshots).
$uiDir = Join-Path $PSScriptRoot 'results\ui'
New-Item -ItemType Directory -Force -Path $uiDir | Out-Null
$stamp = Join-Path $uiDir 'last-run-date.txt'
$today = (Get-Date).ToString('yyyy-MM-dd')
if (-not (Test-Path $stamp) -or (Get-Content $stamp -Raw).Trim() -ne $today) {
  Write-Output '== UI real (Appium, 5 idiomas) =='
  node (Join-Path $PSScriptRoot 'appium-ui-test.mjs')
  Set-Content -Path $stamp -Value $today -Encoding utf8
} else {
  Write-Output 'UI real ya ejecutada hoy.'
}

Write-Output '== Simulación API + estrés =='
node --env-file=.env (Join-Path $PSScriptRoot 'live-user-sim.mjs')
