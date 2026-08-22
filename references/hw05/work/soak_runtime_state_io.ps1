# Atomic runtime-state publishing shared by the official Soak runner and its regression test.
# Keep this helper compatible with Windows PowerShell 5.1 and ASCII-only.

function Publish-SoakRuntimeState {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Json,
        [ValidateRange(1, 100)][int]$MaxAttempts = 20,
        [ValidateRange(1, 1000)][int]$RetryDelayMilliseconds = 25
    )

    try {
        $null = $Json | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
        throw "Runtime-state JSON is invalid and was not published: $($_.Exception.Message)"
    }

    $directory = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
        throw "Runtime-state directory does not exist: $directory"
    }

    $temporaryPath = Join-Path $directory ('.runtime-state-' + $PID + '-' + [guid]::NewGuid().ToString('N') + '.tmp')
    $backupPath = Join-Path $directory ('.runtime-state-' + $PID + '-' + [guid]::NewGuid().ToString('N') + '.bak')
    $utf8NoBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($temporaryPath, $Json, $utf8NoBom)

    try {
        for ($attempt = 1; $attempt -le $MaxAttempts; $attempt += 1) {
            try {
                if (Test-Path -LiteralPath $Path) {
                    [IO.File]::Replace($temporaryPath, $Path, $backupPath, $true)
                }
                else {
                    [IO.File]::Move($temporaryPath, $Path)
                }
                return
            }
            catch [IO.IOException] {
                if ($attempt -eq $MaxAttempts) { throw }
                Start-Sleep -Milliseconds $RetryDelayMilliseconds
            }
            catch [UnauthorizedAccessException] {
                if ($attempt -eq $MaxAttempts) { throw }
                Start-Sleep -Milliseconds $RetryDelayMilliseconds
            }
        }
    }
    finally {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath -Force -ErrorAction SilentlyContinue
        }
        if (Test-Path -LiteralPath $backupPath) {
            Remove-Item -LiteralPath $backupPath -Force -ErrorAction SilentlyContinue
        }
    }
}
