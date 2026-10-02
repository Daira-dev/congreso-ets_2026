@echo off
setlocal EnableDelayedExpansion
title Diagnostico de Servicios - Congreso ETS 2026
cd /d "%~dp0"

echo ========================================================================
echo   DIAGNOSTICO DE SERVICIOS Y PRERREQUISITOS - CONGRESO ETS 2026
echo ========================================================================
echo.

if exist "%~dp0scripts\revisar_servicios.ps1" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\revisar_servicios.ps1"
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$scriptDir = '%~dp0scripts'; if (-not (Test-Path $scriptDir)) { $scriptDir = Join-Path (Split-Path -Parent '%~dp0') 'scripts' }; if (Test-Path ""$scriptDir\utilidades.ps1"") { . ""$scriptDir\utilidades.ps1"" }; if (Test-Path ""$scriptDir\verificar_servicios.ps1"") { . ""$scriptDir\verificar_servicios.ps1"" }; $items = @(); $ok = Audit-SystemServices -ResultadosAudit ([ref]$items); Show-AuditSummaryTable -Items $items; if ($ok) { Write-Host '  TODOS LOS REQUISITOS OBLIGATORIOS ESTAN DISPONIBLES [OK]' -ForegroundColor Green } else { Write-Host '  FALTAN COMPONENTES. REVISE LA LISTA ANTERIOR.' -ForegroundColor Red }; Write-Host ''; Invoke-SmokeTestHTTP"
)

echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul