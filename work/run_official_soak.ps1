param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]{8,20}$')]
    [string]$RunId,

    [Parameter(Mandatory = $true)]
    [bool]$BackendRestartedBeforeRun,

    [Parameter(Mandatory = $true)]
    [bool]$GuiCaptureReady
)

# Prepared for a future separately authorized official Soak invocation.
# Do not invoke this runner during implementation validation.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$k6Path = Join-Path $PSScriptRoot 'calibration-tools\k6-v2.1.0-windows-amd64\k6.exe'
$sourceScript = Join-Path $repoRoot 'out\23127179_Soak_20260817.js'
$sourceCsv = Join-Path $repoRoot 'out\user_workflow_data.csv'
$verifierScript = Join-Path $PSScriptRoot 'verify_soak_results.js'
$databaseCaptureScript = Join-Path $PSScriptRoot 'capture_soak_database_state.js'
$captureScript = Join-Path $PSScriptRoot 'capture_official_soak_frames.ps1'
$resourcePane = Join-Path $PSScriptRoot 'soak_resource_monitor_pane.ps1'
$executionHandoff = Join-Path $PSScriptRoot 'official_soak_execution_handoff.md'
$databasePath = Join-Path $repoRoot 'eshop-sut\backend\database.sqlite'
$evidenceRoot = Join-Path $repoRoot 'out\23127179_Soak_20260817_evidence'
$runDirectory = Join-Path $evidenceRoot $RunId

# Frozen after implementation validation. Update only through a new human review.
$approvedHashes = [ordered]@{
    '23127179_Soak_20260817.js' = 'BA409623775BB524059996AC62A80515E5A4E0FB3E295CC2895B1EEA78FB98DD'
    'user_workflow_data.csv' = '1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1'
    'verify_soak_results.js' = 'F0584DB90448086B73A827C2EFF78C0D231A22BD9A14C728F4C014306EC6B37B'
    'capture_soak_database_state.js' = '4FFE9D654B1218E0211D97CE7CA8F396E1392F6C85ED5FA9D32CB23ADF94720E'
    'capture_official_soak_frames.ps1' = '4F96F134E5CD970DC2DF099E8C3A51D201D42C9459A512499517D302FFFC6326'
    'soak_resource_monitor_pane.ps1' = 'CAB043D1E0AF0C3441ACAA78879D1427AB38CB164B56E3A637EC8D2329D19666'
    'official_soak_execution_handoff.md' = 'C4CBBBF8513C060C08A96F4D1122B023B591CAE4580C3DE31D11B3012A3D0AE5'
}
$sourcePaths = [ordered]@{
    '23127179_Soak_20260817.js' = $sourceScript
    'user_workflow_data.csv' = $sourceCsv
    'verify_soak_results.js' = $verifierScript
    'capture_soak_database_state.js' = $databaseCaptureScript
    'capture_official_soak_frames.ps1' = $captureScript
    'soak_resource_monitor_pane.ps1' = $resourcePane
    'official_soak_execution_handoff.md' = $executionHandoff
}

function Get-CanonicalTextSha256 {
    param([string]$Path)
    $content = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path)).Replace("`r`n", "`n").Replace("`r", "`n")
    $bytes = (New-Object Text.UTF8Encoding($false)).GetBytes($content)
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '')
    }
    finally {
        $sha.Dispose()
    }
}

if ((git -C $repoRoot branch --show-current).Trim() -ne 'hw05-performance') {
    throw 'Official Soak must run from branch hw05-performance'
}
if (-not $BackendRestartedBeforeRun) {
    throw 'Official Soak requires a documented clean backend restart and SQLite reseed immediately before traffic'
}
if (-not $GuiCaptureReady) {
    throw 'Official Soak requires the sparse capture workflow and GUI layout to be ready before traffic'
}
foreach ($requiredPath in @($k6Path, $databasePath) + $sourcePaths.Values) {
    if (-not (Test-Path -LiteralPath $requiredPath)) { throw "Required file not found: $requiredPath" }
}
foreach ($name in $approvedHashes.Keys) {
    $actualHash = Get-CanonicalTextSha256 -Path $sourcePaths[$name]
    if ($actualHash -ne $approvedHashes[$name]) {
        throw "Reviewed artifact hash mismatch: $name"
    }
}

$existingRunId = Get-ChildItem -LiteralPath (Join-Path $repoRoot 'out') -Directory -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq $RunId } |
    Select-Object -First 1
if ($existingRunId) {
    throw "K6_RUN_ID already exists in the evidence tree: $RunId"
}

$listener = netstat -ano -p tcp |
    Select-String -Pattern '^\s*TCP\s+\S+:3000\s+\S+\s+LISTENING\s+(\d+)\s*$' |
    Select-Object -First 1
if (-not $listener) { throw 'No backend process is listening on TCP port 3000' }
$backendProcessId = [int]$listener.Matches[0].Groups[1].Value
$backendProcess = Get-Process -Id $backendProcessId
if ($backendProcess.ProcessName -ne 'node') {
    throw "Port 3000 listener is not node.exe: $($backendProcess.ProcessName)"
}
$apiResponse = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/categories' -TimeoutSec 5
if ($apiResponse.StatusCode -ne 200) {
    throw "Backend health check returned HTTP $($apiResponse.StatusCode)"
}

New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
New-Item -ItemType Directory -Path $runDirectory | Out-Null
New-Item -ItemType Directory -Path (Join-Path $runDirectory 'screenshots') | Out-Null

foreach ($name in $sourcePaths.Keys) {
    Copy-Item -LiteralPath $sourcePaths[$name] -Destination (Join-Path $runDirectory $name)
}
$hardwarePath = Join-Path $repoRoot 'work\calibration-results\hardware_observation.json'
if (Test-Path -LiteralPath $hardwarePath) {
    Copy-Item -LiteralPath $hardwarePath -Destination (Join-Path $runDirectory 'hardware_observation.json')
}

$evidenceScript = Join-Path $runDirectory '23127179_Soak_20260817.js'
$rawPath = Join-Path $runDirectory 'raw-results.ndjson'
$summaryPath = Join-Path $runDirectory 'summary.json'
$stdoutPath = Join-Path $runDirectory 'stdout.log'
$stderrPath = Join-Path $runDirectory 'stderr.log'
$processResourcePath = Join-Path $runDirectory 'process-resource.csv'
$systemResourcePath = Join-Path $runDirectory 'system-resource.csv'
$metadataPreRunPath = Join-Path $runDirectory 'metadata-pre-run.json'
$metadataPath = Join-Path $runDirectory 'metadata.json'
$runtimeStatePath = Join-Path $runDirectory 'runtime-state.json'
$databaseBeforePath = Join-Path $runDirectory 'database-state-before.json'
$databaseAfterPath = Join-Path $runDirectory 'database-state-after.json'
$windowSummaryPath = Join-Path $runDirectory 'soak-window-summary.md'
$baseUrl = 'http://localhost:3000'
$arguments = @(
    'run',
    '--no-color',
    '-e', "BASE_URL=$baseUrl",
    '-e', "K6_RUN_ID=$RunId",
    '--summary-export', $summaryPath,
    '--out', "json=$rawPath",
    $evidenceScript
)
$quotedArguments = $arguments | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }
$exactCommand = '& "' + $k6Path + '" ' + ($quotedArguments -join ' ')
$exactCommand | Set-Content -LiteralPath (Join-Path $runDirectory 'command.txt') -Encoding utf8

$runnerPreflightStart = (Get-Date).ToUniversalTime()
$commitHash = (git -C $repoRoot rev-parse HEAD).Trim()
$k6Version = (& $k6Path version | Out-String).Trim()
& node $databaseCaptureScript --database $databasePath --output $databaseBeforePath --label before | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Pre-run read-only database-state capture failed' }

$preRunMetadata = [ordered]@{
    test_name = '23127179_Soak_20260817'
    official_run = $true
    run_id = $RunId
    commit_hash = $commitHash
    k6_version = $k6Version
    base_url = $baseUrl
    command = $exactCommand
    runner_preflight_start_utc = $runnerPreflightStart.ToString('o')
    actual_k6_scenario_start_utc = $null
    actual_k6_scenario_start_epoch_ms = $null
    backend_pid = $backendProcessId
    backend_process_started_at_local = $backendProcess.StartTime.ToString('o')
    backend_restarted_before_run = $BackendRestartedBeforeRun
    database_reseeded_before_run = $BackendRestartedBeforeRun
    gui_capture_ready = $GuiCaptureReady
    resource_sampling_seconds = 2
    post_load_recovery_seconds = 120
    raw_output_format = 'k6 newline-delimited JSON with step, soak_window, and target_vus tags'
    report_role = 'Additional Soak evidence milestone; not part of the three-report uniqueness requirement'
    actual_vu_sources = @('k6 progress parsed by runner', 'raw soak_actual_vus metric')
    scenario_start_anchor = 'Pending k6 SOAK_SCENARIO_START marker; runner preflight is not the anchor'
}
$preRunMetadata | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $metadataPreRunPath -Encoding utf8

$sourcePaths.GetEnumerator() | ForEach-Object {
    $evidencePath = Join-Path $runDirectory $_.Key
    "$((Get-FileHash -Algorithm SHA256 -LiteralPath $evidencePath).Hash)  $($_.Key)"
} |
    Set-Content -LiteralPath (Join-Path $runDirectory 'hashes.sha256') -Encoding utf8

Write-Output "OFFICIAL SOAK K6_RUN_ID=$RunId"
Write-Output "RUNNER_PREFLIGHT_START=$($runnerPreflightStart.ToString('o'))"
Write-Output "OFFICIAL COMMAND=$exactCommand"

$logicalProcessors = [Environment]::ProcessorCount
$previousCpu = @{}
$processSamples = [System.Collections.Generic.List[object]]::new()
$systemSamples = [System.Collections.Generic.List[object]]::new()
$preTrafficTimestamp = (Get-Date).ToUniversalTime()
$backendProcess.Refresh()
$processSamples.Add([pscustomobject]@{
    timestamp_utc = $preTrafficTimestamp.ToString('o'); soak_window = 'pre_traffic'; target_vus = 0
    actual_vus_live = ''; actual_vus_live_source = 'unavailable'; role = 'backend'; pid = $backendProcessId
    process_available = $true; cpu_percent_total_machine = ''
    working_set_mb = [math]::Round($backendProcess.WorkingSet64 / 1MB, 3)
    private_memory_mb = [math]::Round($backendProcess.PrivateMemorySize64 / 1MB, 3)
    thread_count = $backendProcess.Threads.Count
})
$processSamples.Add([pscustomobject]@{
    timestamp_utc = $preTrafficTimestamp.ToString('o'); soak_window = 'pre_traffic'; target_vus = 0
    actual_vus_live = ''; actual_vus_live_source = 'unavailable'; role = 'k6'; pid = ''
    process_available = $false; cpu_percent_total_machine = ''; working_set_mb = ''
    private_memory_mb = ''; thread_count = ''
})
try {
    $preCounters = Get-Counter '\Processor(_Total)\% Processor Time','\Memory\% Committed Bytes In Use','\PhysicalDisk(_Total)\Disk Bytes/sec','\Network Interface(*)\Bytes Total/sec' -MaxSamples 1
    $preSamples = $preCounters.CounterSamples
    $systemSamples.Add([pscustomobject]@{
        timestamp_utc = $preTrafficTimestamp.ToString('o'); soak_window = 'pre_traffic'; target_vus = 0
        actual_vus_live = ''; actual_vus_live_source = 'unavailable'
        cpu_percent = [math]::Round(($preSamples | Where-Object Path -Like '*\processor(_total)\% processor time' | Select-Object -First 1).CookedValue, 3)
        committed_memory_percent = [math]::Round(($preSamples | Where-Object Path -Like '*\memory\% committed bytes in use' | Select-Object -First 1).CookedValue, 3)
        disk_bytes_per_second = [math]::Round(($preSamples | Where-Object Path -Like '*\physicaldisk(_total)\disk bytes/sec' | Select-Object -First 1).CookedValue, 3)
        network_bytes_per_second = [math]::Round(($preSamples | Where-Object Path -Like '*\network interface(*)\bytes total/sec' | Measure-Object CookedValue -Sum).Sum, 3)
    })
}
catch {
    $systemSamples.Add([pscustomobject]@{
        timestamp_utc = $preTrafficTimestamp.ToString('o'); soak_window = 'pre_traffic'; target_vus = 0
        actual_vus_live = ''; actual_vus_live_source = 'unavailable'; cpu_percent = ''
        committed_memory_percent = ''; disk_bytes_per_second = ''; network_bytes_per_second = ''
    })
}

$k6Process = Start-Process -FilePath $k6Path -ArgumentList $arguments -WorkingDirectory $runDirectory `
    -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -WindowStyle Hidden -PassThru
$null = $k6Process.Handle

$actualScenarioStart = $null
$actualScenarioStartEpochMs = $null
$confirmedTrafficEnd = $null

function Get-ScenarioStartMarker {
    foreach ($path in @($stdoutPath, $stderrPath)) {
        if (-not (Test-Path -LiteralPath $path)) { continue }
        $line = Get-Content -LiteralPath $path -Tail 80 -ErrorAction SilentlyContinue |
            Where-Object { $_ -match 'SOAK_SCENARIO_START epoch_ms=(\d+)' } |
            Select-Object -Last 1
        if ($line -and $line -match 'SOAK_SCENARIO_START epoch_ms=(\d+)') {
            return [int64]$Matches[1]
        }
    }
    return $null
}

function Get-LiveActualVUs {
    foreach ($path in @($stdoutPath, $stderrPath)) {
        if (-not (Test-Path -LiteralPath $path)) { continue }
        $line = Get-Content -LiteralPath $path -Tail 80 -ErrorAction SilentlyContinue |
            Where-Object { $_ -match '(?<active>\d+)/(?<maximum>\d+)\s+VUs' } |
            Select-Object -Last 1
        if ($line -and $line -match '(?<active>\d+)/(?<maximum>\d+)\s+VUs') {
            return [int]$Matches.active
        }
    }
    return $null
}

function Get-SoakContext {
    param([datetime]$Timestamp)
    if ($null -eq $actualScenarioStart) {
        return [pscustomobject]@{ Window = 'pre_traffic'; TargetVUs = 0; ElapsedSeconds = $null }
    }
    $elapsed = ($Timestamp - $actualScenarioStart).TotalSeconds
    if ($null -ne $confirmedTrafficEnd -and $Timestamp -ge $confirmedTrafficEnd) {
        return [pscustomobject]@{ Window = 'post_load_recovery'; TargetVUs = 0; ElapsedSeconds = $elapsed }
    }
    if ($elapsed -lt 60) {
        $target = [math]::Min(12, [math]::Max(1, [math]::Ceiling(1 + 11 * $elapsed / 60)))
        return [pscustomobject]@{ Window = 'warmup_entry'; TargetVUs = $target; ElapsedSeconds = $elapsed }
    }
    if ($elapsed -lt 300) { return [pscustomobject]@{ Window = 'early_steady'; TargetVUs = 12; ElapsedSeconds = $elapsed } }
    if ($elapsed -lt 540) { return [pscustomobject]@{ Window = 'middle_steady'; TargetVUs = 12; ElapsedSeconds = $elapsed } }
    if ($elapsed -lt 780) { return [pscustomobject]@{ Window = 'late_steady'; TargetVUs = 12; ElapsedSeconds = $elapsed } }
    if ($elapsed -lt 810) {
        $target = [math]::Max(0, [math]::Ceiling(12 * (810 - $elapsed) / 30))
        return [pscustomobject]@{ Window = 'exit_ramp'; TargetVUs = $target; ElapsedSeconds = $elapsed }
    }
    return [pscustomobject]@{ Window = 'graceful_completion'; TargetVUs = 0; ElapsedSeconds = $elapsed }
}

function Add-ProcessSample {
    param([int]$ProcessId, [string]$Role, [datetime]$Timestamp, [pscustomobject]$Context, [Nullable[int]]$ActualVUs)
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        $cpuSeconds = $process.TotalProcessorTime.TotalSeconds
        $key = "$Role-$ProcessId"
        $cpuPercent = $null
        if ($previousCpu.ContainsKey($key)) {
            $seconds = ($Timestamp - $previousCpu[$key].Timestamp).TotalSeconds
            if ($seconds -gt 0) {
                $cpuPercent = 100 * ($cpuSeconds - $previousCpu[$key].CpuSeconds) / ($seconds * $logicalProcessors)
            }
        }
        $previousCpu[$key] = @{ Timestamp = $Timestamp; CpuSeconds = $cpuSeconds }
        $processSamples.Add([pscustomobject]@{
            timestamp_utc = $Timestamp.ToString('o'); soak_window = $Context.Window; target_vus = $Context.TargetVUs
            actual_vus_live = if ($null -eq $ActualVUs) { '' } else { $ActualVUs }
            actual_vus_live_source = if ($null -eq $ActualVUs) { 'unavailable' } else { 'k6_progress' }
            role = $Role; pid = $ProcessId; process_available = $true
            cpu_percent_total_machine = if ($null -eq $cpuPercent) { '' } else { [math]::Round($cpuPercent, 3) }
            working_set_mb = [math]::Round($process.WorkingSet64 / 1MB, 3)
            private_memory_mb = [math]::Round($process.PrivateMemorySize64 / 1MB, 3)
            thread_count = $process.Threads.Count
        })
    }
    catch {
        $processSamples.Add([pscustomobject]@{
            timestamp_utc = $Timestamp.ToString('o'); soak_window = $Context.Window; target_vus = $Context.TargetVUs
            actual_vus_live = if ($null -eq $ActualVUs) { '' } else { $ActualVUs }
            actual_vus_live_source = if ($null -eq $ActualVUs) { 'unavailable' } else { 'k6_progress' }
            role = $Role; pid = $ProcessId; process_available = $false
            cpu_percent_total_machine = ''; working_set_mb = ''; private_memory_mb = ''; thread_count = ''
        })
    }
}

function Write-RuntimeState {
    param([datetime]$Timestamp, [pscustomobject]$Context, [Nullable[int]]$ActualVUs, [bool]$TrafficActive)
    [ordered]@{
        run_id = $RunId
        runner_preflight_start_utc = $runnerPreflightStart.ToString('o')
        actual_k6_scenario_start_utc = if ($null -eq $actualScenarioStart) { $null } else { $actualScenarioStart.ToString('o') }
        actual_k6_scenario_start_epoch_ms = $actualScenarioStartEpochMs
        confirmed_traffic_end_utc = if ($null -eq $confirmedTrafficEnd) { $null } else { $confirmedTrafficEnd.ToString('o') }
        timestamp_utc = $Timestamp.ToString('o')
        soak_window = $Context.Window
        elapsed_seconds = if ($null -eq $Context.ElapsedSeconds) { $null } else { [math]::Round($Context.ElapsedSeconds, 1) }
        target_vus = $Context.TargetVUs
        actual_vus = if ($null -eq $ActualVUs) { $null } else { $ActualVUs }
        actual_vus_source = if ($null -eq $ActualVUs) { 'unavailable' } else { 'k6_progress' }
        backend_pid = $backendProcessId
        k6_pid = $k6Process.Id
        traffic_active = $TrafficActive
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $runtimeStatePath -Encoding utf8
}

while ($true) {
    $sampleStarted = (Get-Date).ToUniversalTime()
    $k6Process.Refresh()
    $trafficActive = -not $k6Process.HasExited
    if ($null -eq $actualScenarioStart) {
        $marker = Get-ScenarioStartMarker
        if ($null -ne $marker) {
            $actualScenarioStartEpochMs = $marker
            $actualScenarioStart = [datetime]::SpecifyKind(
                [datetimeoffset]::FromUnixTimeMilliseconds($marker).UtcDateTime,
                [System.DateTimeKind]::Utc
            )
            Write-Output "ACTUAL_K6_SCENARIO_START=$($actualScenarioStart.ToString('o'))"
        }
    }
    if (-not $trafficActive -and $null -eq $confirmedTrafficEnd) {
        $confirmedTrafficEnd = $sampleStarted
        Write-Output "CONFIRMED_TRAFFIC_END=$($confirmedTrafficEnd.ToString('o'))"
    }

    $context = Get-SoakContext -Timestamp $sampleStarted
    $actualVUs = if ($trafficActive) { Get-LiveActualVUs } else { $null }
    Add-ProcessSample -ProcessId $backendProcessId -Role 'backend' -Timestamp $sampleStarted -Context $context -ActualVUs $actualVUs
    Add-ProcessSample -ProcessId $k6Process.Id -Role 'k6' -Timestamp $sampleStarted -Context $context -ActualVUs $actualVUs

    try {
        $counterSet = Get-Counter '\Processor(_Total)\% Processor Time','\Memory\% Committed Bytes In Use','\PhysicalDisk(_Total)\Disk Bytes/sec','\Network Interface(*)\Bytes Total/sec' -MaxSamples 1
        $samples = $counterSet.CounterSamples
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $sampleStarted.ToString('o'); soak_window = $context.Window; target_vus = $context.TargetVUs
            actual_vus_live = if ($null -eq $actualVUs) { '' } else { $actualVUs }
            actual_vus_live_source = if ($null -eq $actualVUs) { 'unavailable' } else { 'k6_progress' }
            cpu_percent = [math]::Round(($samples | Where-Object Path -Like '*\processor(_total)\% processor time' | Select-Object -First 1).CookedValue, 3)
            committed_memory_percent = [math]::Round(($samples | Where-Object Path -Like '*\memory\% committed bytes in use' | Select-Object -First 1).CookedValue, 3)
            disk_bytes_per_second = [math]::Round(($samples | Where-Object Path -Like '*\physicaldisk(_total)\disk bytes/sec' | Select-Object -First 1).CookedValue, 3)
            network_bytes_per_second = [math]::Round(($samples | Where-Object Path -Like '*\network interface(*)\bytes total/sec' | Measure-Object CookedValue -Sum).Sum, 3)
        })
    }
    catch {
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $sampleStarted.ToString('o'); soak_window = $context.Window; target_vus = $context.TargetVUs
            actual_vus_live = if ($null -eq $actualVUs) { '' } else { $actualVUs }
            actual_vus_live_source = if ($null -eq $actualVUs) { 'unavailable' } else { 'k6_progress' }
            cpu_percent = ''; committed_memory_percent = ''; disk_bytes_per_second = ''; network_bytes_per_second = ''
        })
    }

    Write-RuntimeState -Timestamp $sampleStarted -Context $context -ActualVUs $actualVUs -TrafficActive $trafficActive
    $actualText = if ($null -eq $actualVUs) { 'unavailable' } else { $actualVUs }
    Write-Output ("SOAK_WINDOW={0} TARGET_VUS={1} ACTUAL_VUS={2} RUN_ID={3} ELAPSED={4}" -f `
        $context.Window, $context.TargetVUs, $actualText, $RunId, $context.ElapsedSeconds)

    if ($null -ne $confirmedTrafficEnd -and $sampleStarted -ge $confirmedTrafficEnd.AddSeconds(120)) {
        break
    }
    $sampleElapsedMs = ((Get-Date).ToUniversalTime() - $sampleStarted).TotalMilliseconds
    $remainingMs = [math]::Max(0, 2000 - $sampleElapsedMs)
    if ($remainingMs -gt 0) { Start-Sleep -Milliseconds ([int]$remainingMs) }
}

$k6Process.WaitForExit()
$k6Process.Refresh()
$exitCode = $k6Process.ExitCode
$endedAt = (Get-Date).ToUniversalTime()
$processSamples | Export-Csv -LiteralPath $processResourcePath -NoTypeInformation -Encoding utf8
$systemSamples | Export-Csv -LiteralPath $systemResourcePath -NoTypeInformation -Encoding utf8
& node $databaseCaptureScript --database $databasePath --output $databaseAfterPath --label after | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Post-run read-only database-state capture failed' }

$finalMetadata = [ordered]@{
    test_name = '23127179_Soak_20260817'; official_run = $true; run_id = $RunId; commit_hash = $commitHash
    k6_version = $k6Version; command = $exactCommand
    runner_preflight_start_utc = $runnerPreflightStart.ToString('o')
    actual_k6_scenario_start_utc = if ($null -eq $actualScenarioStart) { $null } else { $actualScenarioStart.ToString('o') }
    actual_k6_scenario_start_epoch_ms = $actualScenarioStartEpochMs
    confirmed_traffic_end_utc = if ($null -eq $confirmedTrafficEnd) { $null } else { $confirmedTrafficEnd.ToString('o') }
    evidence_collection_end_utc = $endedAt.ToString('o')
    k6_exit_code = $exitCode; threshold_exit = ($exitCode -eq 99)
    backend_pid = $backendProcessId; k6_pid = $k6Process.Id
    backend_restarted_before_run = $BackendRestartedBeforeRun; database_reseeded_before_run = $BackendRestartedBeforeRun
    resource_sampling_seconds = 2; post_load_recovery_seconds = 120
    process_resource_samples = $processSamples.Count; system_resource_samples = $systemSamples.Count
    raw_output_exists = Test-Path -LiteralPath $rawPath
    raw_output_bytes = if (Test-Path -LiteralPath $rawPath) { (Get-Item -LiteralPath $rawPath).Length } else { 0 }
    raw_output_sha256 = if (Test-Path -LiteralPath $rawPath) { (Get-FileHash -Algorithm SHA256 -LiteralPath $rawPath).Hash } else { $null }
    summary_exists = Test-Path -LiteralPath $summaryPath
    report_role = 'Additional Soak evidence milestone; not part of the three-report uniqueness requirement'
    automatic_stability_claim = $false; automatic_memory_diagnosis = $false; automatic_rerun = $false
}
$finalMetadata | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $metadataPath -Encoding utf8

if ($null -eq $actualScenarioStart) {
    throw 'Invalid execution: k6 scenario-start marker was not captured'
}
if (-not (Test-Path -LiteralPath $rawPath) -or -not (Test-Path -LiteralPath $summaryPath)) {
    throw 'Invalid evidence: raw NDJSON or summary JSON is missing'
}

& node $verifierScript `
    --raw $rawPath `
    --process $processResourcePath `
    --system $systemResourcePath `
    --metadata $metadataPath `
    --summary $summaryPath `
    --output $windowSummaryPath
if ($LASTEXITCODE -ne 0) { throw 'Factual Soak verifier failed' }

$rawHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $rawPath).Hash
Add-Content -LiteralPath (Join-Path $runDirectory 'hashes.sha256') -Value "$rawHash  raw-results.ndjson" -Encoding utf8

@"
# Official Soak Execution Completion Record

- Run ID: ``$RunId``
- Runner preflight start: ``$($runnerPreflightStart.ToString('o'))``
- Actual k6 scenario start: ``$($actualScenarioStart.ToString('o'))``
- Confirmed traffic end: ``$($confirmedTrafficEnd.ToString('o'))``
- Evidence collection end: ``$($endedAt.ToString('o'))``
- k6 exit code: ``$exitCode``
- Threshold exit: ``$($exitCode -eq 99)``
- Raw NDJSON bytes: ``$((Get-Item -LiteralPath $rawPath).Length)``
- Raw NDJSON SHA-256: ``$rawHash``
- Process-resource samples: ``$($processSamples.Count)``
- System-resource samples: ``$($systemSamples.Count)``
- Recovery observation: 120 seconds after confirmed k6 exit
- Result interpretation: factual completion only; no Task 2 analysis

Poor performance is evidence and does not authorize an automatic rerun. Stable-throughput,
capacity, SLO, memory-leak, defect, and optimization claims are not made here.
"@ | Set-Content -LiteralPath (Join-Path $runDirectory 'completion-report.md') -Encoding utf8

@"
# Official Soak Post-Run Verification Notes

Status: **PENDING HUMAN FACTUAL REVIEW**

Review the real raw result, summary, resource CSV files, database facts, window summary,
actual-VU evidence, screenshots, and hashes. Classify technical validity and submission
completeness separately. Do not perform Task 2 interpretation in this file.
"@ | Set-Content -LiteralPath (Join-Path $runDirectory 'post-run-verification-notes.md') -Encoding utf8

$finalMetadata | ConvertTo-Json -Depth 6
