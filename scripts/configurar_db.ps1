<#
.SYNOPSIS
    Asistente de configuración e inicialización de PostgreSQL en Windows.
.DESCRIPTION
    Verifica la conexión con el servidor PostgreSQL local, crea la base de datos
    'congreso_ets2026' si no existe y ejecuta los scripts de esquema (3FN) y datos iniciales (seed).
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path "$scriptDir\utilidades.ps1") {
    . "$scriptDir\utilidades.ps1"
}

function Find-PsqlExecutable {
    $cmd = Get-Command "psql" -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $rutas = @(
        Get-Item "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
        Get-Item "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue
    ) | Sort-Object FullName -Descending

    if ($rutas.Count -gt 0) {
        return $rutas[0].FullName
    }
    return $null
}

function Invoke-DatabaseSetup {
    param(
        [string]$RutaDestino,
        [ref]$DbConfigResult
    )

    if ([string]::IsNullOrWhiteSpace($RutaDestino)) {
        $RutaDestino = Split-Path -Parent $scriptDir
    }

    Show-Header "Paso 4: Asistente de Base de Datos PostgreSQL"

    $psqlExe = Find-PsqlExecutable
    if (-not $psqlExe) {
        Write-ErrorMsg "No se pudo localizar el binario 'psql.exe' de PostgreSQL en el sistema."
        Write-WarningMsg "Por favor verifique que PostgreSQL este instalado e incluido en el PATH del sistema."
        return $false
    }

    Write-Info "Binario de PostgreSQL detectado: $psqlExe"

    # Detectar puerto estándar
    $puertoSugerido = 5432
    if (Test-PortInUse -Puerto 5433) {
        $puertoSugerido = 5433
    }

    Write-Host ""
    Write-Host " Ingrese los datos de conexion para PostgreSQL local:" -ForegroundColor Yellow
    Write-Host " (Presione Enter para aceptar los valores por defecto sugeridos entre corchetes)" -ForegroundColor Gray
    Write-Host ""

    Write-Host "  Host de PostgreSQL [$('localhost')]: " -NoNewline -ForegroundColor White
    $dbHost = Read-Host
    if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

    Write-Host "  Puerto [$puertoSugerido]: " -NoNewline -ForegroundColor White
    $dbPortStr = Read-Host
    $dbPort = if ([string]::IsNullOrWhiteSpace($dbPortStr)) { $puertoSugerido } else { [int]$dbPortStr }

    Write-Host "  Usuario Administrador [$('postgres')]: " -NoNewline -ForegroundColor White
    $dbUser = Read-Host
    if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

    Write-Host "  Contrasena de '$dbUser': " -NoNewline -ForegroundColor White
    $dbPass = Read-Host -AsSecureString
    $dbPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

    $dbName = "congreso_ets2026"

    # Probar conexión básica
    Write-Host ""
    Write-Info "Comprobando credenciales y conectividad con PostgreSQL..."

    $env:PGPASSWORD = $dbPassPlain
    $testResult = & $psqlExe -h $dbHost -p $dbPort -U $dbUser -d postgres -c "SELECT 1;" 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Fallo la conexion con PostgreSQL. Verifique host, puerto, usuario y contrasena."
        Write-Host "  Detalle de error: $testResult" -ForegroundColor Red
        return $false
    }

    Write-Success "Conexion establecida exitosamente con PostgreSQL en ${dbHost}:${dbPort}"

    # Verificar si la base de datos existe
    Write-Info "Verificando existencia de la base de datos '$dbName'..."
    $checkDb = & $psqlExe -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>&1

    if ($checkDb.Trim() -ne "1") {
        Write-Info "Creando base de datos '$dbName' con codificacion UTF-8..."
        $createDbRes = & $psqlExe -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName WITH ENCODING 'UTF8';" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Base de datos '$dbName' creada con exito."
        } else {
            Write-ErrorMsg "Error al crear la base de datos '$dbName': $createDbRes"
            return $false
        }
    } else {
        Write-Success "La base de datos '$dbName' ya existe en el servidor."
    }

    # Ubicar los archivos SQL en el destino
    $schemaFile = "$RutaDestino\backend\database\schema_3fn.sql"
    $seedFile = "$RutaDestino\backend\database\seed.sql"

    if (Test-Path $schemaFile) {
        Write-Info "Aplicando esquema de tablas y restricciones (schema_3fn.sql)..."
        $schemaRes = & $psqlExe -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $schemaFile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Esquema relacional de base de datos aplicado correctamente."
        } else {
            Write-WarningMsg "Se registraron avisos al aplicar el esquema (posiblemente tablas ya existentes)."
        }
    } else {
        Write-WarningMsg "No se encontro el archivo de esquema en: $schemaFile"
    }

    if (Test-Path $seedFile) {
        Write-Info "Insertando datos base y configuraciones iniciales (seed.sql)..."
        $seedRes = & $psqlExe -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $seedFile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Datos base insertados correctamente."
        } else {
            Write-WarningMsg "Se registraron avisos al insertar datos base (posibles registros unicos existentes)."
        }
    }

    # Rutina de Integridad Referencial y Migración Idempotente
    $repairSql = "$RutaDestino\backend\database\reparar_integridad.sql"
    if (Test-Path $repairSql) {
        Write-Info "Verificando y sincronizando integridad referencial, aforos y columnas (reparar_integridad.sql)..."
        $repairRes = & $psqlExe -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $repairSql 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Integridad referencial y columnas auxiliares aseguradas con exito."
        } else {
            Write-WarningMsg "Avisos al aplicar rutina de reparacion de integridad: $repairRes"
        }
    }

    # Guardar configuración obtenida para generar el .env
    if ($DbConfigResult) {
        $DbConfigResult.Value = [PSCustomObject]@{
            Host     = $dbHost
            Port     = $dbPort
            User     = $dbUser
            Password = $dbPassPlain
            Database = $dbName
            Url      = "postgresql://${dbUser}:${dbPassPlain}@${dbHost}:${dbPort}/${dbName}"
        }
    }

    $env:PGPASSWORD = $null
    return $true
}

# Modulo configurar_db cargado



