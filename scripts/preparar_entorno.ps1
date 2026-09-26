$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CONGRESO ETS 2026 - CONFIGURACION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$schema = Join-Path $backend "database\schema_3fn_corregido.sql"
$seed = Join-Path $backend "database\seed.sql"

# Buscar PostgreSQL
$psql = (Get-Command psql.exe -ErrorAction SilentlyContinue).Source

if (-not $psql) {
    $candidatos = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending

    if ($candidatos) {
        $psql = $candidatos[0].FullName
    }
}

if (-not $psql) {
    Write-Host "No se encontró PostgreSQL." -ForegroundColor Red
    Read-Host "Presioná ENTER para cerrar"
    exit 1
}

Write-Host "PostgreSQL encontrado." -ForegroundColor Green

# Comprobar Node
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    Write-Host "No se encontró Node.js." -ForegroundColor Red
    Read-Host "Presioná ENTER para cerrar"
    exit 1
}

Write-Host "Node.js: $(node --version)" -ForegroundColor Green

# Comprobar archivos
if (-not (Test-Path $schema)) {
    Write-Host "No existe $schema" -ForegroundColor Red
    Read-Host "Presioná ENTER para cerrar"
    exit 1
}

if (-not (Test-Path $seed)) {
    Write-Host "No existe $seed" -ForegroundColor Red
    Read-Host "Presioná ENTER para cerrar"
    exit 1
}

# PostgreSQL debe estar en 5433
if (-not (Test-NetConnection localhost -Port 5433 -InformationLevel Quiet)) {
    Write-Host ""
    Write-Host "PostgreSQL no responde en localhost:5433." -ForegroundColor Red
    Write-Host "Este proyecto está configurado para usar el puerto 5433."
    Read-Host "Presioná ENTER para cerrar"
    exit 1
}

Write-Host "PostgreSQL responde en puerto 5433." -ForegroundColor Green

# Pedir contraseña de postgres
$postgresPassword = Read-Host "Contraseña del usuario postgres"
$env:PGPASSWORD = $postgresPassword

function Ejecutar-Psql {
    param(
        [string]$Usuario,
        [string]$Base,
        [string]$Sql
    )

    & $psql `
        -h localhost `
        -p 5433 `
        -U $Usuario `
        -d $Base `
        -v ON_ERROR_STOP=1 `
        -c $Sql

    if ($LASTEXITCODE -ne 0) {
        throw "Falló la operación SQL."
    }
}

Write-Host ""
Write-Host "Configurando usuario de aplicación..." -ForegroundColor Yellow

Ejecutar-Psql `
    -Usuario "postgres" `
    -Base "postgres" `
    -Sql "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'congreso_app') THEN CREATE ROLE congreso_app LOGIN PASSWORD 'V-129057-t'; ELSE ALTER ROLE congreso_app WITH LOGIN PASSWORD 'V-129057-t'; END IF; END `$`$;"

Write-Host "Usuario congreso_app listo." -ForegroundColor Green

# Comprobar si existe la base
$existe = (& $psql `
    -h localhost `
    -p 5433 `
    -U postgres `
    -d postgres `
    -tAc "SELECT 1 FROM pg_database WHERE datname = 'congreso_ets2026'").Trim()

if ($LASTEXITCODE -ne 0) {
    throw "No se pudo consultar la base de datos."
}

if ($existe -eq "1") {
    Write-Host ""
    Write-Host "La base congreso_ets2026 ya existe." -ForegroundColor Yellow
    $respuesta = Read-Host "¿Recrear la base desde cero? (S/N)"

    if ($respuesta -notmatch "^[Ss]$") {
        Write-Host "Configuración cancelada." -ForegroundColor Yellow
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        exit 0
    }

    Ejecutar-Psql `
        -Usuario "postgres" `
        -Base "postgres" `
        -Sql "DROP DATABASE congreso_ets2026 WITH (FORCE);"
}

Write-Host ""
Write-Host "Creando base congreso_ets2026..." -ForegroundColor Yellow

Ejecutar-Psql `
    -Usuario "postgres" `
    -Base "postgres" `
    -Sql "CREATE DATABASE congreso_ets2026 OWNER congreso_app;"

# Usar contraseña de congreso_app
$env:PGPASSWORD = "V-129057-t"

Write-Host ""
Write-Host "Cargando estructura de la base..." -ForegroundColor Yellow

& $psql `
    -h localhost `
    -p 5433 `
    -U congreso_app `
    -d congreso_ets2026 `
    -v ON_ERROR_STOP=1 `
    -f $schema

if ($LASTEXITCODE -ne 0) {
    throw "Falló la carga del schema."
}

Write-Host "Schema cargado." -ForegroundColor Green

Write-Host ""
Write-Host "Cargando datos iniciales..." -ForegroundColor Yellow

& $psql `
    -h localhost `
    -p 5433 `
    -U congreso_app `
    -d congreso_ets2026 `
    -v ON_ERROR_STOP=1 `
    -f $seed

if ($LASTEXITCODE -ne 0) {
    throw "Falló la carga del seed."
}

Write-Host "Datos iniciales cargados." -ForegroundColor Green

# Backend
Write-Host ""
Write-Host "Instalando backend..." -ForegroundColor Yellow

Push-Location $backend

if (Test-Path ".\package-lock.json") {
    npm ci
} else {
    npm install
}

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Falló npm del backend."
}

Write-Host "Compilando backend..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Falló la compilación del backend."
}

Pop-Location

# Frontend
Write-Host ""
Write-Host "Instalando frontend..." -ForegroundColor Yellow

Push-Location $frontend

if (Test-Path ".\package-lock.json") {
    npm ci
} else {
    npm install
}

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Falló npm del frontend."
}

Pop-Location

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "       CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Base:     congreso_ets2026"
Write-Host "Postgres: localhost:5433"
Write-Host "Backend:  http://localhost:4000"
Write-Host "Frontend: http://localhost:3000"
Write-Host ""
Read-Host "Presioná ENTER para cerrar"