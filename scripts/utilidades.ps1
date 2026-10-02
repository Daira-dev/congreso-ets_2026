<#
.SYNOPSIS
    Utilidades y funciones de soporte para el instalador de Congreso ETS 2026 en Windows.
.DESCRIPTION
    Provee formateo de consola, cajas de dialogo graficas, generacion de claves
    criptograficas AES-256, deteccion de puertos y creacion de accesos directos .lnk.
#>

# Forzar codificación UTF-8 en salida de consola de PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Show-Header {
    param([string]$Subtitulo = "")
    Clear-Host
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    Write-Host "   SISTEMA DE GESTION INTEGRAL - CONGRESO ETS 2026 (DETS - GCABA)         " -ForegroundColor White
    Write-Host "   Instalador Automatizado para Windows 10 y Windows 11 (64-bit)          " -ForegroundColor DarkGray
    Write-Host " ==========================================================================" -ForegroundColor Cyan
    if ($Subtitulo -ne "") {
        Write-Host "  >> $Subtitulo" -ForegroundColor Yellow
        Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkGray
    }
    Write-Host ""
}

function Write-Success {
    param([string]$Mensaje)
    Write-Host "  [OK] " -ForegroundColor Green -NoNewline
    Write-Host $Mensaje -ForegroundColor White
}

function Write-Info {
    param([string]$Mensaje)
    Write-Host "  [i]  " -ForegroundColor Cyan -NoNewline
    Write-Host $Mensaje -ForegroundColor Gray
}

function Write-WarningMsg {
    param([string]$Mensaje)
    Write-Host "  [!]  " -ForegroundColor Yellow -NoNewline
    Write-Host $Mensaje -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Mensaje)
    Write-Host "  [X]  " -ForegroundColor Red -NoNewline
    Write-Host $Mensaje -ForegroundColor Red
}

function Write-Step {
    param([int]$Numero, [int]$Total, [string]$Titulo)
    Write-Host ""
    Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "  PASO $Numero de ${Total}: $Titulo" -ForegroundColor Cyan
    Write-Host " --------------------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host ""
}

function Show-FolderPicker {
    param(
        [string]$Descripcion = "Seleccione la carpeta donde desea instalar el Sistema Congreso ETS 2026",
        [string]$CarpetaPorDefecto = "C:\CongresoETS2026"
    )

    try {
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = $Descripcion
        $dialog.ShowNewFolderButton = $true
        $dialog.SelectedPath = $CarpetaPorDefecto

        # Mostrar diálogo modal en primer plano
        $form = New-Object System.Windows.Forms.Form
        $form.TopMost = $true

        $result = $dialog.ShowDialog($form)
        if ($result -eq [System.Windows.Forms.DialogResult]::OK -and !([string]::IsNullOrWhiteSpace($dialog.SelectedPath))) {
            return $dialog.SelectedPath
        }
    }
    catch {
        Write-Info "No se pudo abrir el selector visual de carpetas. Pasando a modo consola..."
    }

    # Fallback por consola
    Write-Host "  Ingrese la ruta de instalacion completa [Por defecto: $CarpetaPorDefecto]: " -NoNewline -ForegroundColor Yellow
    $entrada = Read-Host
    if ([string]::IsNullOrWhiteSpace($entrada)) {
        return $CarpetaPorDefecto
    }
    return $entrada.Trim()
}

function Test-PortInUse {
    param([int]$Puerto)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", $Puerto, $null, $null)
        $success = $iar.AsyncWaitHandle.WaitOne(400, $false)
        if ($success -and $client.Connected) {
            $client.EndConnect($iar)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    }
    catch {
        return $false
    }
}

function New-CryptoKeyHex {
    # Genera una clave criptográfica de 32 bytes (64 caracteres hex) para cifrado AES-256 de QRs
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $hex = -join ($bytes | ForEach-Object { "{0:x2}" -f $_ })
    return $hex
}

function New-WindowsShortcut {
    param(
        [string]$ShortcutPath,
        [string]$TargetPath,
        [string]$Arguments = "",
        [string]$WorkingDirectory = "",
        [string]$Description = "",
        [string]$IconLocation = ""
    )

    try {
        $wshShell = New-Object -ComObject WScript.Shell
        $shortcut = $wshShell.CreateShortcut($ShortcutPath)
        $shortcut.TargetPath = $TargetPath
        if ($Arguments) { $shortcut.Arguments = $Arguments }
        if ($WorkingDirectory) { $shortcut.WorkingDirectory = $WorkingDirectory }
        if ($Description) { $shortcut.Description = $Description }
        if ($IconLocation) { $shortcut.IconLocation = $IconLocation }
        $shortcut.Save()
        return $true
    }
    catch {
        Write-WarningMsg "No se pudo crear el acceso directo en: $ShortcutPath"
        return $false
    }
}

# Modulo utilidades cargado


