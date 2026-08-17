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
$sourceScript = Join-Path $repoRoot 'out\23127179_Load_20260817.js'
$sourceCsv = Join-Path $repoRoot 'out\user_workflow_data.csv'
$evidenceRoot = Join-Path $repoRoot 'out\23127179_Load_20260817_evidence'
$runDirectory = Join-Path $evidenceRoot $RunId
$approvedScriptHash = '9B8E3B9DAC02B010AFC76D1C349450A707FEF391BB1E2874422FE951094C6704'
$approvedCsvHash = '1B975A6859AF027A78029ED4189C0CFCC0FC129726D05F95493313FB4688BED1'

if (-not (Test-Path -LiteralPath $k6Path)) {
    throw "k6 binary not found: $k6Path"
}
if (-not $BackendRestartedBeforeRun) {
    throw 'This prepared evidence rerun requires an explicitly documented backend restart and database reseed'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $sourceScript).Hash -ne $approvedScriptHash) {
    throw 'Official Load script hash differs from the approved script'
}
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $sourceCsv).Hash -ne $approvedCsvHash) {
    throw 'Packaged CSV hash differs from the approved CSV'
}

$listener = netstat -ano -p tcp | Select-String -Pattern '^\s*TCP\s+\S+:3000\s+\S+\s+LISTENING\s+(\d+)\s*$' | Select-Object -First 1
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
    $runtimeMarkers = @('raw-results.ndjson', 'summary.json', 'metadata.json') |
        ForEach-Object { Join-Path $runDirectory $_ } |
        Where-Object { Test-Path -LiteralPath $_ }
    if ($runtimeMarkers.Count -gt 0) {
        throw "Evidence directory already contains execution artifacts: $runDirectory"
    }
} else {
    New-Item -ItemType Directory -Path $runDirectory | Out-Null
}
$preparedMarker = Join-Path $runDirectory 'PREPARED-NOT-EXECUTED.md'
if (Test-Path -LiteralPath $preparedMarker) {
    Move-Item -LiteralPath $preparedMarker -Destination (Join-Path $runDirectory 'pre-run-preparation-record.md')
}

$evidenceScript = Join-Path $runDirectory '23127179_Load_20260817.js'
$evidenceCsv = Join-Path $runDirectory 'user_workflow_data.csv'
Copy-Item -LiteralPath $sourceScript -Destination $evidenceScript
Copy-Item -LiteralPath $sourceCsv -Destination $evidenceCsv
Copy-Item -LiteralPath (Join-Path $repoRoot 'work\calibration-results\hardware_observation.json') -Destination (Join-Path $runDirectory 'hardware_observation.json')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'official_load_visual_capture_instructions.md') -Destination (Join-Path $runDirectory 'visual_capture_instructions.md')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'official_load_second_run_gui_handoff.md') -Destination (Join-Path $runDirectory 'gui-capture-handoff.md')

$rawPath = Join-Path $runDirectory 'raw-results.ndjson'
$summaryPath = Join-Path $runDirectory 'summary.json'
$stdoutPath = Join-Path $runDirectory 'stdout.txt'
$stderrPath = Join-Path $runDirectory 'stderr.txt'
$htmlDirectory = Join-Path $runDirectory 'html-report'
$htmlPath = Join-Path $htmlDirectory 'index.html'
New-Item -ItemType Directory -Force -Path $htmlDirectory | Out-Null
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
$quotedArguments = $arguments | ForEach-Object {
    if ($_ -match '\s') { '"' + $_ + '"' } else { $_ }
}
$dashboardEnvironment = @(
    '$env:K6_WEB_DASHBOARD="true"',
    '$env:K6_WEB_DASHBOARD_OPEN="false"',
    '$env:K6_WEB_DASHBOARD_PERIOD="1s"',
    '$env:K6_WEB_DASHBOARD_EXPORT="' + $htmlPath + '"'
) -join '; '
$exactCommand = $dashboardEnvironment + '; & "' + $k6Path + '" ' + ($quotedArguments -join ' ')
$exactCommand | Set-Content -LiteralPath (Join-Path $runDirectory 'command.txt') -Encoding utf8

$startedAt = (Get-Date).ToUniversalTime()
$commitHash = (git -C $repoRoot rev-parse HEAD).Trim()
$scriptHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $evidenceScript).Hash
$csvHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $evidenceCsv).Hash
$k6Version = (& $k6Path version | Out-String).Trim()

$preRunMetadata = [ordered]@{
    test_name = '23127179_Load_20260817'
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
    initial_database_state = @{ users = 2; orders = 0; categories = 3; products = 5; matching_run_id_users = 0 }
    script_sha256 = $scriptHash
    csv_sha256 = $csvHash
    raw_output_format = 'k6 newline-delimited JSON'
    html_report_status = 'Planned via the official built-in k6 Web Dashboard export to html-report/index.html.'
    visual_evidence_status = 'Not captured automatically; see visual_capture_instructions.md.'
}
$preRunMetadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $runDirectory 'metadata-pre-run.json') -Encoding utf8

$env:K6_WEB_DASHBOARD = 'true'
$env:K6_WEB_DASHBOARD_OPEN = 'false'
$env:K6_WEB_DASHBOARD_PERIOD = '1s'
$env:K6_WEB_DASHBOARD_EXPORT = $htmlPath
Write-Output "OFFICIAL K6_RUN_ID=$RunId"
Write-Output "OFFICIAL COMMAND=$exactCommand"
Write-Output "HTML REPORT=$htmlPath"
$k6Process = Start-Process -FilePath $k6Path -ArgumentList $arguments -WorkingDirectory $runDirectory -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -WindowStyle Hidden -PassThru
$null = $k6Process.Handle
$logicalProcessors = [Environment]::ProcessorCount
$processSamples = [System.Collections.Generic.List[object]]::new()
$systemSamples = [System.Collections.Generic.List[object]]::new()
$previousCpu = @{}
$lastProgress = -10

function Get-RunPhase {
    param([double]$ElapsedSeconds)
    if ($ElapsedSeconds -lt 60) { return 'ramp_up' }
    if ($ElapsedSeconds -lt 300) { return 'steady_4vu' }
    if ($ElapsedSeconds -lt 360) { return 'ramp_down' }
    return 'graceful_completion'
}

function Add-ProcessSample {
    param(
        [System.Diagnostics.Process]$Process,
        [string]$Role,
        [datetime]$Timestamp,
        [string]$Phase
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
            phase = $Phase
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
    $phase = Get-RunPhase -ElapsedSeconds $elapsedSeconds
    Add-ProcessSample -Process $backendProcess -Role 'backend' -Timestamp $timestamp -Phase $phase
    Add-ProcessSample -Process $k6Process -Role 'k6' -Timestamp $timestamp -Phase $phase

    try {
        $counterSet = Get-Counter '\Processor(_Total)\% Processor Time','\Memory\% Committed Bytes In Use','\PhysicalDisk(_Total)\Disk Bytes/sec','\Network Interface(*)\Bytes Total/sec' -MaxSamples 1
        $counterSamples = $counterSet.CounterSamples
        $cpu = ($counterSamples | Where-Object Path -Like '*\processor(_total)\% processor time' | Select-Object -First 1).CookedValue
        $memory = ($counterSamples | Where-Object Path -Like '*\memory\% committed bytes in use' | Select-Object -First 1).CookedValue
        $disk = ($counterSamples | Where-Object Path -Like '*\physicaldisk(_total)\disk bytes/sec' | Select-Object -First 1).CookedValue
        $network = ($counterSamples | Where-Object Path -Like '*\network interface(*)\bytes total/sec' | Measure-Object CookedValue -Sum).Sum
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $timestamp.ToString('o')
            phase = $phase
            cpu_percent = [math]::Round($cpu, 3)
            committed_memory_percent = [math]::Round($memory, 3)
            disk_bytes_per_second = [math]::Round($disk, 3)
            network_bytes_per_second = [math]::Round($network, 3)
        })
    }
    catch {
        $systemSamples.Add([pscustomobject]@{
            timestamp_utc = $timestamp.ToString('o')
            phase = $phase
            cpu_percent = ''
            committed_memory_percent = ''
            disk_bytes_per_second = ''
            network_bytes_per_second = ''
        })
    }

    if ($elapsedSeconds -ge ($lastProgress + 10)) {
        $liveLine = Get-Content -LiteralPath $stdoutPath -Tail 20 -ErrorAction SilentlyContinue |
            Where-Object { $_ -match '^running \(|^load\s' } |
            Select-Object -Last 1
        Write-Output ("PROGRESS elapsed={0:N0}s phase={1}" -f $elapsedSeconds, $phase)
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
Remove-Item Env:K6_WEB_DASHBOARD,Env:K6_WEB_DASHBOARD_OPEN,Env:K6_WEB_DASHBOARD_PERIOD,Env:K6_WEB_DASHBOARD_EXPORT -ErrorAction SilentlyContinue
$processSamples | Export-Csv -LiteralPath (Join-Path $runDirectory 'process-resources.csv') -NoTypeInformation -Encoding utf8
$systemSamples | Export-Csv -LiteralPath (Join-Path $runDirectory 'system-resources.csv') -NoTypeInformation -Encoding utf8

$finalMetadata = [ordered]@{
    test_name = '23127179_Load_20260817'
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
    csv_sha256 = $csvHash
    raw_output_exists = (Test-Path -LiteralPath $rawPath)
    raw_output_bytes = if (Test-Path -LiteralPath $rawPath) { (Get-Item -LiteralPath $rawPath).Length } else { 0 }
    summary_exists = (Test-Path -LiteralPath $summaryPath)
    process_resource_samples = $processSamples.Count
    system_resource_samples = $systemSamples.Count
    html_report_status = if (Test-Path -LiteralPath $htmlPath) { 'Generated by the official built-in k6 Web Dashboard export.' } else { 'Expected Web Dashboard HTML report is missing.' }
    html_report_exists = (Test-Path -LiteralPath $htmlPath)
    html_report_bytes = if (Test-Path -LiteralPath $htmlPath) { (Get-Item -LiteralPath $htmlPath).Length } else { 0 }
    visual_evidence_status = 'Not captured automatically; see visual_capture_instructions.md.'
}
$finalMetadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $runDirectory 'metadata.json') -Encoding utf8
$finalMetadata | ConvertTo-Json -Depth 5
