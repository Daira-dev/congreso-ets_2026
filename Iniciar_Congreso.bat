@echo off
setlocal EnableDelayedExpansion
title Congreso ETS 2026 - Control de Servicios

cd /d "%~dp0"

echo ========================================================================
echo   INICIANDO SISTEMA CONGRESO ETS 2026 - DETS GCABA
echo ========================================================================
echo.

:: 1. Verificar si ya esta en ejecucion en el puerto 3000
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 3000); $c.Close(); exit 0 } catch { exit 1 }"
if !errorlevel! equ 0 (
    echo  [AVISO] El sistema ya esta en ejecucion en el puerto 3000.
    echo  Abriendo el portal web...
    start http://localhost:3000
    powershell.exe -NoProfile -Command "Start-Sleep -Seconds 2"
    exit /b 0
)

:: 2. Determinar comando para Backend y Frontend (produccion si existe compilacion, o dev)
set "BACKEND_CMD=npm.cmd start"
if not exist "%~dp0backend\dist\server.js" (
    echo  [i] Compilacion de produccion de Backend no detectada. Iniciando en modo desarrollo...
    set "BACKEND_CMD=npm.cmd run dev"
)

set "FRONTEND_CMD=npm.cmd start"
if not exist "%~dp0frontend\.next" (
    echo  [i] Compilacion de produccion de Frontend no detectada. Iniciando en modo desarrollo...
    set "FRONTEND_CMD=npm.cmd run dev"
)

:: 3. Iniciar Servidor Backend API (Puerto 4000)
echo  [1/2] Iniciando Servidor Backend API (Puerto 4000)...
start "Congreso ETS 2026 - Backend API" /min cmd /c "cd /d ""%~dp0backend"" && !BACKEND_CMD!"

:: Breve espera para que la API inicie y conecte con PostgreSQL
powershell.exe -NoProfile -Command "Start-Sleep -Seconds 3"

:: 4. Iniciar Servidor Frontend Web (Puerto 3000)
echo  [2/2] Iniciando Interfaz Frontend Web (Puerto 3000)...
start "Congreso ETS 2026 - Frontend Web" /min cmd /c "cd /d ""%~dp0frontend"" && !FRONTEND_CMD!"

echo.
echo  Esperando disponibilidad de la plataforma en http://localhost:3000...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$intentos = 0; while ($intentos -lt 40) { try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 3000); $c.Close(); exit 0 } catch { Start-Sleep -Seconds 1; $intentos++ } }; exit 1"

if !errorlevel! equ 0 (
    echo.
    echo  ========================================================================
    echo    SISTEMA INICIADO EXITOSAMENTE
    echo    URL: http://localhost:3000
    echo  ========================================================================
    echo.
    start http://localhost:3000
) else (
    echo.
    echo  [AVISO] Los servicios estan tardando en iniciar. Intentando abrir navegador...
    start http://localhost:3000
)

echo  Para detener el sistema, ejecute el script 'Detener_Congreso.bat'
echo  o cierre las ventanas de consola minimizadas.
echo.
powershell.exe -NoProfile -Command "Start-Sleep -Seconds 3"