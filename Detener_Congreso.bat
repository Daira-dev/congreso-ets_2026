@echo off
setlocal EnableDelayedExpansion
title Congreso ETS 2026 - Detener Servicios
cd /d "%~dp0"

echo ========================================================================
echo   DETENIENDO SISTEMA CONGRESO ETS 2026 - DETS GCABA
echo ========================================================================
echo.

if exist "%~dp0scripts\detener_servicios.ps1" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\detener_servicios.ps1"
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$puertos = @(3000, 4000); foreach ($p in $puertos) { $conexiones = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conexiones) { $pids = $conexiones | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { if ($procId -gt 4) { try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue; Write-Host ('  [OK] Proceso ' + $procId + ' en puerto ' + $p + ' detenido.') -ForegroundColor Green } catch {} } } } }"
)

echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul