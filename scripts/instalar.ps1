<#
.SYNOPSIS
    Instalador maestro del Sistema Congreso ETS 2026 para Windows 10 y Windows 11 (64-bit).
.DESCRIPTION
    Orquesta la verificación previa de dependencias y servicios, la selección interactiva
    del directorio de destino, la copia optimizada de archivos, aprovisionamiento de PostgreSQL,
    generación de credenciales criptográficas AES-256, compilación de paquetes y creación de
    accesos directos en el escritorio.
#>

# Forzar UTF-8 en la sesión de PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Determinar directorios clave
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installerRoot = Split-Path -Parent $scriptDir

# Soporte dual: Paquete autocontenido (app_payload) vs Repositorio de desarrollo
$payloadDir = Join-Path $installerRoot "app_payload"
if (Test-Path $payloadDir) {
    $projectSourceRoot = $payloadDir
    Write-Host "  [i] Modo de ejecucion: Paquete autonomo autocontenido detectado." -ForegroundColor Cyan
} elseif (Test-Path (Join-Path $installerRoot "backend")) {
    $projectSourceRoot = $installerRoot
    Write-Host "  [i] Modo de ejecucion: Raiz del proyecto detectada." -ForegroundColor Cyan
} else {
    $projectSourceRoot = Split-Path -Parent $installerRoot
    Write-Host "  [i] Modo de ejecucion: Repositorio de desarrollo detectado." -ForegroundColor Cyan
}

# Cargar módulos auxiliares
$utilidadesPath = Join-Path $scriptDir "utilidades.ps1"
$verificarPath  = Join-Path $scriptDir "verificar_servicios.ps1"
$configDbPath   = Join-Path $scriptDir "configurar_db.ps1"

if (Test-Path $utilidadesPath) { . $utilidadesPath }
if (Test-Path $verificarPath)  { . $verificarPath }
if (Test-Path $configDbPath)   { . $configDbPath }

# -----------------------------------------------------------------------------
# FASE 1: Verificación de Servicios Previos y Dependencias
# -----------------------------------------------------------------------------
$auditOk = Invoke-PreflightWizard
if (-not $auditOk) {
    Write-WarningMsg "El instalador no puede continuar sin los componentes obligatorios."
    Write-Host "Presione cualquier tecla para salir..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# -----------------------------------------------------------------------------
# FASE 2: Selección de Carpeta de Destino
# -----------------------------------------------------------------------------
Show-Header "Paso 2: Seleccion de Directorio de Instalacion"

Write-Host "  El instalador desplegara todos los archivos y configuraciones del sistema" -ForegroundColor White
Write-Host "  en la carpeta que usted determine a continuacion." -ForegroundColor Gray
Write-Host ""

$carpetaDefault = "C:\CongresoETS2026"
$rutaDestinoBruta = Show-FolderPicker -Descripcion "Seleccione la carpeta donde se instalara Congreso ETS 2026" -CarpetaPorDefecto $carpetaDefault

# Sanitizar y normalizar ruta destino (eliminar comillas y barras finales conflictivas)
$rutaDestino = $rutaDestinoBruta.Trim().Trim('"', "'").TrimEnd('\', '/')

Write-Host ""
Write-Info "Carpeta de instalacion seleccionada: $rutaDestino"

# Validar / Crear directorio destino
try {
    if (-not (Test-Path $rutaDestino)) {
        New-Item -ItemType Directory -Path $rutaDestino -Force | Out-Null
        Write-Success "Directorio creado: $rutaDestino"
    } else {
        Write-Success "Directorio existente validado: $rutaDestino"
    }

    # Probar permisos de escritura
    $testFile = Join-Path $rutaDestino ".write_test_tmp"
    "test" | Set-Content -Path $testFile -Force
    Remove-Item $testFile -Force
    Write-Success "Permisos de escritura verificados."
}
catch {
    Write-ErrorMsg "No se pudo escribir en el directorio seleccionado: $_"
    Write-Host "Presione cualquier tecla para salir..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# -----------------------------------------------------------------------------
# FASE 3: Copia y Despliegue de Archivos del Sistema
# -----------------------------------------------------------------------------
Show-Header "Paso 3: Copia y Despliegue de Archivos"

Write-Info "Origen:  $projectSourceRoot"
Write-Info "Destino: $rutaDestino"
Write-Host ""

# Lista de carpetas a copiar de forma limpia
$carpetasACopiar = @("backend", "frontend", "scripts", "manuales", "certs")

foreach ($carpeta in $carpetasACopiar) {
    $origenSub = Join-Path $projectSourceRoot $carpeta
    $destinoSub = Join-Path $rutaDestino $carpeta

    if (Test-Path $origenSub) {
        Write-Host "  -> Desplegando modulo '$carpeta'..." -ForegroundColor Cyan

        # Robocopy para copia ultrarrápida excluyendo node_modules, caches y temporales
        $roboParams = @(
            $origenSub,
            $destinoSub,
            "/E",
            "/XD", "node_modules", ".next", ".git", "dist", "backups", "coverage", "dist_windows", "dist_linux",
            "/XF", "*.log", ".env", ".env.local", "*.zip",
            "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np"
        )
        & robocopy @roboParams | Out-Null
        if ($LASTEXITCODE -lt 8) {
            Write-Success "Modulo '$carpeta' desplegado correctamente."
        } else {
            Write-WarningMsg "Robocopy reporto codigo $LASTEXITCODE al copiar '$carpeta'."
        }
    } else {
        if ($carpeta -ne "certs") {
            Write-WarningMsg "No se encontro la carpeta origen '$carpeta'."
        }
    }
}

# Copiar scripts lanzadores y de control en la raíz del destino
$plantillasDir = Join-Path $installerRoot "plantillas"

# Buscar orígenes para los scripts de control diario (.bat)
$controlBats = @("Iniciar_Congreso.bat", "Detener_Congreso.bat", "Revisar_Servicios.bat", "Reparar_BaseDatos.bat", "Desinstalar_Congreso.bat")
foreach ($bat in $controlBats) {
    $fuente = $null
    if (Test-Path (Join-Path $plantillasDir $bat)) {
        $fuente = Join-Path $plantillasDir $bat
    } elseif (Test-Path (Join-Path $installerRoot $bat)) {
        $fuente = Join-Path $installerRoot $bat
    } elseif (Test-Path (Join-Path $projectSourceRoot $bat)) {
        $fuente = Join-Path $projectSourceRoot $bat
    }

    if ($fuente) {
        Copy-Item $fuente -Destination (Join-Path $rutaDestino $bat) -Force
    }
}

# Copiar manual si está presente
$manualSrc = $null
if (Test-Path (Join-Path $installerRoot "MANUAL_INSTALACION_WINDOWS.md")) {
    $manualSrc = Join-Path $installerRoot "MANUAL_INSTALACION_WINDOWS.md"
} elseif (Test-Path (Join-Path $projectSourceRoot "MANUAL_INSTALACION_WINDOWS.md")) {
    $manualSrc = Join-Path $projectSourceRoot "MANUAL_INSTALACION_WINDOWS.md"
}
if ($manualSrc) {
    Copy-Item $manualSrc -Destination (Join-Path $rutaDestino "MANUAL_INSTALACION_WINDOWS.md") -Force
}

# Copiar scripts auxiliares de diagnóstico a scripts/ sin anidamiento
$targetScriptsDir = Join-Path $rutaDestino "scripts"
if (-not (Test-Path $targetScriptsDir)) { New-Item -ItemType Directory -Path $targetScriptsDir -Force | Out-Null }

$auxScripts = @("utilidades.ps1", "verificar_servicios.ps1", "configurar_db.ps1", "detener_servicios.ps1", "revisar_servicios.ps1", "reparar_integridad.ps1", "desinstalar.ps1")
foreach ($s in $auxScripts) {
    $sFuente = Join-Path $scriptDir $s
    if (-not (Test-Path $sFuente)) { $sFuente = Join-Path (Join-Path $projectSourceRoot "scripts") $s }
    if (Test-Path $sFuente) {
        Copy-Item $sFuente -Destination (Join-Path $targetScriptsDir $s) -Force
    }
}

Write-Success "Scripts de arranque, control, diagnostico e integridad desplegados."

# Copiar package.json raíz si existe
if (Test-Path (Join-Path $projectSourceRoot "package.json")) {
    Copy-Item (Join-Path $projectSourceRoot "package.json") -Destination (Join-Path $rutaDestino "package.json") -Force
}

# -----------------------------------------------------------------------------
# FASE 4: Configuración e Inicialización de Base de Datos
# -----------------------------------------------------------------------------
$dbConfig = $null
$dbExito = Invoke-DatabaseSetup -RutaDestino $rutaDestino -DbConfigResult ([ref]$dbConfig)

if (-not $dbExito) {
    Write-WarningMsg "No se pudo completar la inicializacion automatica de la base de datos."
    Write-Host "  Puede inicializar manualmente ejecutando Reparar_BaseDatos.bat mas tarde." -ForegroundColor Yellow
    Write-Host "  ¿Desea continuar con el resto de la instalacion? [S/N]: " -NoNewline -ForegroundColor Cyan
    $resp = Read-Host
    if ($resp.Trim().ToUpper() -ne "S") {
        exit 1
    }
}

# -----------------------------------------------------------------------------
# FASE 5: Generación de Entorno y Seguridad Criptográfica
# -----------------------------------------------------------------------------
Show-Header "Paso 5: Generacion de Parametros y Claves Criptograficas"

$envDestino = "$rutaDestino\backend\.env"
$templateEnv = Join-Path $plantillasDir "backend.env.template"
if (-not (Test-Path $templateEnv)) {
    $templateEnv = Join-Path (Join-Path $installerRoot "plantillas") "backend.env.template"
}

$dbUrl = if ($dbConfig) { $dbConfig.Url } else { "postgresql://postgres:postgres@localhost:5432/congreso_ets2026" }
$cryptoKey = New-CryptoKeyHex
$cronSecret = "cron_sec_" + (New-CryptoKeyHex).Substring(0, 24)

if (Test-Path $templateEnv) {
    $envContent = Get-Content $templateEnv -Raw
    $envContent = $envContent.Replace("{{DATABASE_URL}}", $dbUrl)
    $envContent = $envContent.Replace("{{ENCRYPTION_KEY}}", $cryptoKey)
    $envContent = $envContent.Replace("{{CRON_SECRET}}", $cronSecret)
    Set-Content -Path $envDestino -Value $envContent -Encoding UTF8
    Write-Success "Archivo de configuracion 'backend\.env' generado con clave criptografica AES-256."
} else {
    # Generar .env directamente con plantilla estándar si no se halla el archivo template
    $envDirect = @"
# ==============================================================================
# Variables de Entorno - Backend Congreso ETS 2026 (Windows 10 / 11)
# ==============================================================================

DATABASE_URL="$dbUrl"
ENCRYPTION_KEY="$cryptoKey"
CRON_SECRET="$cronSecret"

PORT=4000
NODE_ENV="production"
CORS_ORIGIN="http://localhost:3000"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Congreso ETS 2026 – DETS GCABA <notificaciones@congresoets2026.bue.edu.ar>"
"@
    Set-Content -Path $envDestino -Value $envDirect -Encoding UTF8
    Write-Success "Archivo de configuracion 'backend\.env' generado directamente con claves AES-256."
}

# Configuración de variables de entorno para Frontend
$frontendEnv = "$rutaDestino\frontend\.env.local"
'NEXT_PUBLIC_API_URL="http://localhost:4000"' | Set-Content -Path $frontendEnv -Encoding UTF8
Write-Success "Archivo de configuracion 'frontend\.env.local' generado apuntando al Backend (4000)."

# -----------------------------------------------------------------------------
# FASE 6: Instalación de Dependencias y Compilación de Módulos
# -----------------------------------------------------------------------------
Show-Header "Paso 6: Instalacion de Dependencias y Compilacion"

Write-Host "  Instalando paquetes de Backend y Frontend. Esto puede demorar unos minutos..." -ForegroundColor Yellow
Write-Host ""

# Determinar comando npm funcional (priorizar npm.cmd en Windows para evitar restricciones de script)
$npmExe = "npm.cmd"
if (-not (Get-Command $npmExe -ErrorAction SilentlyContinue)) { $npmExe = "npm" }

# Backend - Install
Write-Info "Instalando dependencias de Backend API..."
Push-Location "$rutaDestino\backend"
& $npmExe install --no-audit --no-fund
if ($LASTEXITCODE -eq 0) {
    Write-Success "Dependencias de Backend instaladas correctamente."
} else {
    Write-WarningMsg "npm install en Backend finalizo con advertencias."
}

# Backend - Build (TypeScript -> dist)
Write-Info "Compilando Backend API (TypeScript -> dist)..."
& $npmExe run build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend compilado exitosamente (dist/server.js)."
} else {
    Write-WarningMsg "Compilacion de Backend arrojo avisos (se admitira ejecucion via tsx/dev)."
}
Pop-Location

# Frontend - Install
Write-Info "Instalando dependencias de Frontend Web..."
Push-Location "$rutaDestino\frontend"
& $npmExe install --no-audit --no-fund
if ($LASTEXITCODE -eq 0) {
    Write-Success "Dependencias de Frontend instaladas correctamente."
} else {
    Write-WarningMsg "npm install en Frontend finalizo con advertencias."
}

# Frontend - Build (Next.js -> .next)
Write-Info "Compilando Frontend Web (Next.js)..."
& $npmExe run build
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend compilado exitosamente (.next)."
} else {
    Write-WarningMsg "Compilacion de Frontend arrojo avisos (se admitira ejecucion via next dev)."
}
Pop-Location

# -----------------------------------------------------------------------------
# FASE 7: Accesos Directos y Finalización
# -----------------------------------------------------------------------------
Show-Header "Paso 7: Creacion de Accesos Directos y Finalizacion"

# Acceso directo en el Escritorio
$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$shortcutPath = Join-Path $desktopPath "Congreso ETS 2026.lnk"
$targetBat = Join-Path $rutaDestino "Iniciar_Congreso.bat"

$creado = New-WindowsShortcut `
    -ShortcutPath $shortcutPath `
    -TargetPath $targetBat `
    -WorkingDirectory $rutaDestino `
    -Description "Iniciar Plataforma Congreso ETS 2026 - DETS GCABA"

if ($creado) {
    Write-Success "Acceso directo creado en el Escritorio: 'Congreso ETS 2026.lnk'"
}

# Resumen final
Show-Header "Instalacion Completada con Exito"

Write-Host "  ========================================================================" -ForegroundColor Green
Write-Host "   EL SISTEMA CONGRESO ETS 2026 HA SIDO INSTALADO CORRECTAMENTE          " -ForegroundColor White
Write-Host "  ========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Ruta de instalacion : $rutaDestino" -ForegroundColor White
Write-Host "  Servidor Web        : http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API         : http://localhost:4000" -ForegroundColor White
Write-Host "  Control del sistema : Iniciar_Congreso.bat / Detener_Congreso.bat" -ForegroundColor Gray
Write-Host "  Reparacion y aforos : Reparar_BaseDatos.bat" -ForegroundColor Gray
Write-Host "  Comprobacion salud  : Revisar_Servicios.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "  ¿Desea iniciar el sistema y realizar el Smoke Test de salud ahora? [S/N]: " -NoNewline -ForegroundColor Cyan
$iniciarYa = Read-Host

if ($iniciarYa -and $iniciarYa.Trim().ToUpper() -eq "S") {
    Write-Info "Lanzando Congreso ETS 2026..."
    Start-Process -FilePath "$rutaDestino\Iniciar_Congreso.bat" -WorkingDirectory $rutaDestino
    Write-Info "Esperando 5 segundos para comprobar disponibilidad de servicios..."
    Start-Sleep -Seconds 5
    Invoke-SmokeTestHTTP
}

Write-Host ""
Write-Host "  Gracias por utilizar el instalador de Congreso ETS 2026." -ForegroundColor Green
Write-Host "  Presione cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
