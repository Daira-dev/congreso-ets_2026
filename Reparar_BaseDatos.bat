@echo off
setlocal EnableDelayedExpansion
title Reparacion y Auditoria de Base de Datos - Congreso ETS 2026
cd /d "%~dp0"

echo ========================================================================
echo   HERRAMIENTA DE VERIFICACION Y REPARACION DE INTEGRIDAD REFERENCIAL
echo   Sistema de Gestion Integral - Congreso ETS 2026 (DETS - GCABA)
echo ========================================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\reparar_integridad.ps1"

echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul
