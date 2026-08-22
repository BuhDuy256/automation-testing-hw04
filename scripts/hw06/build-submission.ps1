param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9]{3}$')]
    [string]$Grade
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$outPath = (Resolve-Path (Join-Path $repoRoot 'out')).Path
$expectedOutPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot 'out'))
if ($outPath -ne $expectedOutPath) {
    throw "Resolved out path is outside the expected repository location: $outPath"
}

Push-Location $repoRoot
try {
    node scripts/hw06/derive.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Derived artefact generation failed.' }

    git log --date=iso-strict --pretty=format:'%H | %ad | %s' | Set-Content -Encoding utf8 'out/git-commit-log.txt'

    node scripts/hw06/validate.mjs --submission
    if ($LASTEXITCODE -ne 0) { throw 'Submission validation failed; no ZIP was created.' }

    $zipName = "23127179_HW06_AI_API_${Grade}.zip"
    $zipPath = Join-Path $outPath $zipName
    if (Test-Path -LiteralPath $zipPath) {
        throw "Refusing to overwrite existing submission ZIP: $zipPath"
    }

    $manifestPath = Join-Path $outPath 'submission-manifest.sha256'
    $manifestLines = Get-ChildItem -LiteralPath $outPath -Recurse -File |
        Where-Object { $_.FullName -ne $manifestPath -and $_.Name -notmatch '^23127179_HW06_AI_API_[0-9]{3}\.zip$' } |
        Sort-Object FullName |
        ForEach-Object {
            $outPrefix = $outPath.TrimEnd('\') + '\'
            $relative = $_.FullName.Substring($outPrefix.Length).Replace('\', '/')
            $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            "$hash  $relative"
        }
    $manifestLines | Set-Content -Encoding utf8 -LiteralPath $manifestPath

    $stagingPath = Join-Path ([System.IO.Path]::GetTempPath()) ("hw06-submission-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $stagingPath | Out-Null
    try {
        Get-ChildItem -LiteralPath $outPath -Force |
            Where-Object { $_.Name -notmatch '^23127179_HW06_AI_API_[0-9]{3}\.zip$' } |
            Copy-Item -Destination $stagingPath -Recurse
        Compress-Archive -Path (Join-Path $stagingPath '*') -DestinationPath $zipPath -CompressionLevel Optimal
    }
    finally {
        $resolvedStaging = (Resolve-Path -LiteralPath $stagingPath).Path
        $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        if (-not $resolvedStaging.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove staging path outside temp: $resolvedStaging"
        }
        Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
    }

    $zipHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
    Write-Output "Created: $zipPath"
    Write-Output "SHA256: $zipHash"
}
finally {
    Pop-Location
}
