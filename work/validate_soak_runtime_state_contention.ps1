param(
    [string]$RuntimeStateIoPath = (Join-Path $PSScriptRoot 'soak_runtime_state_io.ps1'),
    [ValidateRange(5, 60)][int]$DurationSeconds = 15
)

# Offline Windows PowerShell 5.1 regression for concurrent runtime-state publishing/reading.
# It creates temporary local files only. It sends no network request and starts no k6 process.

$ErrorActionPreference = 'Stop'
$testDirectory = Join-Path ([IO.Path]::GetTempPath()) ('soak-runtime-state-test-' + [guid]::NewGuid().ToString('N'))
$statePath = Join-Path $testDirectory 'runtime-state.json'
$stopPath = Join-Path $testDirectory 'stop.signal'
$readerResultPaths = 1..3 | ForEach-Object { Join-Path $testDirectory ("reader-$_.json") }
$writerResultPath = Join-Path $testDirectory 'writer.json'
$lockResultPath = Join-Path $testDirectory 'lock.json'
$jobs = @()

New-Item -ItemType Directory -Path $testDirectory | Out-Null
try {
    . $RuntimeStateIoPath
    $initial = [ordered]@{ sequence = 0; payload = 'state-0'; checksum = 0 } | ConvertTo-Json -Compress
    Publish-SoakRuntimeState -Path $statePath -Json $initial

    $readerScript = {
        param($StatePath, $StopPath, $ResultPath)
        $valid = 0
        $sharingRetries = 0
        $invalid = 0
        while (-not (Test-Path -LiteralPath $StopPath)) {
            try {
                $text = [IO.File]::ReadAllText($StatePath)
                $state = $text | ConvertFrom-Json -ErrorAction Stop
                if ($state.payload -ne ('state-' + $state.sequence) -or [int]$state.checksum -ne ([int]$state.sequence * 17)) {
                    $invalid += 1
                }
                else {
                    $valid += 1
                }
            }
            catch [IO.IOException] {
                $sharingRetries += 1
            }
            catch {
                $invalid += 1
            }
            Start-Sleep -Milliseconds 2
        }
        [IO.File]::WriteAllText($ResultPath, (@{ valid = $valid; sharing_retries = $sharingRetries; invalid = $invalid } | ConvertTo-Json -Compress))
    }

    $writerScript = {
        param($HelperPath, $StatePath, $StopPath, $ResultPath)
        $ErrorActionPreference = 'Stop'
        . $HelperPath
        $published = 0
        $failures = 0
        $sequence = 1
        while (-not (Test-Path -LiteralPath $StopPath)) {
            try {
                $json = [ordered]@{
                    sequence = $sequence
                    payload = 'state-' + $sequence
                    checksum = $sequence * 17
                } | ConvertTo-Json -Compress
                Publish-SoakRuntimeState -Path $StatePath -Json $json -MaxAttempts 40 -RetryDelayMilliseconds 10
                $published += 1
                $sequence += 1
            }
            catch {
                $failures += 1
            }
            Start-Sleep -Milliseconds 3
        }
        [IO.File]::WriteAllText($ResultPath, (@{ published = $published; failures = $failures } | ConvertTo-Json -Compress))
    }

    $lockScript = {
        param($StatePath, $StopPath, $ResultPath)
        $locks = 0
        while (-not (Test-Path -LiteralPath $StopPath)) {
            try {
                $stream = New-Object IO.FileStream($StatePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
                try {
                    $locks += 1
                    Start-Sleep -Milliseconds 35
                }
                finally {
                    $stream.Dispose()
                }
            }
            catch [IO.IOException] {
                Start-Sleep -Milliseconds 2
            }
            Start-Sleep -Milliseconds 10
        }
        [IO.File]::WriteAllText($ResultPath, (@{ locks = $locks } | ConvertTo-Json -Compress))
    }

    foreach ($resultPath in $readerResultPaths) {
        $jobs += Start-Job -ScriptBlock $readerScript -ArgumentList $statePath, $stopPath, $resultPath
    }
    $jobs += Start-Job -ScriptBlock $writerScript -ArgumentList $RuntimeStateIoPath, $statePath, $stopPath, $writerResultPath
    $jobs += Start-Job -ScriptBlock $lockScript -ArgumentList $statePath, $stopPath, $lockResultPath

    Start-Sleep -Seconds $DurationSeconds
    [IO.File]::WriteAllText($stopPath, 'stop')
    $null = Wait-Job -Job $jobs -Timeout 30
    $unfinished = @($jobs | Where-Object State -ne 'Completed')
    if ($unfinished.Count -gt 0) {
        throw "Concurrent jobs did not finish: $($unfinished.Count)"
    }

    $writer = Get-Content -LiteralPath $writerResultPath -Raw | ConvertFrom-Json
    $lock = Get-Content -LiteralPath $lockResultPath -Raw | ConvertFrom-Json
    $readers = @($readerResultPaths | ForEach-Object { Get-Content -LiteralPath $_ -Raw | ConvertFrom-Json })
    $validReads = ($readers | Measure-Object valid -Sum).Sum
    $invalidReads = ($readers | Measure-Object invalid -Sum).Sum

    if ([int]$writer.failures -ne 0) { throw "Writer failures: $($writer.failures)" }
    if ([int]$writer.published -lt 50) { throw "Too few successful publishes: $($writer.published)" }
    if ([int]$lock.locks -lt 10) { throw "Transient contention was not exercised: $($lock.locks) locks" }
    if ([int]$validReads -lt 100) { throw "Readers obtained too few valid documents: $validReads" }
    if ([int]$invalidReads -ne 0) { throw "Readers accepted invalid/partial documents: $invalidReads" }

    $beforeInvalidAttempt = [IO.File]::ReadAllText($statePath)
    $invalidRejected = $false
    try {
        Publish-SoakRuntimeState -Path $statePath -Json '{invalid-json' -MaxAttempts 2 -RetryDelayMilliseconds 1
    }
    catch {
        $invalidRejected = $true
    }
    if (-not $invalidRejected) { throw 'Malformed JSON was silently accepted' }
    if ([IO.File]::ReadAllText($statePath) -ne $beforeInvalidAttempt) { throw 'Malformed JSON changed the published state' }

    $leftovers = @(Get-ChildItem -LiteralPath $testDirectory -Filter '.runtime-state-*.tmp' -File)
    if ($leftovers.Count -ne 0) { throw "Temporary files were not cleaned: $($leftovers.Count)" }

    Write-Output 'SOAK_RUNTIME_STATE_CONTENTION=PASS'
    Write-Output "duration_seconds=$DurationSeconds"
    Write-Output "published=$($writer.published)"
    Write-Output "writer_failures=$($writer.failures)"
    Write-Output "reader_valid_documents=$validReads"
    Write-Output "reader_invalid_documents=$invalidReads"
    Write-Output "transient_locks=$($lock.locks)"
    Write-Output 'malformed_json_rejected=True'
    Write-Output 'No EShop request was sent and no k6 process was started.'
}
finally {
    if ($jobs.Count -gt 0) {
        $jobs | Stop-Job -ErrorAction SilentlyContinue
        $jobs | Remove-Job -Force -ErrorAction SilentlyContinue
    }
    Remove-Item -LiteralPath $testDirectory -Recurse -Force -ErrorAction SilentlyContinue
}
