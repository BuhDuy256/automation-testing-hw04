param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9-]+$')]
    [string]$RunName,

    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 32)]
    [int]$VUs,

    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 100)]
    [int]$IterationsPerVu,

    [Parameter(Mandatory = $true)]
    [bool]$ThinkTime
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$k6Path = Join-Path $PSScriptRoot 'calibration-tools\k6-v2.1.0-windows-amd64\k6.exe'
$scriptPath = Join-Path $PSScriptRoot 'k6_workflow_calibration.js'
$resultsRoot = Join-Path $PSScriptRoot 'calibration-results'
$runDirectory = Join-Path $resultsRoot $RunName

if (-not (Test-Path -LiteralPath $k6Path)) {
    throw "k6 binary not found at $k6Path"
}
if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Calibration script not found at $scriptPath"
}
if (Test-Path -LiteralPath $runDirectory) {
    throw "Calibration result directory already exists: $runDirectory"
}

New-Item -ItemType Directory -Path $runDirectory | Out-Null

$listener = netstat -ano -p tcp | Select-String -Pattern '^\s*TCP\s+\S+:3000\s+\S+\s+LISTENING\s+(\d+)\s*$' | Select-Object -First 1
if (-not $listener) {
    throw 'No backend process is listening on TCP port 3000'
}
$backendPid = [int]$listener.Matches[0].Groups[1].Value
$backendProcess = Get-Process -Id $backendPid

$runId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfff').ToLowerInvariant()
$startedAt = (Get-Date).ToUniversalTime()
$env:BASE_URL = 'http://localhost:3000'
$env:K6_RUN_ID = $runId
$env:CAL_VUS = [string]$VUs
$env:CAL_ITERATIONS = [string]$IterationsPerVu
$env:CAL_THINK_TIME = $ThinkTime.ToString().ToLowerInvariant()

$rawPath = Join-Path $runDirectory 'raw.json'
$summaryPath = Join-Path $runDirectory 'summary.json'
$stdoutPath = Join-Path $runDirectory 'stdout.txt'
$stderrPath = Join-Path $runDirectory 'stderr.txt'
$arguments = @(
    'run',
    '-e', "BASE_URL=$($env:BASE_URL)",
    '-e', "K6_RUN_ID=$runId",
    '-e', "CAL_VUS=$VUs",
    '-e', "CAL_ITERATIONS=$IterationsPerVu",
    '-e', "CAL_THINK_TIME=$($ThinkTime.ToString().ToLowerInvariant())",
    '--summary-export', $summaryPath,
    '--out', "json=$rawPath",
    $scriptPath
)

$k6Process = Start-Process -FilePath $k6Path -ArgumentList $arguments -WorkingDirectory $repoRoot -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -WindowStyle Hidden -PassThru
$null = $k6Process.Handle
$logicalProcessors = [Environment]::ProcessorCount
$samples = [System.Collections.Generic.List[object]]::new()
$previous = @{}

function Add-ProcessSample {
    param(
        [System.Diagnostics.Process]$Process,
        [string]$Role,
        [datetime]$Timestamp
    )

    try {
        $Process.Refresh()
        $cpuSeconds = $Process.TotalProcessorTime.TotalSeconds
        $key = "$Role-$($Process.Id)"
        $cpuPercent = $null
        if ($previous.ContainsKey($key)) {
            $elapsedSeconds = ($Timestamp - $previous[$key].Timestamp).TotalSeconds
            if ($elapsedSeconds -gt 0) {
                $cpuPercent = 100 * ($cpuSeconds - $previous[$key].CpuSeconds) / ($elapsedSeconds * $logicalProcessors)
            }
        }
        $previous[$key] = @{ Timestamp = $Timestamp; CpuSeconds = $cpuSeconds }
        $samples.Add([pscustomobject]@{
            timestamp_utc = $Timestamp.ToString('o')
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
    Add-ProcessSample -Process $backendProcess -Role 'backend' -Timestamp $timestamp
    Add-ProcessSample -Process $k6Process -Role 'k6' -Timestamp $timestamp
    Start-Sleep -Seconds 1
}

$k6Process.WaitForExit()
$k6Process.Refresh()
$exitCode = $k6Process.ExitCode
$endedAt = (Get-Date).ToUniversalTime()
$samples | Export-Csv -LiteralPath (Join-Path $runDirectory 'process-resources.csv') -NoTypeInformation -Encoding utf8

$metadata = [ordered]@{
    run_name = $RunName
    calibration_only = $true
    k6_version = (& $k6Path version | Out-String).Trim()
    run_id = $runId
    vus = $VUs
    iterations_per_vu = $IterationsPerVu
    planned_iterations = $VUs * $IterationsPerVu
    think_time = $ThinkTime
    base_url = $env:BASE_URL
    started_at_utc = $startedAt.ToString('o')
    ended_at_utc = $endedAt.ToString('o')
    elapsed_seconds = [math]::Round(($endedAt - $startedAt).TotalSeconds, 3)
    backend_pid = $backendPid
    k6_pid = $k6Process.Id
    logical_processors_used_for_cpu_normalization = $logicalProcessors
    k6_exit_code = $exitCode
}
$metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $runDirectory 'metadata.json') -Encoding utf8

if ($exitCode -ne 0) {
    throw "k6 calibration failed with exit code $exitCode; inspect $runDirectory"
}

$metadata | ConvertTo-Json -Depth 4
