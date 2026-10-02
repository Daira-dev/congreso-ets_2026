<#
.SYNOPSIS
    Asistente interactivo de desinstalación del Sistema Congreso ETS 2026 en Windows 10 y 11.
.DESCRIPTION
    Permite detener ordenadamente los servicios, generar un resguardo preventivo (backup),
    eliminar la base de datos PostgreSQL, remover los accesos directos del escritorio
    y limpiar los archivos de la aplicación.
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = Split-Path -Parent $scriptDir

# Cargar utilidades si existen
if (Test-Path "$scriptDir\utilidades.ps1") { . "$scriptDir\utilidades.ps1" }
if (Test-Path "$scriptDir\detener_servicios.ps1") { . "$scriptDir\detener_servicios.ps1" }

function Show-UninstallerHeader {
    Clear-Host
    Write-Host " ==========================================================================" -ForegroundColor Red
    Write-Host "   ASISTENTE DE DESINSTALACION - CONGRESO ETS 2026 (DETS - GCABA)         " -ForegroundColor White
    Write-Host "   Plataforma Microsoft Windows 10 y Windows 11 (64-bit)                  " -ForegroundColor DarkGray
    Write-Host " ==========================================================================" -ForegroundColor Red
    Write-Host ""
}

Show-UninstallerHeader

Write-Host "  Este asistente le guiara para remover el Sistema Congreso ETS 2026" -ForegroundColor Yellow
Write-Host "  de este equipo de manera controlada y sin dejar procesos huerfanos." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Carpeta detectada: $installDir" -ForegroundColor White
Write-Host ""
Write-Host "  ADVERTENCIA: Esta accion detendra los servicios web y podra eliminar" -ForegroundColor DarkYellow
Write-Host "  los datos de la base de datos si usted asi lo confirma." -ForegroundColor DarkYellow
Write-Host ""

Write-Host "  ¿Esta seguro de que desea proceder con la desinstalacion? [S/N]: " -NoNewline -ForegroundColor Cyan
$confirmacion = Read-Host
if ($confirmacion.Trim().ToUpper() -ne "S") {
    Write-Host ""
    Write-Host "  [i] Desinstalacion cancelada por el usuario." -ForegroundColor Gray
    Start-Sleep -Seconds 2
    exit 0
}

# -----------------------------------------------------------------------------
# PASO 1: Detener servicios en ejecución
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host "  PASO 1: Detencion de Servicios Web (Puertos 3000 y 4000)" -ForegroundColor Red
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host ""

$puertos = @(3000, 4000)
foreach ($puerto in $puertos) {
    try {
        $conexiones = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue
        if ($conexiones) {
            foreach ($conn in $conexiones) {
                $pidProc = $conn.OwningProcess
                Write-Host "  -> Deteniendo proceso en puerto $puerto (PID: $pidProc)..." -ForegroundColor Yellow
                Stop-Process -Id $pidProc -Force -ErrorAction SilentlyContinue
            }
            Write-Host "  [OK] Puerto $puerto liberado." -ForegroundColor Green
        } else {
            Write-Host "  [OK] Puerto $puerto no se encuentra en uso." -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  [i] No se detectaron conexiones activas en puerto $puerto." -ForegroundColor Gray
    }
}

# -----------------------------------------------------------------------------
# PASO 2: Resguardo preventivo de Base de Datos (Opcional)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host "  PASO 2: Resguardo Preventivo (Backup) de la Base de Datos" -ForegroundColor Red
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host ""

Write-Host "  ¿Desea exportar una copia de seguridad (backup SQL) antes de desinstalar? [S/N]: " -NoNewline -ForegroundColor Cyan
$hacerBackup = Read-Host

if ($hacerBackup.Trim().ToUpper() -eq "S") {
    $desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
    $fechaStr = (Get-Date).ToString("yyyyMMdd_HHmmss")
    $backupFile = Join-Path $desktopPath "backup_previo_desinstalacion_congreso_$fechaStr.sql"

    # Localizar pg_dump
    $pgDumpExe = (Get-Command "pg_dump" -ErrorAction SilentlyContinue)?.Source
    if (-not $pgDumpExe) {
        $rutasDump = @(
            Get-Item "C:\Program Files\PostgreSQL\*\bin\pg_dump.exe" -ErrorAction SilentlyContinue
            Get-Item "C:\Program Files (x86)\PostgreSQL\*\bin\pg_dump.exe" -ErrorAction SilentlyContinue
        ) | Sort-Object FullName -Descending
        if ($rutasDump.Count -gt 0) { $pgDumpExe = $rutasDump[0].FullName }
    }

    if ($pgDumpExe) {
        Write-Host ""
        Write-Host "  Puerto de PostgreSQL [5432 / 5433]: " -NoNewline -ForegroundColor White
        $pgPort = Read-Host
        if ([string]::IsNullOrWhiteSpace($pgPort)) { $pgPort = 5432 }

        Write-Host "  Usuario [postgres]: " -NoNewline -ForegroundColor White
        $pgUser = Read-Host
        if ([string]::IsNullOrWhiteSpace($pgUser)) { $pgUser = "postgres" }

        Write-Host "  Contrasena de '$pgUser': " -NoNewline -ForegroundColor White
        $pgPass = Read-Host -AsSecureString
        $pgPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPass))

        $env:PGPASSWORD = $pgPassPlain
        Write-Host "  Exportando base de datos 'congreso_ets2026' al Escritorio..." -ForegroundColor Yellow
        & $pgDumpExe -h localhost -p $pgPort -U $pgUser -d congreso_ets2026 -F p -f $backupFile 2>&1 | Out-Null
        $env:PGPASSWORD = $null

        if (Test-Path $backupFile) {
            Write-Host "  [OK] Copia de seguridad creada exitosamente en:" -ForegroundColor Green
            Write-Host "       $backupFile" -ForegroundColor White
        } else {
            Write-Host "  [!] No se pudo generar el backup automatico. Verifique credenciales." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [!] No se localizo 'pg_dump.exe' en el sistema. Omitiendo backup." -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------------------------
# PASO 3: Remoción de la Base de Datos PostgreSQL (Opcional)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host "  PASO 3: Gestion de la Base de Datos PostgreSQL" -ForegroundColor Red
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host ""
Write-Host "  ¿Desea ELIMINAR permanentemente la base de datos 'congreso_ets2026'? [S/N]: " -NoNewline -ForegroundColor Cyan
$eliminarDb = Read-Host

if ($eliminarDb.Trim().ToUpper() -eq "S") {
    $psqlExe = (Get-Command "psql" -ErrorAction SilentlyContinue)?.Source
    if (-not $psqlExe) {
        $rutasPsql = @(
            Get-Item "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
            Get-Item "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
        ) | Sort-Object FullName -Descending
        if ($rutasPsql.Count -gt 0) { $psqlExe = $rutasPsql[0].FullName }
    }

    if ($psqlExe) {
        Write-Host "  Puerto de PostgreSQL [5432 / 5433]: " -NoNewline -ForegroundColor White
        $pgPort = Read-Host
        if ([string]::IsNullOrWhiteSpace($pgPort)) { $pgPort = 5432 }

        Write-Host "  Usuario [postgres]: " -NoNewline -ForegroundColor White
        $pgUser = Read-Host
        if ([string]::IsNullOrWhiteSpace($pgUser)) { $pgUser = "postgres" }

        Write-Host "  Contrasena de '$pgUser': " -NoNewline -ForegroundColor White
        $pgPass = Read-Host -AsSecureString
        $pgPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPass))

        $env:PGPASSWORD = $pgPassPlain
        Write-Host "  Desconectando sesiones activas y eliminando 'congreso_ets2026'..." -ForegroundColor Yellow
        
        $termSql = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'congreso_ets2026' AND pid <> pg_backend_pid();"
        & $psqlExe -h localhost -p $pgPort -U $pgUser -d postgres -c $termSql 2>&1 | Out-Null
        
        $dropRes = & $psqlExe -h localhost -p $pgPort -U $pgUser -d postgres -c "DROP DATABASE IF EXISTS congreso_ets2026;" 2>&1
        $env:PGPASSWORD = $null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Base de datos 'congreso_ets2026' eliminada con exito." -ForegroundColor Green
        } else {
            Write-Host "  [!] Error al eliminar la base de datos: $dropRes" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  [i] La base de datos 'congreso_ets2026' se conservo intacta en PostgreSQL." -ForegroundColor Gray
}

# -----------------------------------------------------------------------------
# PASO 4: Eliminar accesos directos
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host "  PASO 4: Remocion de Accesos Directos" -ForegroundColor Red
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host ""

$desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$shortcutPath = Join-Path $desktopPath "Congreso ETS 2026.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item -Path $shortcutPath -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Acceso directo en el Escritorio eliminado." -ForegroundColor Green
} else {
    Write-Host "  [i] No se encontro acceso directo en el Escritorio." -ForegroundColor Gray
}

# -----------------------------------------------------------------------------
# PASO 5: Limpieza de archivos de la instalación
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host "  PASO 5: Eliminacion de Archivos y Carpetas de la Plataforma" -ForegroundColor Red
Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkRed
Write-Host ""

Write-Host "  Directorio de la plataforma: $installDir" -ForegroundColor White
Write-Host ""
Write-Host "  Para completar la desinstalacion fisica de todos los archivos:" -ForegroundColor Yellow
Write-Host "  1. Cierre esta ventana de consola al finalizar." -ForegroundColor Gray
Write-Host "  2. Elimine manualmente la carpeta '$installDir' desde el Explorador de Windows." -ForegroundColor Gray
Write-Host "     (O vacie la papelera de reciclaje)." -ForegroundColor Gray
Write-Host ""
Write-Host "  Nota sobre componentes del sistema:" -ForegroundColor Cyan
Write-Host "  - Node.js y PostgreSQL no se desinstalan automaticamente porque podrian" -ForegroundColor Gray
Write-Host "    ser utilizados por otras aplicaciones del equipo. Si desea desinstalarlos," -ForegroundColor Gray
Write-Host "    vaya a 'Configuracion de Windows -> Aplicaciones instaladas'." -ForegroundColor Gray
Write-Host ""
Write-Host " ==========================================================================" -ForegroundColor Green
Write-Host "   DESINSTALACION COMPLETADA EXITOSAMENTE" -ForegroundColor White
Write-Host " ==========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Presione cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
