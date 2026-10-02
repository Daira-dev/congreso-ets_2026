# Script de detención controlada de servicios Congreso ETS 2026
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "  Buscando y deteniendo procesos en puertos 3000 y 4000..." -ForegroundColor Cyan
$puertos = @(3000, 4000)
$detenidos = 0

foreach ($p in $puertos) {
    $conexiones = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conexiones) {
        $pids = $conexiones | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 4) {
                try {
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Host "  [OK] Proceso $procId en puerto $p detenido." -ForegroundColor Green
                    $detenidos++
                } catch {}
            }
        }
    }
}

if ($detenidos -eq 0) {
    Write-Host "  No se detectaron procesos activos en los puertos 3000 y 4000." -ForegroundColor Gray
} else {
    Write-Host "  Todos los servicios del Congreso ETS 2026 fueron detenidos correctamente." -ForegroundColor Green
}
