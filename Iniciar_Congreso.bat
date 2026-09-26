@echo off
setlocal EnableDelayedExpansion
title Congreso ETS 2026 - Control de Servicios

cd /d "%~dp0"

echo ========================================================================
echo   INICIANDO SISTEMA CONGRESO ETS 2026 - DETS GCABA
echo ========================================================================
echo.

:: 1. Verificar si ya esta en ejecucion
powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 3000); $c.Close(); exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo  [AVISO] El sistema ya parece estar en ejecucion en el puerto 3000.
    echo  Abriendo el navegador web...
    start http://localhost:3000
    timeout /t 3 >nul
    exit /b 0
)

:: 2. Iniciar Backend (Puerto 4000)
echo  [1/2] Iniciando Servidor Backend API (Puerto 4000)...
start "Congreso ETS 2026 - Backend API" /min cmd /c "cd /d ""%~dp0backend"" && npm start"

:: Esperar 3 segundos para inicialización de la API
timeout /t 3 /nobreak >nul

:: 3. Iniciar Frontend (Puerto 3000)
echo  [2/2] Iniciando Interfaz Frontend Web (Puerto 3000)...
start "Congreso ETS 2026 - Frontend Web" /min cmd /c "cd /d ""%~dp0frontend"" && npm start"

echo.
echo  Esperando disponibilidad de la plataforma...
powershell -NoProfile -Command "$intentos = 0; while ($intentos -lt 30) { try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 3000); $c.Close(); exit 0 } catch { Start-Sleep -Seconds 1; $intentos++ } }; exit 1"

if %errorlevel% equ 0 (
    echo.
    echo  ========================================================================
    echo    SISTEMA INICIADO EXITOSAMENTE
    echo    URL: http://localhost:3000
    echo  ========================================================================
    echo.
    start http://localhost:3000
) else (
    echo.
    echo  [AVISO] Los servicios estan iniciando. Abriendo navegador...
    start http://localhost:3000
)

echo  Para detener el sistema, ejecute el script 'Detener_Congreso.bat'
echo  o cierre las ventanas minimizadas.
echo.
timeout /t 5 >nul
