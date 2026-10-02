<#
.SYNOPSIS
    Script de empaquetado del instalador autónomo para Windows 10 y Windows 11 (64-bit).
.DESCRIPTION
    Genera el paquete distribuible ZIP 'CongresoETS2026_Instalador_Windows.zip'
    en la carpeta 'dist_windows/', empaquetando el código limpio en 'app_payload/'
    junto con los scripts y asistentes de instalación autónoma.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$distDir = Join-Path $rootDir "dist_windows"
$packageName = "CongresoETS2026_Instalador_Windows"
$stageDir = Join-Path $distDir $packageName
$zipOutput = Join-Path $distDir "${packageName}.zip"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  EMPAQUETANDO INSTALADOR AUTONOMO PARA WINDOWS 10 Y 11 (DETS GCABA)" -ForegroundColor White
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  Directorio raiz : $rootDir" -ForegroundColor Gray
Write-Host "  Destino staging : $stageDir" -ForegroundColor Gray
Write-Host "  Archivo ZIP     : $zipOutput" -ForegroundColor Gray
Write-Host ""

# 1. Limpiar directorio previo
if (Test-Path $stageDir) {
    Write-Host "  [i] Limpiando carpeta temporal de staging previa..." -ForegroundColor DarkGray
    Remove-Item -Path $stageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stageDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stageDir "app_payload") -Force | Out-Null

# 2. Copiar componentes base del instalador
Write-Host "  [1/5] Copiando scripts y asistentes del instalador..." -ForegroundColor Cyan
$installerSource = Join-Path $rootDir "windows-installer"
if (-not (Test-Path $installerSource)) {
    $installerSource = $rootDir
}

Copy-Item (Join-Path $installerSource "Instalar_CongresoETS2026.bat") -Destination $stageDir -Force
Copy-Item (Join-Path $installerSource "Revisar_Servicios.bat") -Destination $stageDir -Force
Copy-Item (Join-Path $installerSource "MANUAL_INSTALACION_WINDOWS.md") -Destination $stageDir -Force
Copy-Item (Join-Path $installerSource "scripts") -Destination $stageDir -Recurse -Force
Copy-Item (Join-Path $installerSource "plantillas") -Destination $stageDir -Recurse -Force

# Asegurar que Reparar_BaseDatos.bat, Desinstalar_Congreso.bat y Iniciar/Detener estén en plantillas
$plantillasStage = Join-Path $stageDir "plantillas"
Copy-Item (Join-Path $rootDir "Iniciar_Congreso.bat") -Destination $plantillasStage -Force
Copy-Item (Join-Path $rootDir "Detener_Congreso.bat") -Destination $plantillasStage -Force
Copy-Item (Join-Path $rootDir "Reparar_BaseDatos.bat") -Destination $plantillasStage -Force
Copy-Item (Join-Path $rootDir "Revisar_Servicios.bat") -Destination $plantillasStage -Force
Copy-Item (Join-Path $rootDir "Desinstalar_Congreso.bat") -Destination $plantillasStage -Force
Copy-Item (Join-Path $rootDir "StartCongresoDev.bat") -Destination $plantillasStage -Force

# 3. Empaquetar Backend limpio dentro de app_payload
Write-Host "  [2/5] Empaquetando Backend (excluyendo node_modules, dist, .env y backups)..." -ForegroundColor Cyan
$targetBackend = Join-Path $stageDir "app_payload\backend"
New-Item -ItemType Directory -Path $targetBackend -Force | Out-Null

$roboBackend = @(
    (Join-Path $rootDir "backend"),
    $targetBackend,
    "/E",
    "/XD", "node_modules", "dist", "coverage", "backups", ".git",
    "/XF", "*.log", ".env", "*.zip",
    "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"
)
& robocopy @roboBackend | Out-Null

# 4. Empaquetar Frontend limpio dentro de app_payload
Write-Host "  [3/5] Empaquetando Frontend (excluyendo node_modules, .next y .env.local)..." -ForegroundColor Cyan
$targetFrontend = Join-Path $stageDir "app_payload\frontend"
New-Item -ItemType Directory -Path $targetFrontend -Force | Out-Null

$roboFrontend = @(
    (Join-Path $rootDir "frontend"),
    $targetFrontend,
    "/E",
    "/XD", "node_modules", ".next", ".git",
    "/XF", "*.log", ".env.local", "*.zip",
    "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"
)
& robocopy @roboFrontend | Out-Null

# 5. Empaquetar manuales, certs, scripts y package.json
Write-Host "  [4/5] Empaquetando manuales interactivos, scripts y configuracion raiz..." -ForegroundColor Cyan
$appPayload = Join-Path $stageDir "app_payload"

if (Test-Path (Join-Path $rootDir "manuales")) {
    Copy-Item (Join-Path $rootDir "manuales") -Destination $appPayload -Recurse -Force
}
if (Test-Path (Join-Path $rootDir "certs")) {
    Copy-Item (Join-Path $rootDir "certs") -Destination $appPayload -Recurse -Force
}
if (Test-Path (Join-Path $rootDir "scripts")) {
    Copy-Item (Join-Path $rootDir "scripts") -Destination $appPayload -Recurse -Force
}
if (Test-Path (Join-Path $rootDir "package.json")) {
    Copy-Item (Join-Path $rootDir "package.json") -Destination $appPayload -Force
}

# 6. Generar archivo comprimido ZIP
Write-Host "  [5/5] Comprimiendo paquete ZIP distribuible..." -ForegroundColor Cyan
if (Test-Path $zipOutput) {
    Remove-Item $zipOutput -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($stageDir, $zipOutput)

$sizeMb = [math]::Round(((Get-Item $zipOutput).Length / 1MB), 2)

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "  PAQUETE INSTALADOR GENERADO EXITOSAMENTE" -ForegroundColor White
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "  Carpeta autonoma : $stageDir" -ForegroundColor White
Write-Host "  Archivo ZIP listo: $zipOutput ($sizeMb MB)" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "  Instrucciones de distribucion:" -ForegroundColor White
Write-Host "  1. Copie el archivo '$packageName.zip' a cualquier equipo con Windows 10 u 11." -ForegroundColor Gray
Write-Host "  2. Descomprima el archivo ZIP." -ForegroundColor Gray
Write-Host "  3. Ejecute 'Instalar_CongresoETS2026.bat' con doble clic." -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Green
