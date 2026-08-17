param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]{8,20}$')]
    [string]$RunId,

    [Parameter(Mandatory = $true)]
    [bool]$BackendRestartedBeforeRun
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$k6Path = Join-Path $PSScriptRoot 'calibration-tools\k6-v2.1.0-windows-amd64\k6.exe'
$sourceScript = Join-Path $repoRoot 'out\23127179_Stress_20260817.js'
$sourceReportHelper = Join-Path $repoRoot 'out\stress_stage_report.js'
$sourceCsv = Join-Path $repoRoot 'out\user_workflow_data.csv'
$evidenceRoot = Join-Path $repoRoot 'out\23127179_Stress_20260817_evidence'
$runDirectory = Join-Path $evidenceRoot $RunId
$approvedScriptHash = '822F0D7A37A620E37CB8DCA9F8C99CCD1C20118335E8A8FC118C81D35E65C198'
$approvedReportHelperHash = '56542BED0A17AE8A87C31623D86248F52FAD833082F1FEFDD80ED9E0C2BFF865'
$approvedCsvHash = '1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1'

if (-not (Test-Path -LiteralPath $k6Path)) {
    throw "k6 binary not found: $k6Path"
}
if (-not $BackendRestartedBeforeRun) {
    throw 'Official Stress requires an explicitly documented backend restart and database reseed'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $sourceScript).Hash -ne $approvedScriptHash) {
    throw 'Official Stress script hash differs from the human-reviewed implementation'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $sourceReportHelper).Hash -ne $approvedReportHelperHash) {
    throw 'Stress Markdown report helper hash differs from the validated implementation'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $sourceCsv).Hash -ne $approvedCsvHash) {
    throw 'Packaged CSV hash differs from the approved CSV'
}

$listener = netstat -ano -p tcp |
    Select-String -Pattern '^\s*TCP\s+\S+:3000\s+\S+\s+LISTENING\s+(\d+)\s*$' |
    Select-Object -First 1
if (-not $listener) {
    throw 'No backend process is listening on TCP port 3000'
}
$backendPid = [int]$listener.Matches[0].Groups[1].Value
$backendProcess = Get-Process -Id $backendPid
$apiResponse = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/categories' -TimeoutSec 5
if ($apiResponse.StatusCode -ne 200) {
    throw "Backend reachability check returned HTTP $($apiResponse.StatusCode)"
}

New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
if (Test-Path -LiteralPath $runDirectory) {
    $runtimeMarkers = @('raw-results.ndjson', 'summary.json', 'metadata.json', 'stress-stage-summary.md') |
        ForEach-Object { Join-Path $runDirectory $_ } |
        Where-Object { Test-Path -LiteralPath $_ }
    if ($runtimeMarkers.Count -gt 0) {
        throw "Evidence directory already contains execution artifacts: $runDirectory"
    }
} else {
    New-Item -ItemType Directory -Path $runDirectory | Out-Null
}

$evidenceScript = Join-Path $runDirectory '23127179_Stress_20260817.js'
$evidenceReportHelper = Join-Path $runDirectory 'stress_stage_report.js'
$evidenceCsv = Join-Path $runDirectory 'user_workflow_data.csv'
$hardwarePath = Join-Path $repoRoot 'work\calibration-results\hardware_observation.json'
$captureInstructions = Join-Path $PSScriptRoot 'official_stress_visual_capture_instructions.md'
$guiHandoff = Join-Path $PSScriptRoot 'official_stress_gui_handoff.md'
Copy-Item -LiteralPath $sourceScript -Destination $evidenceScript
Copy-Item -LiteralPath $sourceReportHelper -Destination $evidenceReportHelper
Copy-Item -LiteralPath $sourceCsv -Destination $evidenceCsv
Copy-Item -LiteralPath $hardwarePath -Destination (Join-Path $runDirectory 'hardware_observation.json')
Copy-Item -LiteralPath $captureInstructions -Destination (Join-Path $runDirectory 'visual_capture_instructions.md')
Copy-Item -LiteralPath $guiHandoff -Destination (Join-Path $runDirectory 'gui-capture-handoff.md')
New-Item -ItemType Directory -Force -Path (Join-Path $runDirectory 'screenshots') | Out-Null

$rawPath = Join-Path $runDirectory 'raw-results.ndjson'
$summaryPath = Join-Path $runDirectory 'summary.json'
$stdoutPath = Join-Path $runDirectory 'stdout.txt'
$stderrPath = Join-Path $runDirectory 'stderr.txt'
$markdownPath = Join-Path $runDirectory 'stress-stage-summary.md'
$baseUrl = 'http://localhost:3000'
$arguments = @(
    'run',
    '--no-color',
    '-e', "BASE_URL=$baseUrl",
    '-e', "K6_RUN_ID=$RunId",
    '-e', "STRESS_MARKDOWN_REPORT_PATH=$markdownPath",
    '--summary-export', $summaryPath,
    '--out', "json=$rawPath",
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
$reportHelperHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $evidenceReportHelper).Hash
$csvHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $evidenceCsv).Hash
$k6Version = (& $k6Path version | Out-String).Trim()

$preRunMetadata = [ordered]@{
    test_name = '23127179_Stress_20260817'
    official_run = $true
    run_id = $RunId
    commit_hash = $commitHash
    k6_version = $k6Version
    base_url = $baseUrl
    command = $exactCommand
    started_at_utc = $startedAt.ToString('o')
    backend_pid = $backendPid
    backend_process_started_at_local = $backendProcess.StartTime.ToString('o')
    backend_restarted_before_run = $BackendRestartedBeforeRun
    database_reseeded_before_run = $BackendRestartedBeforeRun
    script_sha256 = $scriptHash
    report_helper_sha256 = $reportHelperHash
    csv_sha256 = $csvHash
    raw_output_format = 'k6 newline-delimited JSON with step and stress_level tags'
    designated_report_type = 'Custom k6 end-of-test Markdown Stress Stage Summary'
    designated_report_path = $markdownPath
    stage_profile_seconds = 1140
    visual_evidence_status = 'Not captured; use gui-capture-handoff.md during this invocation.'
}
$preRunMetadata | ConvertTo-Json -Depth 5 |
    Set-Content -LiteralPath (Join-Path $runDirectory 'metadata-pre-run.json') -Encoding utf8

Write-Output "OFFICIAL STRESS K6_RUN_ID=$RunId"
Write-Output "OFFICIAL COMMAND=$exactCommand"
Write-Output "STRESS MARKDOWN REPORT=$markdownPath"
$k6Process = Start-Process -FilePath $k6Path -ArgumentList $arguments -WorkingDirectory $runDirectory `
    -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -WindowStyle Hidden -PassThru
$null = $k6Process.Handle
$logicalProcessors = [Environment]::ProcessorCount
$processSamples = [System.Collections.Generic.List[object]]::new()
$systemSamples = [System.Collections.Generic.List[object]]::new()
$previousCpu = @{}
$lastProgress = -10

function Get-StressStage {
    param([double]$ElapsedSeconds)

    if ($ElapsedSeconds -lt 30) { return [pscustomobject]@{ Phase = 'transition'; Level = 'transition_1_to_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 150) { return [pscustomobject]@{ Phase = 'plateau'; Level = 'baseline_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 180) { return [pscustomobject]@{ Phase = 'transition'; Level = 'transition_4_to_8'; TargetVUs = 8 } }
    if ($ElapsedSeconds -lt 300) { return [pscustomobject]@{ Phase = 'plateau'; Level = 'anchor_8'; TargetVUs = 8 } }
    if ($ElapsedSeconds -lt 330) { return [pscustomobject]@{ Phase = 'transition'; Level = 'transition_8_to_12'; TargetVUs = 12 } }
    if ($ElapsedSeconds -lt 450) { return [pscustomobject]@{ Phase = 'plateau'; Level = 'level_12'; TargetVUs = 12 } }
    if ($ElapsedSeconds -lt 480) { return [pscustomobject]@{ Phase = 'transition'; Level = 'transition_12_to_16'; TargetVUs = 16 } }
    if ($ElapsedSeconds -lt 600) { return [pscustomobject]@{ Phase = 'plateau'; Level = 'level_16'; TargetVUs = 16 } }
    if ($ElapsedSeconds -lt 630) { return [pscustomobject]@{ Phase = 'transition'; Level = 'transition_16_to_20'; TargetVUs = 20 } }
    if ($ElapsedSeconds -lt 750) { return [pscustomobject]@{ Phase = 'plateau'; Level = 'level_20'; TargetVUs = 20 } }
    if ($ElapsedSeconds -lt 780) { return [pscustomobject]@{ Phase = 'transition'; Level = 'transition_20_to_24'; TargetVUs = 24 } }
    if ($ElapsedSeconds -lt 900) { return [pscustomobject]@{ Phase = 'plateau'; Level = 'maximum_24'; TargetVUs = 24 } }
    if ($ElapsedSeconds -lt 960) { return [pscustomobject]@{ Phase = 'recovery_ramp'; Level = 'transition_24_to_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 1080) { return [pscustomobject]@{ Phase = 'recovery'; Level = 'recovery_4'; TargetVUs = 4 } }
    if ($ElapsedSeconds -lt 1140) { return [pscustomobject]@{ Phase = 'ramp_down'; Level = 'transition_4_to_0'; TargetVUs = 0 } }
    return [pscustomobject]@{ Phase = 'graceful_completion'; Level = 'graceful_completion'; TargetVUs = 0 }
}

function Add-ProcessSample {
    param(
        [System.Diagnostics.Process]$Process,
        [string]$Role,
        [datetime]$Timestamp,
        [pscustomobject]$Stage
    )
    try {
        $Process.Refresh()
        $cpuSeconds = $Process.TotalProcessorTime.TotalSeconds
        $key = "$Role-$($Process.Id)"
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
            stress_phase = $Stage.Phase
            stress_level = $Stage.Level
            target_vus = $Stage.TargetVUs
            role = $Role
            pid = $Process.Id
            cpu_percent_total_machine = if ($null -eq $cpuPercent) { '' } else { [math]::Round($cpuPercent, 3) }
            working_set_mb = [math]::Round($Process.WorkingSet64 / 1MB, 3)
            private_memory_mb = [math]::Round($Process.PrivateMemorySize64 / 1MB, 3)
            thread_count = $Process.Threads.Count
        })
    }
    catch [System.InvalidOperationException] {
        return
    }
}

while (-not $k6Process.HasExited) {
    $timestamp = (Get-Date).ToUniversalTime()
    $elapsedSeconds = ($timestamp - $startedAt).TotalSeconds
    $stage = Get-StressStage -ElapsedSeconds $elapsedSeconds
    Add-ProcessSample -Process $backendProcess -Role 'backend' -Timestamp $timestamp -Stage $stage
    Add-ProcessSample -Process $k6Process -Role 'k6' -Timestamp $timestamp -Stage $stage

    try {
        $counterSet = Get-Counter '\Processor(_Total)\% Processor Time','\Memory\% Committed Bytes In Use','\PhysicalDisk(_Total)\Disk Bytes/sec','\Network Interface(*)\Bytes Total/sec' -MaxSamples 1
        $counterSamples = $counterSet.CounterSamples
        $cpu = ($counterSamples | Where-Object Path -Like '*\processor(_total)\% processor time' | Select-Object -First 1).CookedValue
        $memory = ($counterSamples | Where-Object Path -Like '*\memory\% committed bytes in use' | Select-Object -First 1).CookedValue
        $disk = ($counterSamples | Where-Object Path -Like '*\physicaldisk(_total)\disk bytes/sec' | Select-Object -First 1).CookedValue
        $network = ($counterSamples | Where-Object Path -Like '*\network interface(*)\bytes total/sec' | Measure-Object CookedValue -Sum).Sum
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $timestamp.ToString('o')
            stress_phase = $stage.Phase
            stress_level = $stage.Level
            target_vus = $stage.TargetVUs
            cpu_percent = [math]::Round($cpu, 3)
            committed_memory_percent = [math]::Round($memory, 3)
            disk_bytes_per_second = [math]::Round($disk, 3)
            network_bytes_per_second = [math]::Round($network, 3)
        })
    }
    catch {
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $timestamp.ToString('o')
            stress_phase = $stage.Phase
            stress_level = $stage.Level
            target_vus = $stage.TargetVUs
            cpu_percent = ''
            committed_memory_percent = ''
            disk_bytes_per_second = ''
            network_bytes_per_second = ''
        })
    }

    if ($elapsedSeconds -ge ($lastProgress + 10)) {
        $liveLine = Get-Content -LiteralPath $stdoutPath -Tail 20 -ErrorAction SilentlyContinue |
            Where-Object { $_ -match '^running \(|^stress\s' } |
            Select-Object -Last 1
        Write-Output ("STRESS_PHASE={0} STRESS_LEVEL={1} TARGET_VUS={2} RUN_ID={3} ELAPSED={4:N0}" -f `
            $stage.Phase, $stage.Level, $stage.TargetVUs, $RunId, $elapsedSeconds)
        if ($liveLine) {
            Write-Output "K6 LIVE $liveLine"
        }
        $lastProgress = $elapsedSeconds
    }
    Start-Sleep -Seconds 1
}

$k6Process.WaitForExit()
$k6Process.Refresh()
$endedAt = (Get-Date).ToUniversalTime()
$exitCode = $k6Process.ExitCode
$processSamples | Export-Csv -LiteralPath (Join-Path $runDirectory 'process-resources.csv') -NoTypeInformation -Encoding utf8
$systemSamples | Export-Csv -LiteralPath (Join-Path $runDirectory 'system-resources.csv') -NoTypeInformation -Encoding utf8

$finalMetadata = [ordered]@{
    test_name = '23127179_Stress_20260817'
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
    backend_pid = $backendPid
    k6_pid = $k6Process.Id
    logical_processors_used_for_process_cpu_normalization = $logicalProcessors
    backend_restarted_before_run = $BackendRestartedBeforeRun
    database_reseeded_before_run = $BackendRestartedBeforeRun
    script_sha256 = $scriptHash
    report_helper_sha256 = $reportHelperHash
    csv_sha256 = $csvHash
    raw_output_exists = (Test-Path -LiteralPath $rawPath)
    raw_output_bytes = if (Test-Path -LiteralPath $rawPath) { (Get-Item -LiteralPath $rawPath).Length } else { 0 }
    summary_exists = (Test-Path -LiteralPath $summaryPath)
    designated_report_type = 'Custom k6 end-of-test Markdown Stress Stage Summary'
    markdown_report_exists = (Test-Path -LiteralPath $markdownPath)
    markdown_report_bytes = if (Test-Path -LiteralPath $markdownPath) { (Get-Item -LiteralPath $markdownPath).Length } else { 0 }
    process_resource_samples = $processSamples.Count
    system_resource_samples = $systemSamples.Count
    visual_evidence_status = 'Requires real same-run screenshots and a post-run screenshot manifest.'
}
$finalMetadata | ConvertTo-Json -Depth 5 |
    Set-Content -LiteralPath (Join-Path $runDirectory 'metadata.json') -Encoding utf8
$finalMetadata | ConvertTo-Json -Depth 5
