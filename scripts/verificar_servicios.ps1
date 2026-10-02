<#
.SYNOPSIS
    Módulo de auditoría y verificación previa de dependencias y servicios del sistema.
.DESCRIPTION
    Inspecciona si Node.js, NPM y PostgreSQL están instalados y en ejecución en Windows.
    Si faltan componentes, los presenta en una lista diagnóstica y asiste al usuario
    para descargarlos e instalarlos antes de permitir continuar.
#>

# Cargar utilidades si están disponibles
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path "$scriptDir\utilidades.ps1") {
    . "$scriptDir\utilidades.ps1"
}

function Audit-SystemServices {
    param([ref]$ResultadosAudit)

    $todoListo = $true
    $items = @()

    # -------------------------------------------------------------------------
    # 1. Verificación de Node.js
    # -------------------------------------------------------------------------
    $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    $nodeVersion = $null
    $nodeOk = $false
    $nodeDetalle = "No instalado o no figura en el PATH"
    $nodeAccion = "Descargar e instalar Node.js LTS (>= v18.18.0)"

    if ($nodeCmd) {
        try {
            $rawVer = (& node -v 2>$null).Trim()
            if ($rawVer -match "v(\d+)\.(\d+)\.(\d+)") {
                $major = [int]$matches[1]
                $minor = [int]$matches[2]
                $nodeVersion = $rawVer
                if ($major -ge 18) {
                    $nodeOk = $true
                    $nodeDetalle = "Instalado ($nodeVersion)"
                    $nodeAccion = "Ninguna (Cumple requisitos)"
                } else {
                    $nodeDetalle = "Versión obsoleta ($nodeVersion)"
                    $nodeAccion = "Actualizar a Node.js LTS (>= v18.18.0)"
                    $todoListo = $false
                }
            }
        } catch {}
    }

    if (-not $nodeOk) { $todoListo = $false }

    $items += [PSCustomObject]@{
        Componente = "Node.js Runtime"
        Estado     = if ($nodeOk) { "OK" } else { "FALTA" }
        Detalle    = $nodeDetalle
        Accion     = $nodeAccion
        Critico    = $true
        Url        = "https://nodejs.org/es/download"
    }

    # -------------------------------------------------------------------------
    # 2. Verificación de NPM
    # -------------------------------------------------------------------------
    $npmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    $npmOk = $false
    $npmDetalle = "No disponible en PATH"
    $npmAccion = "Se incluye junto con el instalador de Node.js"

    if ($npmCmd) {
        try {
            $npmVer = (& npm -v 2>$null).Trim()
            if (![string]::IsNullOrWhiteSpace($npmVer)) {
                $npmOk = $true
                $npmDetalle = "Instalado (v$npmVer)"
                $npmAccion = "Ninguna"
            }
        } catch {}
    }

    if (-not $npmOk) { $todoListo = $false }

    $items += [PSCustomObject]@{
        Componente = "NPM Package Manager"
        Estado     = if ($npmOk) { "OK" } else { "FALTA" }
        Detalle    = $npmDetalle
        Accion     = $npmAccion
        Critico    = $true
        Url        = "https://nodejs.org/es/download"
    }

    # -------------------------------------------------------------------------
    # 3. Verificación de PostgreSQL (Servicio y Binario psql)
    # -------------------------------------------------------------------------
    $psqlCmd = Get-Command "psql" -ErrorAction SilentlyContinue
    $pgPath = $null

    # Si no está en el PATH, buscar en rutas estándar de Windows
    if (-not $psqlCmd) {
        $candidatos = @(
            Get-Item "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
            Get-Item "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
        ) | Sort-Object FullName -Descending

        if ($candidatos.Count -gt 0) {
            $pgPath = $candidatos[0].FullName
        }
    } else {
        $pgPath = $psqlCmd.Source
    }

    # Comprobar servicio de Windows
    $pgServices = Get-Service -Name *postgres* -ErrorAction SilentlyContinue
    $pgServiceRunning = $false
    $pgServiceName = "No detectado"

    if ($pgServices) {
        $running = $pgServices | Where-Object { $_.Status -eq "Running" }
        if ($running) {
            $pgServiceRunning = $true
            $pgServiceName = ($running[0].DisplayName) + " (En ejecucion)"
        } else {
            $pgServiceName = ($pgServices[0].DisplayName) + " (Detenido)"
        }
    }

    # Comprobar si el puerto estándar 5432 o 5433 está respondiendo
    $pgPort5432 = Test-PortInUse -Puerto 5432
    $pgPort5433 = Test-PortInUse -Puerto 5433
    $pgPortActive = $pgPort5432 -or $pgPort5433

    $pgOk = $false
    $pgDetalle = ""
    $pgAccion = ""

    if ($pgPath -and ($pgServiceRunning -or $pgPortActive)) {
        $pgOk = $true
        $puertoTxt = if ($pgPort5433) { "5433" } else { "5432" }
        $pgDetalle = "Instalado y activo en puerto $puertoTxt"
        $pgAccion = "Ninguna (Listo para inicializar esquema)"
    } elseif ($pgPath -and (-not $pgServiceRunning -and -not $pgPortActive)) {
        $pgOk = $false
        $pgDetalle = "Instalado pero el servicio de Windows esta DETENIDO"
        $pgAccion = "Iniciar el servicio de Windows (services.msc) o ejecutar PostgreSQL"
        $todoListo = $false
    } else {
        $pgOk = $false
        $pgDetalle = "PostgreSQL no esta instalado en el equipo"
        $pgAccion = "Descargar e instalar PostgreSQL para Windows"
        $todoListo = $false
    }

    $items += [PSCustomObject]@{
        Componente = "PostgreSQL Database"
        Estado     = if ($pgOk) { "OK" } else { "FALTA" }
        Detalle    = $pgDetalle
        Accion     = $pgAccion
        Critico    = $true
        Url        = "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads"
    }

    # -------------------------------------------------------------------------
    # 4. Verificación de Git (Opcional pero muy útil para actualizaciones)
    # -------------------------------------------------------------------------
    $gitCmd = Get-Command "git" -ErrorAction SilentlyContinue
    $gitOk = [bool]$gitCmd
    $items += [PSCustomObject]@{
        Componente = "Git for Windows (Opcional)"
        Estado     = if ($gitOk) { "OK" } else { "SUGERIDO" }
        Detalle    = if ($gitOk) { "Instalado" } else { "No detectado (Opcional para sincronizacion)" }
        Accion     = if ($gitOk) { "Ninguna" } else { "Instalar opcionalmente desde git-scm.com" }
        Critico    = $false
        Url        = "https://git-scm.com/download/win"
    }

    # -------------------------------------------------------------------------
    # 5. Verificación de Puertos de Aplicación (3000 y 4000)
    # -------------------------------------------------------------------------
    $p3000 = Test-PortInUse -Puerto 3000
    $p4000 = Test-PortInUse -Puerto 4000

    if ($p3000 -or $p4000) {
        $puertosOcupados = @()
        if ($p3000) { $puertosOcupados += "3000 (Frontend)" }
        if ($p4000) { $puertosOcupados += "4000 (Backend)" }
        $items += [PSCustomObject]@{
            Componente = "Puertos Web (3000 / 4000)"
            Estado     = "AVISO"
            Detalle    = "En uso por otra app: " + ($puertosOcupados -join ", ")
            Accion     = "Asegurese de liberar estos puertos antes de iniciar el sistema"
            Critico    = $false
            Url        = ""
        }
    } else {
        $items += [PSCustomObject]@{
            Componente = "Puertos Web (3000 / 4000)"
            Estado     = "OK"
            Detalle    = "Puertos 3000 y 4000 disponibles"
            Accion     = "Listo"
            Critico    = $false
            Url        = ""
        }
    }

    $ResultadosAudit.Value = $items
    return $todoListo
}

function Show-AuditSummaryTable {
    param([array]$Items)

    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host "   ESTADO DE SERVICIOS Y PRERREQUISITOS DEL SISTEMA                        " -ForegroundColor White
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host ""

    foreach ($item in $Items) {
        $colorEstado = switch ($item.Estado) {
            "OK"       { "Green" }
            "FALTA"    { "Red" }
            "DETENIDO" { "Yellow" }
            "AVISO"    { "Yellow" }
            "SUGERIDO" { "Gray" }
            default    { "White" }
        }

        $tag = "[ " + $item.Estado.PadRight(8) + " ]"
        Write-Host " $tag " -ForegroundColor $colorEstado -NoNewline
        Write-Host ($item.Componente.PadRight(28)) -ForegroundColor White -NoNewline
        Write-Host " : " -ForegroundColor DarkGray -NoNewline
        Write-Host $item.Detalle -ForegroundColor Gray

        if ($item.Estado -ne "OK" -and $item.Accion -ne "") {
            Write-Host "            --> Accion recomendada: " -ForegroundColor DarkYellow -NoNewline
            Write-Host $item.Accion -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

function Invoke-PreflightWizard {
    while ($true) {
        Show-Header "Paso 1: Auditoria de Servicios y Dependencias Previas"

        $items = @()
        $esValido = Audit-SystemServices -ResultadosAudit ([ref]$items)

        Show-AuditSummaryTable -Items $items

        if ($esValido) {
            Write-Host "  ========================================================================" -ForegroundColor Green
            Write-Host "   TODOS LOS SERVICIOS Y REQUISITOS OBLIGATORIOS ESTAN CUBIERTOS [OK]     " -ForegroundColor White
            Write-Host "  ========================================================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "  Presione cualquier tecla para continuar con la seleccion de carpeta..." -ForegroundColor Cyan
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            return $true
        }

        # Si faltan servicios críticos, mostrar menú de ayuda y reintento
        Write-Host "  ------------------------------------------------------------------------" -ForegroundColor Red
        Write-Host "  ATENCION: Se detectaron servicios faltantes o detenidos indispensables." -ForegroundColor Red
        Write-Host "  Por favor, provea o inicie los componentes indicados antes de continuar." -ForegroundColor White
        Write-Host "  ------------------------------------------------------------------------" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Opciones disponibles:" -ForegroundColor Yellow
        Write-Host "   [R]  Volver a verificar requisitos (luego de instalar o iniciar servicios)" -ForegroundColor White
        Write-Host "   [1]  Abrir pagina oficial de descarga de Node.js (v20 o v22 LTS)" -ForegroundColor White
        Write-Host "   [2]  Abrir pagina oficial de descarga de PostgreSQL para Windows" -ForegroundColor White
        Write-Host "   [3]  Abrir panel de Servicios de Windows (services.msc) para iniciar PostgreSQL" -ForegroundColor White
        Write-Host "   [Q]  Cancelar y salir del instalador" -ForegroundColor White
        Write-Host ""
        Write-Host "  Seleccione una opcion [R, 1, 2, 3, Q]: " -NoNewline -ForegroundColor Cyan

        $opcion = (Read-Host).Trim().ToUpper()

        switch ($opcion) {
            "1" {
                Start-Process "https://nodejs.org/es/download"
                Write-Info "Abriendo navegador en el sitio de Node.js..."
                Start-Sleep -Seconds 2
            }
            "2" {
                Start-Process "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads"
                Write-Info "Abriendo navegador en el instalador de PostgreSQL..."
                Start-Sleep -Seconds 2
            }
            "3" {
                Start-Process "services.msc"
                Write-Info "Abriendo consola de Servicios de Windows..."
                Start-Sleep -Seconds 2
            }
            "Q" {
                Write-WarningMsg "Instalacion cancelada por el usuario."
                return $false
            }
            default {
                Write-Info "Re-evaluando estado del sistema..."
                Start-Sleep -Milliseconds 600
            }
        }
    }
}

function Invoke-SmokeTestHTTP {
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host "   SMOKE TEST & DIAGNOSTICO EN VIVO (HEALTH-CHECK)                         " -ForegroundColor White
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host ""

    # 1. Probar Backend /health
    Write-Host "  • Backend API (http://localhost:4000/health) : " -NoNewline -ForegroundColor White
    try {
        $backendResp = Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get -TimeoutSec 4 -ErrorAction Stop
        if ($backendResp.database.connected -eq $true) {
            Write-Host "[ HTTP 200 OK - DB CONECTADA ]" -ForegroundColor Green
            Write-Host "    -> Latencia DB: $($backendResp.database.latencyMs) ms | Memoria: $($backendResp.memoryUsageMb) MB | Uptime: $($backendResp.uptimeSeconds) seg" -ForegroundColor DarkGray
        } else {
            Write-Host "[ HTTP 200 OK - DB DEGRADADA ]" -ForegroundColor Yellow
        }
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status) {
            Write-Host "[ RESPONDE HTTP $status ]" -ForegroundColor Yellow
        } else {
            Write-Host "[ INACTIVO / NO RESPONDE ]" -ForegroundColor Red
        }
    }

    # 2. Probar Frontend /
    Write-Host "  • Frontend Web (http://localhost:3000/)       : " -NoNewline -ForegroundColor White
    try {
        $frontendResp = Invoke-WebRequest -Uri "http://localhost:3000/" -Method Get -TimeoutSec 6 -UseBasicParsing -ErrorAction Stop
        if ($frontendResp.StatusCode -ge 200 -and $frontendResp.StatusCode -lt 400) {
            Write-Host "[ HTTP $($frontendResp.StatusCode) OK - PORTAL DISPONIBLE ]" -ForegroundColor Green
        } else {
            Write-Host "[ RESPONDE HTTP $($frontendResp.StatusCode) ]" -ForegroundColor Yellow
        }
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status) {
            Write-Host "[ RESPONDE HTTP $status ]" -ForegroundColor Yellow
        } else {
            Write-Host "[ INACTIVO / NO RESPONDE ]" -ForegroundColor Red
        }
    }

    Write-Host ""
}

# Modulo verificar_servicios cargado



