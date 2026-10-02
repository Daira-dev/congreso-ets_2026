@echo off
setlocal EnableDelayedExpansion
title Desinstalador del Sistema - Congreso ETS 2026

:: Posicionarse en la carpeta donde reside este script
cd /d "%~dp0"

echo.
echo  ========================================================================
echo    CONGRESO ETS 2026 - DETS GCABA
echo    Asistente de Desinstalacion para Microsoft Windows 10 y 11
echo  ========================================================================
echo.

:: 1. Comprobar privilegios (informativo)
net session >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Ejecutando con privilegios de Administrador.
) else (
    echo  [i]  Ejecutando con permisos de usuario local.
)
echo.

:: 2. Localizar script de desinstalacion de PowerShell
set "SCRIPT_PS1=%~dp0scripts\desinstalar.ps1"

if not exist "%SCRIPT_PS1%" (
    echo  [ERROR CRITICO] No se encontro el archivo de desinstalacion:
    echo          %~dp0scripts\desinstalar.ps1
    echo.
    pause
    exit /b 1
)

:: 3. Lanzar el asistente de PowerShell con politicas de ejecucion liberadas
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PS1%"

if %errorlevel% neq 0 (
    echo.
    echo  [AVISO] El proceso de desinstalacion finalizo con avisos o fue cancelado.
    echo.
)

echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul
