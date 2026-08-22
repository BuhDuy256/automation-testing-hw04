param(
    [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9]{8,20}$')][string]$RunId,
    [Parameter(Mandatory = $true)][string]$RunDirectory,
    [Parameter(Mandatory = $true)][int]$BackendPid
)

# Real same-run desktop capture for the official Spike invocation.
# Rolling capture is anchored to metadata-pre-run.json and never reconstructs a frame.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$screenshotDirectory = Join-Path $RunDirectory 'screenshots'
New-Item -ItemType Directory -Force -Path $screenshotDirectory | Out-Null

$metadataPath = Join-Path $RunDirectory 'metadata-pre-run.json'
$deadline = (Get-Date).AddSeconds(180)
while (-not (Test-Path -LiteralPath $metadataPath)) {
    if ((Get-Date) -gt $deadline) { throw 'Runner did not produce metadata-pre-run.json within 180 seconds' }
    Start-Sleep -Milliseconds 250
}

$metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
if ($metadata.run_id -ne $RunId) {
    throw "Run ID mismatch: expected $RunId, metadata reports $($metadata.run_id)"
}
$startedAtUtc = [datetime]::Parse(
    $metadata.started_at_utc,
    $null,
    [System.Globalization.DateTimeStyles]::RoundtripKind
).ToUniversalTime()

function Get-SpikePhase {
    param([double]$ElapsedSeconds)
    if ($ElapsedSeconds -lt 20) { return 'warmup_4' }
    if ($ElapsedSeconds -lt 60) { return 'pre_spike_steady_4' }
    if ($ElapsedSeconds -lt 61) { return 'spike_transition_4_to_32' }
    if ($ElapsedSeconds -lt 106) { return 'spike_peak_32' }
    if ($ElapsedSeconds -lt 107) { return 'recovery_transition_32_to_4' }
    if ($ElapsedSeconds -lt 137) { return 'recovery_settling_4' }
    if ($ElapsedSeconds -lt 197) { return 'recovery_steady_4' }
    if ($ElapsedSeconds -lt 227) { return 'final_rampdown_4_to_0' }
    return 'graceful_completion'
}

$targetSeconds = [System.Collections.Generic.SortedSet[int]]::new()
$null = $targetSeconds.Add(45)
58..70 | ForEach-Object { $null = $targetSeconds.Add($_) }
$null = $targetSeconds.Add(85)
104..116 | ForEach-Object { $null = $targetSeconds.Add($_) }
$null = $targetSeconds.Add(122)
$null = $targetSeconds.Add(165)

function Get-ProcessSnapshot {
    param([int]$ProcessId, [string]$Role)
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        return [pscustomobject]@{
            role = $Role
            pid = $ProcessId
            process_name = $process.ProcessName
            available = $true
            total_processor_seconds = [math]::Round($process.TotalProcessorTime.TotalSeconds, 3)
            working_set_mb = [math]::Round($process.WorkingSet64 / 1MB, 3)
            private_memory_mb = [math]::Round($process.PrivateMemorySize64 / 1MB, 3)
        }
    }
    catch {
        return [pscustomobject]@{
            role = $Role
            pid = $ProcessId
            process_name = ''
            available = $false
            total_processor_seconds = ''
            working_set_mb = ''
            private_memory_mb = ''
        }
    }
}

$records = [System.Collections.Generic.List[object]]::new()
$sequence = 0
foreach ($elapsedTarget in $targetSeconds) {
    $fireAtUtc = $startedAtUtc.AddSeconds($elapsedTarget)
    while ((Get-Date).ToUniversalTime() -lt $fireAtUtc) {
        $remainingMs = ($fireAtUtc - (Get-Date).ToUniversalTime()).TotalMilliseconds
        if ($remainingMs -gt 500) { Start-Sleep -Milliseconds 200 } else { Start-Sleep -Milliseconds 20 }
    }

    $capturedAtUtc = (Get-Date).ToUniversalTime()
    $actualElapsed = [math]::Round(($capturedAtUtc - $startedAtUtc).TotalSeconds, 3)
    $phase = Get-SpikePhase -ElapsedSeconds $elapsedTarget
    $fileName = '{0:D2}_{1}_elapsed{2:D4}s.png' -f $sequence, $phase, $elapsedTarget
    $filePath = Join-Path $screenshotDirectory $fileName

    $virtualScreen = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $bitmap = New-Object System.Drawing.Bitmap $virtualScreen.Width, $virtualScreen.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($virtualScreen.Left, $virtualScreen.Top, 0, 0, $bitmap.Size)
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()

    $k6Process = Get-Process -Name 'k6' -ErrorAction SilentlyContinue | Select-Object -First 1
    $k6Pid = if ($k6Process) { $k6Process.Id } else { -1 }
    $records.Add([pscustomobject]@{
        sequence = $sequence
        file = $fileName
        spike_phase = $phase
        target_elapsed_seconds = $elapsedTarget
        actual_elapsed_seconds = $actualElapsed
        captured_at_utc = $capturedAtUtc.ToString('o')
        run_id = $RunId
        file_bytes = (Get-Item -LiteralPath $filePath).Length
        backend = Get-ProcessSnapshot -ProcessId $BackendPid -Role 'backend'
        k6 = Get-ProcessSnapshot -ProcessId $k6Pid -Role 'k6'
    })
    Write-Output ("CAPTURED {0} phase={1} target={2}s actual={3}s" -f `
        $fileName, $phase, $elapsedTarget, $actualElapsed)
    $sequence += 1
}

[ordered]@{
    run_id = $RunId
    run_directory = $RunDirectory
    runner_started_at_utc = $startedAtUtc.ToString('o')
    backend_pid = $BackendPid
    capture_method = 'System.Drawing Graphics.CopyFromScreen over the full virtual screen'
    capture_policy = 'fixed reference/peak/recovery frames plus one-second rolling frames around rise and drop'
    captures = $records
} | ConvertTo-Json -Depth 6 |
    Set-Content -LiteralPath (Join-Path $RunDirectory 'capture-log.json') -Encoding utf8

Write-Output "CAPTURE_COMPLETE count=$($records.Count)"
