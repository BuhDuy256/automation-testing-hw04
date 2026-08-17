param(
    [Parameter(Mandatory = $true)][string]$RunId,
    [Parameter(Mandatory = $true)][string]$RunDirectory,
    [Parameter(Mandatory = $true)][int]$BackendPid
)

# Real same-run desktop frame capture for the official Stress invocation.
# Timing is anchored to the runner's own started_at_utc so that captured elapsed
# values match the runner marker timeline exactly. No frame is synthesized.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$screenshotDirectory = Join-Path $RunDirectory 'screenshots'
New-Item -ItemType Directory -Force -Path $screenshotDirectory | Out-Null

$preRunMetadataPath = Join-Path $RunDirectory 'metadata-pre-run.json'
$deadline = (Get-Date).AddSeconds(180)
while (-not (Test-Path -LiteralPath $preRunMetadataPath)) {
    if ((Get-Date) -gt $deadline) { throw 'Runner did not produce metadata-pre-run.json within 180 seconds' }
    Start-Sleep -Milliseconds 500
}
Start-Sleep -Milliseconds 500
$preRunMetadata = Get-Content -LiteralPath $preRunMetadataPath -Raw | ConvertFrom-Json
if ($preRunMetadata.run_id -ne $RunId) {
    throw "Run ID mismatch: expected $RunId, metadata reports $($preRunMetadata.run_id)"
}
$startedAtUtc = [datetime]::Parse($preRunMetadata.started_at_utc, $null, [System.Globalization.DateTimeStyles]::RoundtripKind).ToUniversalTime()

$targets = @(
    [pscustomobject]@{ Index = '00'; Stage = 'context_run_start'; Elapsed = 12;   Required = $false }
    [pscustomobject]@{ Index = '01'; Stage = 'baseline_4';        Elapsed = 90;   Required = $true }
    [pscustomobject]@{ Index = '02'; Stage = 'anchor_8';          Elapsed = 240;  Required = $true }
    [pscustomobject]@{ Index = '03'; Stage = 'level_12';          Elapsed = 390;  Required = $true }
    [pscustomobject]@{ Index = '04'; Stage = 'level_16';          Elapsed = 540;  Required = $true }
    [pscustomobject]@{ Index = '05'; Stage = 'level_20';          Elapsed = 690;  Required = $true }
    [pscustomobject]@{ Index = '06'; Stage = 'maximum_24';        Elapsed = 840;  Required = $true }
    [pscustomobject]@{ Index = '07'; Stage = 'recovery_4';        Elapsed = 1020; Required = $true }
)

function Get-ProcessSnapshot {
    param([int]$ProcessId, [string]$Role)
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        $cpuBefore = $process.TotalProcessorTime.TotalSeconds
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        Start-Sleep -Milliseconds 1000
        $process.Refresh()
        $stopwatch.Stop()
        $cpuAfter = $process.TotalProcessorTime.TotalSeconds
        $cpuPercent = 100 * ($cpuAfter - $cpuBefore) / ($stopwatch.Elapsed.TotalSeconds * [Environment]::ProcessorCount)
        return [pscustomobject]@{
            role                      = $Role
            pid                       = $ProcessId
            process_name              = $process.ProcessName
            available                 = $true
            cpu_percent_total_machine = [math]::Round($cpuPercent, 3)
            working_set_mb            = [math]::Round($process.WorkingSet64 / 1MB, 3)
            private_memory_mb         = [math]::Round($process.PrivateMemorySize64 / 1MB, 3)
        }
    }
    catch {
        return [pscustomobject]@{
            role                      = $Role
            pid                       = $ProcessId
            process_name              = ''
            available                 = $false
            cpu_percent_total_machine = ''
            working_set_mb            = ''
            private_memory_mb         = ''
        }
    }
}

$captureRecords = [System.Collections.Generic.List[object]]::new()

foreach ($target in $targets) {
    $fireAtUtc = $startedAtUtc.AddSeconds($target.Elapsed)
    while ((Get-Date).ToUniversalTime() -lt $fireAtUtc) {
        $remaining = ($fireAtUtc - (Get-Date).ToUniversalTime()).TotalSeconds
        if ($remaining -gt 2) { Start-Sleep -Milliseconds 500 } else { Start-Sleep -Milliseconds 50 }
    }

    $captureUtc = (Get-Date).ToUniversalTime()
    $captureLocal = Get-Date
    $actualElapsed = [math]::Round(($captureUtc - $startedAtUtc).TotalSeconds, 3)
    $fileName = '{0}_{1}_elapsed{2:D4}s.png' -f $target.Index, $target.Stage, $target.Elapsed
    $filePath = Join-Path $screenshotDirectory $fileName

    $virtualScreen = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $bitmap = New-Object System.Drawing.Bitmap $virtualScreen.Width, $virtualScreen.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($virtualScreen.Left, $virtualScreen.Top, 0, 0, $bitmap.Size)
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()

    $k6Process = Get-Process -Name 'k6' -ErrorAction SilentlyContinue | Select-Object -First 1
    $k6Pid = -1
    if ($k6Process) { $k6Pid = $k6Process.Id }

    $backendSnapshot = Get-ProcessSnapshot -ProcessId $BackendPid -Role 'backend'
    $k6Snapshot = Get-ProcessSnapshot -ProcessId $k6Pid -Role 'k6'

    $captureRecords.Add([pscustomobject]@{
        index                  = $target.Index
        file                   = $fileName
        stage                  = $target.Stage
        required               = $target.Required
        target_elapsed_seconds = $target.Elapsed
        actual_elapsed_seconds = $actualElapsed
        captured_at_utc        = $captureUtc.ToString('o')
        captured_at_local      = $captureLocal.ToString('o')
        run_id                 = $RunId
        file_bytes             = (Get-Item -LiteralPath $filePath).Length
        backend                = $backendSnapshot
        k6                     = $k6Snapshot
    })

    Write-Output ("CAPTURED {0} stage={1} target={2}s actual={3}s bytes={4}" -f `
        $fileName, $target.Stage, $target.Elapsed, $actualElapsed, (Get-Item -LiteralPath $filePath).Length)
}

$captureLog = [ordered]@{
    run_id                  = $RunId
    run_directory           = $RunDirectory
    runner_started_at_utc   = $startedAtUtc.ToString('o')
    backend_pid             = $BackendPid
    screen_capture_method   = 'System.Drawing Graphics.CopyFromScreen over the full virtual screen'
    captures                = $captureRecords
}
$captureLog | ConvertTo-Json -Depth 6 |
    Set-Content -LiteralPath (Join-Path $RunDirectory 'capture-log.json') -Encoding utf8

Write-Output "CAPTURE_COMPLETE count=$($captureRecords.Count)"
