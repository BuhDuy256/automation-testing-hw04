param(
    [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9]{8,20}$')][string]$RunId,
    [Parameter(Mandatory = $true)][string]$RunDirectory,
    [Parameter(Mandatory = $true)][int]$BackendPid
)

# Compact live pane for future official Soak screenshots; it creates no measured artifact.

$Host.UI.RawUI.WindowTitle = "SOAK-RESOURCE-MONITOR $RunId"
$runtimeStatePath = Join-Path $RunDirectory 'runtime-state.json'

function Format-Process {
    param([string]$Label, [int]$ProcessId)
    if ($ProcessId -le 0) { return @("$Label PID unavailable") }
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        return @(
            "$Label $($process.ProcessName) PID=$ProcessId"
            ('WS={0:N1}MB PRIVATE={1:N1}MB THREADS={2}' -f `
                ($process.WorkingSet64 / 1MB), ($process.PrivateMemorySize64 / 1MB), $process.Threads.Count)
        )
    }
    catch {
        return @("$Label PID=$ProcessId unavailable")
    }
}

while ($true) {
    $state = $null
    if (Test-Path -LiteralPath $runtimeStatePath) {
        try { $state = Get-Content -LiteralPath $runtimeStatePath -Raw | ConvertFrom-Json } catch { $state = $null }
    }
    $k6Pid = if ($state -and $state.k6_pid) { [int]$state.k6_pid } else { -1 }
    $output = @(
        'OFFICIAL SOAK - RESOURCE PANE'
        "RUN_ID=$RunId"
        "WINDOW=$(if ($state) { $state.soak_window } else { 'waiting' })"
        "ELAPSED=$(if ($state) { $state.elapsed_seconds } else { 'n/a' })"
        "TARGET_VUS=$(if ($state) { $state.target_vus } else { 'n/a' })"
        "ACTUAL_VUS=$(if ($state) { $state.actual_vus } else { 'unavailable' })"
        "ACTUAL_SOURCE=$(if ($state) { $state.actual_vus_source } else { 'unavailable' })"
        "TRAFFIC_ACTIVE=$(if ($state) { $state.traffic_active } else { 'unknown' })"
        (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
        ''
    )
    $output += Format-Process -Label 'BACKEND' -ProcessId $BackendPid
    $output += ''
    $output += Format-Process -Label 'K6' -ProcessId $k6Pid

    [Console]::SetCursorPosition(0, 0)
    foreach ($line in $output) {
        Write-Host ($line.PadRight([Math]::Max(1, $Host.UI.RawUI.WindowSize.Width - 1)))
    }
    Start-Sleep -Seconds 1
}
