param(
    [string]$RunnerPath = (Join-Path $PSScriptRoot 'run_official_soak.ps1'),
    [string]$RunId = '20260817t225458219'
)

# Preflight-only regression validation for the Soak reservation marker guard.
#
# This script sends no EShop request, starts no k6 process, and reads no network resource.
# It exists because Windows PowerShell 5.1 parses a UTF-8-without-BOM .ps1 using the ANSI
# code page. Any Unicode punctuation inside a machine-critical string literal is therefore
# corrupted at parse time and can never match a correctly decoded file. Machine-critical
# tokens must stay ASCII-only; human-readable prose may not be used as a guard.
#
# The guard is executed from the runner's own source bytes, not from a re-typed copy, so a
# reintroduced Unicode literal is genuinely detected rather than assumed away.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$markerPath = Join-Path $repoRoot ('out\23127179_Soak_20260817_evidence\' + $RunId + '\PREPARATION.md')
$workDirectory = Join-Path ([IO.Path]::GetTempPath()) ('soak-marker-validation-' + [guid]::NewGuid().ToString('N'))
$results = [System.Collections.Generic.List[object]]::new()
$failures = 0

function Add-Result {
    param([string]$Name, [bool]$Passed, [string]$Detail)
    $script:results.Add([pscustomobject]@{ Check = $Name; Result = $(if ($Passed) { 'PASS' } else { 'FAIL' }); Detail = $Detail })
    if (-not $Passed) { $script:failures += 1 }
}

function Get-NonAsciiReport {
    param([string]$Path)
    $bytes = [IO.File]::ReadAllBytes($Path)
    $offending = @($bytes | Where-Object { $_ -gt 127 })
    return $offending.Count
}

function New-Marker {
    param([string]$Path, [string]$Token, [string]$MarkerRunId)
    $text = @(
        '# Official Soak Invocation Reservation',
        '',
        ('Status: **' + $Token + '**'),
        '',
        ('- Machine status token: `' + $Token + '`'),
        ('- Reserved `K6_RUN_ID`: `' + $MarkerRunId + '`')
    ) -join "`n"
    [IO.File]::WriteAllBytes($Path, (New-Object Text.UTF8Encoding($false)).GetBytes($text + "`n"))
}

function Invoke-GuardHarness {
    param([string]$GuardSource, [string]$MarkerFile, [string]$HarnessRunId, [string]$Label)
    $harnessPath = Join-Path $workDirectory ($Label + '.ps1')
    $harness = @(
        'param([string]$MarkerPath,[string]$RunId)',
        '$ErrorActionPreference = ''Stop''',
        '$preparationText = [IO.File]::ReadAllText($MarkerPath)',
        $GuardSource,
        'Write-Output ''GUARD_PASS'''
    ) -join "`n"
    # Written BOM-less on purpose: this reproduces exactly how Windows PowerShell 5.1 reads
    # the real runner file, which is the condition the regression is about.
    [IO.File]::WriteAllBytes($harnessPath, (New-Object Text.UTF8Encoding($false)).GetBytes($harness + "`n"))
    $stdout = Join-Path $workDirectory ($Label + '.out')
    $stderr = Join-Path $workDirectory ($Label + '.err')
    $process = Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $harnessPath, '-MarkerPath', $MarkerFile, '-RunId', $HarnessRunId `
        -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    # Cast to [string]: a $null left operand makes -match/-notmatch return an empty
    # collection rather than $true, which would silently break every negative assertion.
    return [pscustomobject]@{
        ExitCode = $process.ExitCode
        Output = [string](Get-Content -LiteralPath $stdout -Raw -ErrorAction SilentlyContinue)
        Error = [string](Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue)
        HarnessPath = $harnessPath
    }
}

New-Item -ItemType Directory -Force -Path $workDirectory | Out-Null
try {
    # --- Check 1: Soak PowerShell helpers contain no non-ASCII bytes at all. ---
    foreach ($helper in @('run_official_soak.ps1', 'capture_official_soak_frames.ps1', 'soak_resource_monitor_pane.ps1')) {
        $helperPath = Join-Path $PSScriptRoot $helper
        $count = Get-NonAsciiReport -Path $helperPath
        Add-Result -Name ('ASCII_ONLY_' + $helper) -Passed ($count -eq 0) -Detail ("non-ASCII bytes: $count")
    }

    # --- Check 2: extract the real guard from the runner's own source. ---
    $runnerText = [IO.File]::ReadAllText($RunnerPath)
    $guardMatch = [regex]::Match(
        $runnerText,
        '(?ms)^\s*\$preparationToken\s*=.*?^\s*\}\s*$'
    )
    Add-Result -Name 'GUARD_BLOCK_EXTRACTED' -Passed $guardMatch.Success -Detail 'located $preparationToken guard in runner source'
    if (-not $guardMatch.Success) { throw 'Could not extract the reservation guard from the runner source' }
    $guardSource = $guardMatch.Value
    Add-Result -Name 'GUARD_SOURCE_ASCII_ONLY' `
        -Passed (-not ($guardSource.ToCharArray() | Where-Object { [int]$_ -gt 127 })) `
        -Detail 'extracted guard contains no Unicode punctuation'

    # --- Check 3: the real reserved marker still declares prepared-not-executed. ---
    $realMarkerText = [IO.File]::ReadAllText($markerPath)
    Add-Result -Name 'REAL_MARKER_HAS_ASCII_TOKEN' -Passed ($realMarkerText -match 'PREPARED-NOT-EXECUTED') -Detail $markerPath
    Add-Result -Name 'REAL_MARKER_HAS_RUN_ID' -Passed ($realMarkerText -match [regex]::Escape($RunId)) -Detail $RunId

    # --- Check 4: the real guard accepts the real reserved directory under PS 5.1. ---
    $valid = Invoke-GuardHarness -GuardSource $guardSource -MarkerFile $markerPath -HarnessRunId $RunId -Label 'valid'
    Add-Result -Name 'GUARD_ACCEPTS_REAL_PREPARED_MARKER' `
        -Passed (($valid.ExitCode -eq 0) -and ($valid.Output -match 'GUARD_PASS')) `
        -Detail ("exit=$($valid.ExitCode)")

    # --- Check 5: a marker missing the token is still rejected. ---
    $missingTokenMarker = Join-Path $workDirectory 'missing-token.md'
    New-Marker -Path $missingTokenMarker -Token 'ALREADY EXECUTED' -MarkerRunId $RunId
    $missingToken = Invoke-GuardHarness -GuardSource $guardSource -MarkerFile $missingTokenMarker -HarnessRunId $RunId -Label 'missingtoken'
    Add-Result -Name 'GUARD_REJECTS_MISSING_TOKEN' `
        -Passed (($missingToken.ExitCode -ne 0) -and ($missingToken.Output -notmatch 'GUARD_PASS')) `
        -Detail ("exit=$($missingToken.ExitCode)")

    # --- Check 6: a marker for a different Run ID is still rejected. ---
    $wrongRunIdMarker = Join-Path $workDirectory 'wrong-runid.md'
    New-Marker -Path $wrongRunIdMarker -Token 'PREPARED-NOT-EXECUTED' -MarkerRunId 'someotherrunid99'
    $wrongRunId = Invoke-GuardHarness -GuardSource $guardSource -MarkerFile $wrongRunIdMarker -HarnessRunId $RunId -Label 'wrongrunid'
    Add-Result -Name 'GUARD_REJECTS_WRONG_RUN_ID' `
        -Passed (($wrongRunId.ExitCode -ne 0) -and ($wrongRunId.Output -notmatch 'GUARD_PASS')) `
        -Detail ("exit=$($wrongRunId.ExitCode)")

    # --- Check 7: prove the validation actually detects the original defect. ---
    # The pre-fix guard compared against a Unicode em dash. Reproduced here from an escape
    # sequence so this validation file itself stays ASCII-only.
    $emDash = [char]0x2014
    $legacyGuard = @(
        ('$legacyToken = ''PREPARED ' + $emDash + ' NOT EXECUTED'''),
        'if ($preparationText -notmatch [regex]::Escape($legacyToken) -or $preparationText -notmatch [regex]::Escape($RunId)) {',
        '    throw "Reserved Soak directory marker is invalid for Run ID $RunId"',
        '}'
    ) -join "`n"
    $legacyMarker = Join-Path $workDirectory 'legacy-unicode.md'
    $legacyText = ('Status: **PREPARED ' + $emDash + ' NOT EXECUTED**' + "`n" + '- Reserved K6_RUN_ID: ' + $RunId + "`n")
    [IO.File]::WriteAllBytes($legacyMarker, (New-Object Text.UTF8Encoding($false)).GetBytes($legacyText))
    $legacy = Invoke-GuardHarness -GuardSource $legacyGuard -MarkerFile $legacyMarker -HarnessRunId $RunId -Label 'legacyunicode'
    Add-Result -Name 'VALIDATION_DETECTS_ORIGINAL_UNICODE_DEFECT' `
        -Passed (($legacy.ExitCode -ne 0) -and ($legacy.Output -notmatch 'GUARD_PASS')) `
        -Detail 'a Unicode-dependent guard still fails on a correct marker, so this test has teeth'

    # --- Check 8: nothing in this validation can produce traffic. ---
    $selfText = [IO.File]::ReadAllText($MyInvocation.MyCommand.Path)
    $harnessFiles = Get-ChildItem -LiteralPath $workDirectory -Filter '*.ps1' -ErrorAction SilentlyContinue
    $harnessText = ($harnessFiles | ForEach-Object { [IO.File]::ReadAllText($_.FullName) }) -join "`n"
    Add-Result -Name 'HARNESS_HAS_NO_NETWORK_CALL' `
        -Passed ($harnessText -notmatch 'Invoke-WebRequest|Invoke-RestMethod|http://|https://|k6') `
        -Detail 'generated guard harnesses contain no HTTP or k6 reference'
    Add-Result -Name 'VALIDATION_STARTS_NO_K6' `
        -Passed ($null -eq (Get-Process k6 -ErrorAction SilentlyContinue)) `
        -Detail 'no k6 process is running'
    Add-Result -Name 'VALIDATION_IS_PREFLIGHT_ONLY' `
        -Passed ($selfText -notmatch 'run_official_soak\.ps1''\s*\)?\s*-RunId') `
        -Detail 'this validation never invokes the official runner end to end'
}
finally {
    Remove-Item -LiteralPath $workDirectory -Recurse -Force -ErrorAction SilentlyContinue
}

$results | Format-Table -AutoSize | Out-String -Width 160 | Write-Output
if ($failures -gt 0) {
    Write-Output "SOAK_MARKER_VALIDATION=FAIL failures=$failures"
    exit 1
}
Write-Output 'SOAK_MARKER_VALIDATION=PASS'
Write-Output 'No EShop request was sent and no k6 process was started.'
