[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (Test-Path "$scriptDir\utilidades.ps1") { . "$scriptDir\utilidades.ps1" }
if (Test-Path "$scriptDir\verificar_servicios.ps1") { . "$scriptDir\verificar_servicios.ps1" }

$items = @()
$ok = Audit-SystemServices -ResultadosAudit ([ref]$items)
Show-AuditSummaryTable -Items $items

if ($ok) {
    Write-Host "  TODOS LOS REQUISITOS OBLIGATORIOS ESTAN DISPONIBLES [OK]" -ForegroundColor Green
} else {
    Write-Host "  FALTAN COMPONENTES. REVISE LA LISTA ANTERIOR." -ForegroundColor Red
}
Write-Host ""
Invoke-SmokeTestHTTP
