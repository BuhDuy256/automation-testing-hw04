param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]{8,20}$')]
    [string]$RunId,

    [Parameter(Mandatory = $true)]
    [bool]$BackendRestartedBeforeRun,

    [Parameter(Mandatory = $true)]
    [bool]$GuiCaptureReady
)

# This runner is prepared for a later separately authorized official invocation.
# Do not invoke it during implementation validation.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$k6Path = Join-Path $PSScriptRoot 'calibration-tools\k6-v2.1.0-windows-amd64\k6.exe'
$sourceScript = Join-Path $repoRoot 'out\23127179_Spike_20260817.js'
$sourceCsv = Join-Path $repoRoot 'out\user_workflow_data.csv'
$captureScript = Join-Path $PSScriptRoot 'capture_official_spike_frames.ps1'
$resourcePane = Join-Path $PSScriptRoot 'spike_resource_monitor_pane.ps1'
$captureInstructions = Join-Path $PSScriptRoot 'official_spike_visual_capture_instructions.md'
$guiHandoff = Join-Path $PSScriptRoot 'official_spike_gui_handoff.md'
$reportRegistry = Join-Path $PSScriptRoot 'performance_testing_report_state.md'
$evidenceRoot = Join-Path $repoRoot 'out\23127179_Spike_20260817_evidence'
$runDirectory = Join-Path $evidenceRoot $RunId
$approvedScriptHash = 'CC01F02F8F06064E14D7C1241CE2C4908808BD2B3CDA2E7A597C538DFFD08AE6'
$approvedCsvHash = '1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1'
$approvedCaptureHash = '0076CA8DA90B5297DB38680539D6506AFA2D031F6F04755C14CBDA9B09778F43'
$approvedResourcePaneHash = '6066C45AFEF2DC659C11DFD08BB9D54E3B2E8A5E16408F417259A38A34A87213'
$approvedCaptureInstructionsHash = 'BC8E2ADC8B3BB80B0411D7FD62562C4407C156178D6CB8CF469E823874A0A287'
$approvedGuiHandoffHash = '45B4E59D901BA48C19940B354BAF3A42D5E0353849F19F3E0F2F1DD0BDE7E9FA'

if ((git -C $repoRoot branch --show-current).Trim() -ne 'hw05-performance') {
    throw 'Official Spike must run from branch hw05-performance'
}
foreach ($requiredPath in @($k6Path, $sourceScript, $sourceCsv, $captureScript, $resourcePane, $captureInstructions, $guiHandoff)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) { throw "Required file not found: $requiredPath" }
}
if (-not $BackendRestartedBeforeRun) {
    throw 'Official Spike requires a documented backend restart and SQLite reseed immediately before traffic'
}
if (-not $GuiCaptureReady) {
    throw 'Official Spike requires the rolling capture workflow and GUI layout to be ready before traffic'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $sourceScript).Hash -ne $approvedScriptHash) {
    throw 'Official Spike script hash differs from the human-reviewed implementation'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $sourceCsv).Hash -ne $approvedCsvHash) {
    throw 'Packaged CSV hash differs from the approved CSV'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $captureScript).Hash -ne $approvedCaptureHash) {
    throw 'Spike rolling capture helper hash differs from the reviewed preparation'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $resourcePane).Hash -ne $approvedResourcePaneHash) {
    throw 'Spike resource pane hash differs from the reviewed preparation'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $captureInstructions).Hash -ne $approvedCaptureInstructionsHash) {
    throw 'Spike visual capture instructions hash differs from the reviewed preparation'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $guiHandoff).Hash -ne $approvedGuiHandoffHash) {
    throw 'Spike GUI handoff hash differs from the reviewed preparation'
}
$registryText = Get-Content -LiteralPath $reportRegistry -Raw
if ($registryText -notmatch 'Spike\s*\|\s*Native k6 CSV metrics output\s*\|\s*ASSIGNED / USED-FOR-DESIGN') {
    throw 'Report registry does not contain the human-reviewed Spike CSV assignment'
}

$listener = netstat -ano -p tcp |
    Select-String -Pattern '^\s*TCP\s+\S+:3000\s+\S+\s+LISTENING\s+(\d+)\s*$' |
    Select-Object -First 1
if (-not $listener) { throw 'No backend process is listening on TCP port 3000' }
$backendProcessId = [int]$listener.Matches[0].Groups[1].Value
$backendProcess = Get-Process -Id $backendProcessId
$apiResponse = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/categories' -TimeoutSec 5
if ($apiResponse.StatusCode -ne 200) {
    throw "Backend reachability check returned HTTP $($apiResponse.StatusCode)"
}

New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
if (Test-Path -LiteralPath $runDirectory) {
    $runtimeMarkers = @('raw-results.ndjson', 'summary.json', 'metadata.json', 'spike-metrics.csv') |
        ForEach-Object { Join-Path $runDirectory $_ } |
        Where-Object { Test-Path -LiteralPath $_ }
    if ($runtimeMarkers.Count -gt 0) {
        throw "Evidence directory already contains execution artifacts: $runDirectory"
    }
} else {
    New-Item -ItemType Directory -Path $runDirectory | Out-Null
}

$evidenceScript = Join-Path $runDirectory '23127179_Spike_20260817.js'
$evidenceCsv = Join-Path $runDirectory 'user_workflow_data.csv'
Copy-Item -LiteralPath $sourceScript -Destination $evidenceScript
Copy-Item -LiteralPath $sourceCsv -Destination $evidenceCsv
Copy-Item -LiteralPath $captureScript -Destination (Join-Path $runDirectory 'capture_official_spike_frames.ps1')
Copy-Item -LiteralPath $resourcePane -Destination (Join-Path $runDirectory 'spike_resource_monitor_pane.ps1')
Copy-Item -LiteralPath $captureInstructions -Destination (Join-Path $runDirectory 'visual_capture_instructions.md')
Copy-Item -LiteralPath $guiHandoff -Destination (Join-Path $runDirectory 'gui-capture-handoff.md')
New-Item -ItemType Directory -Force -Path (Join-Path $runDirectory 'screenshots') | Out-Null

$hardwarePath = Join-Path $repoRoot 'work\calibration-results\hardware_observation.json'
if (Test-Path -LiteralPath $hardwarePath) {
    Copy-Item -LiteralPath $hardwarePath -Destination (Join-Path $runDirectory 'hardware_observation.json')
}

$rawPath = Join-Path $runDirectory 'raw-results.ndjson'
$summaryPath = Join-Path $runDirectory 'summary.json'
$spikeCsvPath = Join-Path $runDirectory 'spike-metrics.csv'
$stdoutPath = Join-Path $runDirectory 'stdout.log'
$stderrPath = Join-Path $runDirectory 'stderr.log'
$baseUrl = 'http://localhost:3000'
$arguments = @(
    'run',
    '--no-color',
    '-e', "BASE_URL=$baseUrl",
    '-e', "K6_RUN_ID=$RunId",
    '--summary-export', $summaryPath,
    '--out', "json=$rawPath",
    '--out', "csv=$spikeCsvPath",
    $evidenceScript
)
$quotedArguments = $arguments | ForEach-Object {
    if ($_ -match '\s') { '"' + $_ + '"' } else { $_ }
}
$exactCommand = '& "' + $k6Path + '" ' + ($quotedArguments -join ' ')
$exactCommand | Set-Content -LiteralPath (Join-Path $runDirectory 'command.txt') -Encoding utf8

$startedAt = (Get-Date).ToUniversalTime()
$commitHash = (git -C $repoRoot rev-parse HEAD).Trim()
$scriptHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $evidenceScript).Hash
$csvHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $evidenceCsv).Hash
$captureHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $captureScript).Hash
$resourcePaneHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $resourcePane).Hash
$captureInstructionsHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $captureInstructions).Hash
$guiHandoffHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $guiHandoff).Hash
$k6Version = (& $k6Path version | Out-String).Trim()
@(
    "$scriptHash  23127179_Spike_20260817.js"
    "$csvHash  user_workflow_data.csv"
    "$captureHash  capture_official_spike_frames.ps1"
    "$resourcePaneHash  spike_resource_monitor_pane.ps1"
    "$captureInstructionsHash  visual_capture_instructions.md"
    "$guiHandoffHash  gui-capture-handoff.md"
) | Set-Content -LiteralPath (Join-Path $runDirectory 'hashes.sha256') -Encoding utf8

$preRunMetadata = [ordered]@{
    test_name = '23127179_Spike_20260817'
    official_run = $true
    run_id = $RunId
    commit_hash = $commitHash
    k6_version = $k6Version
    base_url = $baseUrl
    command = $exactCommand
    started_at_utc = $startedAt.ToString('o')
    backend_pid = $backendProcessId
    backend_process_started_at_local = $backendProcess.StartTime.ToString('o')
    backend_restarted_before_run = $BackendRestartedBeforeRun
    database_reseeded_before_run = $BackendRestartedBeforeRun
    gui_capture_ready = $GuiCaptureReady
    script_sha256 = $scriptHash
    csv_sha256 = $csvHash
    capture_script_sha256 = $captureHash
    resource_pane_sha256 = $resourcePaneHash
    visual_capture_instructions_sha256 = $captureInstructionsHash
    gui_handoff_sha256 = $guiHandoffHash
    raw_output_format = 'k6 newline-delimited JSON with step, spike_phase, and target_vus tags'
    designated_report_type = 'Native k6 CSV metrics output'
    designated_report_path = $spikeCsvPath
    actual_vu_source = 'Native k6 vus metric; live marker only parses k6 progress when available'
    nominal_schedule_seconds = 227
    visual_evidence_status = 'Not captured; rolling helper and GUI layout are declared ready.'
}
$preRunMetadata | ConvertTo-Json -Depth 5 |
    Set-Content -LiteralPath (Join-Path $runDirectory 'metadata-pre-run.json') -Encoding utf8

Write-Output "OFFICIAL SPIKE K6_RUN_ID=$RunId"
Write-Output "OFFICIAL COMMAND=$exactCommand"
Write-Output "NATIVE K6 CSV REPORT=$spikeCsvPath"
$k6Process = Start-Process -FilePath $k6Path -ArgumentList $arguments -WorkingDirectory $runDirectory `
    -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -WindowStyle Hidden -PassThru
$null = $k6Process.Handle

$logicalProcessors = [Environment]::ProcessorCount
$processSamples = [System.Collections.Generic.List[object]]::new()
$systemSamples = [System.Collections.Generic.List[object]]::new()
$previousCpu = @{}

function Get-SpikeStage {
    param([double]$ElapsedSeconds)
    if ($ElapsedSeconds -lt 20) { return [pscustomobject]@{ Name = 'warmup_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 60) { return [pscustomobject]@{ Name = 'pre_spike_steady_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 61) { return [pscustomobject]@{ Name = 'spike_transition_4_to_32'; TargetVUs = 32 } }
    if ($ElapsedSeconds -lt 106) { return [pscustomobject]@{ Name = 'spike_peak_32'; TargetVUs = 32 } }
    if ($ElapsedSeconds -lt 107) { return [pscustomobject]@{ Name = 'recovery_transition_32_to_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 137) { return [pscustomobject]@{ Name = 'recovery_settling_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 197) { return [pscustomobject]@{ Name = 'recovery_steady_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 227) { return [pscustomobject]@{ Name = 'final_rampdown_4_to_0'; TargetVUs = 0 } }
    return [pscustomobject]@{ Name = 'graceful_completion'; TargetVUs = 0 }
}

function Get-LiveActualVUs {
    $progressLine = Get-Content -LiteralPath $stdoutPath -Tail 40 -ErrorAction SilentlyContinue |
        Where-Object { $_ -match '(?<active>\d+)/(?<maximum>\d+)\s+VUs' } |
        Select-Object -Last 1
    if ($progressLine -and $progressLine -match '(?<active>\d+)/(?<maximum>\d+)\s+VUs') {
        return [int]$Matches.active
    }
    return $null
}

function Add-ProcessSample {
    param(
        [System.Diagnostics.Process]$Process,
        [string]$Role,
        [datetime]$Timestamp,
        [pscustomobject]$Stage,
        [Nullable[int]]$ActualVUs
    )
    $processId = $Process.Id
    try {
        $Process.Refresh()
        $cpuSeconds = $Process.TotalProcessorTime.TotalSeconds
        $key = "$Role-$processId"
        $cpuPercent = $null
        if ($previousCpu.ContainsKey($key)) {
            $elapsed = ($Timestamp - $previousCpu[$key].Timestamp).TotalSeconds
            if ($elapsed -gt 0) {
                $cpuPercent = 100 * ($cpuSeconds - $previousCpu[$key].CpuSeconds) / ($elapsed * $logicalProcessors)
            }
        }
        $previousCpu[$key] = @{ Timestamp = $Timestamp; CpuSeconds = $cpuSeconds }
        $processSamples.Add([pscustomobject]@{
            timestamp_utc = $Timestamp.ToString('o')
            spike_phase = $Stage.Name
            target_vus = $Stage.TargetVUs
            actual_vus_live = if ($null -eq $ActualVUs) { '' } else { $ActualVUs }
            actual_vus_live_source = if ($null -eq $ActualVUs) { 'unavailable' } else { 'k6_progress' }
            role = $Role
            pid = $processId
            process_available = $true
            cpu_percent_total_machine = if ($null -eq $cpuPercent) { '' } else { [math]::Round($cpuPercent, 3) }
            working_set_mb = [math]::Round($Process.WorkingSet64 / 1MB, 3)
            private_memory_mb = [math]::Round($Process.PrivateMemorySize64 / 1MB, 3)
            thread_count = $Process.Threads.Count
        })
    }
    catch {
        $processSamples.Add([pscustomobject]@{
            timestamp_utc = $Timestamp.ToString('o')
            spike_phase = $Stage.Name
            target_vus = $Stage.TargetVUs
            actual_vus_live = if ($null -eq $ActualVUs) { '' } else { $ActualVUs }
            actual_vus_live_source = if ($null -eq $ActualVUs) { 'unavailable' } else { 'k6_progress' }
            role = $Role
            pid = $processId
            process_available = $false
            cpu_percent_total_machine = ''
            working_set_mb = ''
            private_memory_mb = ''
            thread_count = ''
        })
    }
}

while (-not $k6Process.HasExited) {
    $timestamp = (Get-Date).ToUniversalTime()
    $elapsedSeconds = ($timestamp - $startedAt).TotalSeconds
    $stage = Get-SpikeStage -ElapsedSeconds $elapsedSeconds
    $actualVUs = Get-LiveActualVUs
    Add-ProcessSample -Process $backendProcess -Role 'backend' -Timestamp $timestamp -Stage $stage -ActualVUs $actualVUs
    Add-ProcessSample -Process $k6Process -Role 'k6' -Timestamp $timestamp -Stage $stage -ActualVUs $actualVUs

    try {
        $counterSet = Get-Counter '\Processor(_Total)\% Processor Time','\Memory\% Committed Bytes In Use','\PhysicalDisk(_Total)\Disk Bytes/sec','\Network Interface(*)\Bytes Total/sec' -MaxSamples 1
        $counterSamples = $counterSet.CounterSamples
        $cpu = ($counterSamples | Where-Object Path -Like '*\processor(_total)\% processor time' | Select-Object -First 1).CookedValue
        $memory = ($counterSamples | Where-Object Path -Like '*\memory\% committed bytes in use' | Select-Object -First 1).CookedValue
        $disk = ($counterSamples | Where-Object Path -Like '*\physicaldisk(_total)\disk bytes/sec' | Select-Object -First 1).CookedValue
        $network = ($counterSamples | Where-Object Path -Like '*\network interface(*)\bytes total/sec' | Measure-Object CookedValue -Sum).Sum
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $timestamp.ToString('o')
            spike_phase = $stage.Name
            target_vus = $stage.TargetVUs
            actual_vus_live = if ($null -eq $actualVUs) { '' } else { $actualVUs }
            actual_vus_live_source = if ($null -eq $actualVUs) { 'unavailable' } else { 'k6_progress' }
            cpu_percent = [math]::Round($cpu, 3)
            committed_memory_percent = [math]::Round($memory, 3)
            disk_bytes_per_second = [math]::Round($disk, 3)
            network_bytes_per_second = [math]::Round($network, 3)
        })
    }
    catch {
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $timestamp.ToString('o')
            spike_phase = $stage.Name
            target_vus = $stage.TargetVUs
            actual_vus_live = if ($null -eq $actualVUs) { '' } else { $actualVUs }
            actual_vus_live_source = if ($null -eq $actualVUs) { 'unavailable' } else { 'k6_progress' }
            cpu_percent = ''
            committed_memory_percent = ''
            disk_bytes_per_second = ''
            network_bytes_per_second = ''
        })
    }

    $actualText = if ($null -eq $actualVUs) { 'unavailable' } else { $actualVUs }
    Write-Output ("SPIKE_PHASE={0} TARGET_VUS={1} ACTUAL_VUS={2} RUN_ID={3} ELAPSED={4:N1}" -f `
        $stage.Name, $stage.TargetVUs, $actualText, $RunId, $elapsedSeconds)
    Start-Sleep -Milliseconds 250
}

$k6Process.WaitForExit()
$k6Process.Refresh()
$endedAt = (Get-Date).ToUniversalTime()
$exitCode = $k6Process.ExitCode
$backendAvailableAtEnd = try {
    $backendProcess.Refresh()
    -not $backendProcess.HasExited
} catch { $false }

$processSamples | Export-Csv -LiteralPath (Join-Path $runDirectory 'process-resource.csv') -NoTypeInformation -Encoding utf8
$systemSamples | Export-Csv -LiteralPath (Join-Path $runDirectory 'system-resource.csv') -NoTypeInformation -Encoding utf8

$finalMetadata = [ordered]@{
    test_name = '23127179_Spike_20260817'
    official_run = $true
    run_id = $RunId
    commit_hash = $commitHash
    k6_version = $k6Version
    command = $exactCommand
    started_at_utc = $startedAt.ToString('o')
    ended_at_utc = $endedAt.ToString('o')
    elapsed_seconds = [math]::Round(($endedAt - $startedAt).TotalSeconds, 3)
    k6_exit_code = $exitCode
    threshold_exit = ($exitCode -eq 99)
    backend_pid = $backendProcessId
    backend_process_available_at_end = $backendAvailableAtEnd
    k6_pid = $k6Process.Id
    backend_restarted_before_run = $BackendRestartedBeforeRun
    database_reseeded_before_run = $BackendRestartedBeforeRun
    script_sha256 = $scriptHash
    csv_sha256 = $csvHash
    raw_output_exists = Test-Path -LiteralPath $rawPath
    raw_output_bytes = if (Test-Path -LiteralPath $rawPath) { (Get-Item -LiteralPath $rawPath).Length } else { 0 }
    summary_exists = Test-Path -LiteralPath $summaryPath
    designated_report_type = 'Native k6 CSV metrics output'
    designated_report_exists = Test-Path -LiteralPath $spikeCsvPath
    designated_report_bytes = if (Test-Path -LiteralPath $spikeCsvPath) { (Get-Item -LiteralPath $spikeCsvPath).Length } else { 0 }
    actual_vu_authoritative_source = 'spike-metrics.csv metric_name=vus rows'
    process_resource_samples = $processSamples.Count
    system_resource_samples = $systemSamples.Count
    visual_evidence_status = 'Requires verification of real same-run rolling captures and screenshot manifest.'
}
$finalMetadata | ConvertTo-Json -Depth 5 |
    Set-Content -LiteralPath (Join-Path $runDirectory 'metadata.json') -Encoding utf8

$completionReport = @"
# Official Spike Execution Completion Record

- Run ID: ``$RunId``
- Started UTC: ``$($startedAt.ToString('o'))``
- Ended UTC: ``$($endedAt.ToString('o'))``
- Elapsed seconds: ``$([math]::Round(($endedAt - $startedAt).TotalSeconds, 3))``
- k6 exit code: ``$exitCode``
- Threshold exit: ``$($exitCode -eq 99)``
- Raw NDJSON exists: ``$(Test-Path -LiteralPath $rawPath)``
- Summary JSON exists: ``$(Test-Path -LiteralPath $summaryPath)``
- Native k6 CSV metrics output exists: ``$(Test-Path -LiteralPath $spikeCsvPath)``
- Process-resource samples: ``$($processSamples.Count)``
- System-resource samples: ``$($systemSamples.Count)``
- Screenshot verification: pending same-run capture and manifest review
- Result interpretation: not performed by this execution record

Bad performance and failed correctness thresholds remain evidence. This factual record does not automatically declare Spike failure, recovery success, or authorize a rerun.
"@
$completionReport | Set-Content -LiteralPath (Join-Path $runDirectory 'completion-report.md') -Encoding utf8
$finalMetadata | ConvertTo-Json -Depth 5
