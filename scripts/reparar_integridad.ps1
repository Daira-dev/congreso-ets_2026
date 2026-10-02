<#
.SYNOPSIS
    Script de Verificación y Reparación de Integridad Referencial de Base de Datos.
.DESCRIPTION
    Audita la base de datos de PostgreSQL, agrega columnas y tablas faltantes de forma
    idempotente, repara referencias huérfanas, normaliza aforos y sincroniza secuencias
    autoincrementales sin alterar ni destruir datos existentes.
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
if (Test-Path "$scriptDir\utilidades.ps1") {
    . "$scriptDir\utilidades.ps1"
} else {
    function Write-Success($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
    function Write-Info($msg) { Write-Host "  [i]  $msg" -ForegroundColor Cyan }
    function Write-WarningMsg($msg) { Write-Host "  [!]  $msg" -ForegroundColor Yellow }
    function Write-ErrorMsg($msg) { Write-Host "  [X]  $msg" -ForegroundColor Red }
}

Write-Host " ==========================================================================" -ForegroundColor Cyan
Write-Host "   AUDITORIA Y REPARACION DE INTEGRIDAD REFERENCIAL DE BASE DE DATOS      " -ForegroundColor White
Write-Host "   Congreso ETS 2026 - DETS GCABA                                          " -ForegroundColor DarkGray
Write-Host " ==========================================================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = "$rootDir\backend"
$repairScriptTs = "$backendDir\scripts\reparar-integridad-db.ts"
$repairSql = "$backendDir\database\reparar_integridad.sql"

$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue

if ($nodeCmd -and (Test-Path $repairScriptTs)) {
    Write-Info "Ejecutando motor de diagnostico e integridad relacional con Node.js..."
    Push-Location $backendDir
    try {
        & cmd.exe /c "npx.cmd tsx scripts/reparar-integridad-db.ts"
        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0) {
            Write-Host ""
            Write-Success "Auditoria y reparacion relacional completada exitosamente."
        } else {
            Write-WarningMsg "El motor TypeScript registro advertencias o codigos de salida diferentes de cero."
        }
    } finally {
        Pop-Location
    }
} elseif (Test-Path $repairSql) {
    Write-Info "Ejecutando reparacion relacional directa mediante script SQL..."
    # Buscar psql
    $psqlCmd = Get-Command "psql" -ErrorAction SilentlyContinue
    if (-not $psqlCmd) {
        $rutas = @(
            Get-Item "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
            Get-Item "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
        ) | Sort-Object FullName -Descending
        if ($rutas.Count -gt 0) { $psqlExe = $rutas[0].FullName }
    } else {
        $psqlExe = $psqlCmd.Source
    }

    if ($psqlExe) {
        & $psqlExe -h localhost -p 5433 -U postgres -d congreso_ets2026 -f $repairSql
        Write-Success "Script relacional SQL ejecutado en PostgreSQL."
    } else {
        Write-ErrorMsg "No se encontro psql ni Node.js para ejecutar la reparacion."
    }
} else {
    Write-ErrorMsg "No se encontraron los componentes de reparacion en: $backendDir"
}
