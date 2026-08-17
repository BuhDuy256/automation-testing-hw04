param(
    [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9]{8,20}$')][string]$RunId,
    [Parameter(Mandatory = $true)][string]$RunDirectory,
    [Parameter(Mandatory = $true)][int]$BackendPid,
    [bool]$IncludeRecoveryCapture = $true
)

# Real same-run desktop capture for a future authorized official Soak invocation.
# Captures anchor to the k6-created scenario-start marker, never runner preflight time.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$screenshotDirectory = Join-Path $RunDirectory 'screenshots'
$runtimeStatePath = Join-Path $RunDirectory 'runtime-state.json'
$deadline = (Get-Date).AddMinutes(5)
while (-not (Test-Path -LiteralPath $runtimeStatePath)) {
    if ((Get-Date) -gt $deadline) { throw 'Runner did not produce runtime-state.json within five minutes' }
    Start-Sleep -Milliseconds 500
}
New-Item -ItemType Directory -Force -Path $screenshotDirectory | Out-Null

function Read-RuntimeState {
    for ($attempt = 0; $attempt -lt 10; $attempt += 1) {
        try {
            return Get-Content -LiteralPath $runtimeStatePath -Raw | ConvertFrom-Json
        }
        catch {
            Start-Sleep -Milliseconds 100
        }
    }
    throw 'Could not read a complete runtime-state.json'
}

function Wait-ForScenarioStart {
    $waitDeadline = (Get-Date).AddMinutes(5)
    while ((Get-Date) -lt $waitDeadline) {
        $state = Read-RuntimeState
        if ($state.run_id -ne $RunId) { throw "Run ID mismatch in runtime state: $($state.run_id)" }
        if ($state.actual_k6_scenario_start_utc) {
            return [datetime]::Parse(
                $state.actual_k6_scenario_start_utc,
                $null,
                [System.Globalization.DateTimeStyles]::RoundtripKind
            ).ToUniversalTime()
        }
        Start-Sleep -Milliseconds 500
    }
    throw 'Actual k6 scenario-start marker was not observed'
}

function Get-ProcessSnapshot {
    param([int]$ProcessId, [string]$Role)
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        return [pscustomobject]@{
            role = $Role
            pid = $ProcessId
            process_name = $process.ProcessName
            available = $true
            working_set_mb = [math]::Round($process.WorkingSet64 / 1MB, 3)
            private_memory_mb = [math]::Round($process.PrivateMemorySize64 / 1MB, 3)
        }
    }
    catch {
        return [pscustomobject]@{ role = $Role; pid = $ProcessId; process_name = ''; available = $false }
    }
}

function Capture-Frame {
    param([string]$Name, [string]$Window, [Nullable[int]]$TargetElapsedSeconds)
    $capturedAt = (Get-Date).ToUniversalTime()
    $state = Read-RuntimeState
    $fileName = if ($null -eq $TargetElapsedSeconds) {
        "04_post_load_recovery_plus0060s.png"
    } else {
        '{0}_{1}_elapsed{2:D4}s.png' -f $Name, $Window, $TargetElapsedSeconds
    }
    $filePath = Join-Path $screenshotDirectory $fileName
    $virtualScreen = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $bitmap = New-Object System.Drawing.Bitmap $virtualScreen.Width, $virtualScreen.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($virtualScreen.Left, $virtualScreen.Top, 0, 0, $bitmap.Size)
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()

    $k6Pid = if ($state.k6_pid) { [int]$state.k6_pid } else { -1 }
    return [pscustomobject]@{
        file = $fileName
        soak_window = $Window
        target_elapsed_seconds = if ($null -eq $TargetElapsedSeconds) { '' } else { $TargetElapsedSeconds }
        actual_elapsed_seconds = $state.elapsed_seconds
        captured_at_utc = $capturedAt.ToString('o')
        run_id = $RunId
        target_vus = $state.target_vus
        actual_vus = $state.actual_vus
        actual_vus_source = $state.actual_vus_source
        traffic_active = $state.traffic_active
        file_bytes = (Get-Item -LiteralPath $filePath).Length
        backend = Get-ProcessSnapshot -ProcessId $BackendPid -Role 'backend'
        k6 = Get-ProcessSnapshot -ProcessId $k6Pid -Role 'k6'
    }
}

$scenarioStart = Wait-ForScenarioStart
$targets = @(
    [pscustomobject]@{ Sequence = '01'; Elapsed = 90; Window = 'early_steady' },
    [pscustomobject]@{ Sequence = '02'; Elapsed = 420; Window = 'middle_steady' },
    [pscustomobject]@{ Sequence = '03'; Elapsed = 720; Window = 'late_steady' }
)
$records = [System.Collections.Generic.List[object]]::new()
foreach ($target in $targets) {
    $fireAt = $scenarioStart.AddSeconds($target.Elapsed)
    while ((Get-Date).ToUniversalTime() -lt $fireAt) {
        Start-Sleep -Milliseconds 250
    }
    $records.Add((Capture-Frame -Name $target.Sequence -Window $target.Window -TargetElapsedSeconds $target.Elapsed))
}

if ($IncludeRecoveryCapture) {
    $trafficEnd = $null
    $recoveryDeadline = (Get-Date).AddMinutes(10)
    while (-not $trafficEnd -and (Get-Date) -lt $recoveryDeadline) {
        $state = Read-RuntimeState
        if ($state.confirmed_traffic_end_utc) {
            $trafficEnd = [datetime]::Parse(
                $state.confirmed_traffic_end_utc,
                $null,
                [System.Globalization.DateTimeStyles]::RoundtripKind
            ).ToUniversalTime()
        } else {
            Start-Sleep -Seconds 1
        }
    }
    if ($trafficEnd) {
        $fireAt = $trafficEnd.AddSeconds(60)
        while ((Get-Date).ToUniversalTime() -lt $fireAt) {
            Start-Sleep -Milliseconds 250
        }
        $records.Add((Capture-Frame -Name '04' -Window 'post_load_recovery' -TargetElapsedSeconds $null))
    }
}

[ordered]@{
    run_id = $RunId
    actual_k6_scenario_start_utc = $scenarioStart.ToString('o')
    capture_anchor = 'k6 SOAK_SCENARIO_START marker'
    capture_method = 'System.Drawing Graphics.CopyFromScreen over the full virtual screen'
    captures = $records
} | ConvertTo-Json -Depth 6 |
    Set-Content -LiteralPath (Join-Path $RunDirectory 'capture-log.json') -Encoding utf8

$manifest = @(
    '# Official Soak Screenshot Manifest'
    ''
    "- Run ID: ``$RunId``"
    '- Attribution anchor: actual k6 scenario-start marker'
    '- Frames are genuine same-run captures and were not reconstructed.'
    ''
    '| File | Window | Target elapsed | Actual elapsed | Traffic active | Bytes |'
    '|---|---|---:|---:|---|---:|'
)
foreach ($record in $records) {
    $manifest += "| $($record.file) | $($record.soak_window) | $($record.target_elapsed_seconds) | $($record.actual_elapsed_seconds) | $($record.traffic_active) | $($record.file_bytes) |"
}
$manifest | Set-Content -LiteralPath (Join-Path $RunDirectory 'screenshot-manifest.md') -Encoding utf8

Write-Output "CAPTURE_COMPLETE count=$($records.Count)"
