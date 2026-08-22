param(
    [string]$OutputPath = 'work/generated/git-commit-log.txt'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$absoluteOutput = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputPath))
$repoPrefix = $repoRoot.TrimEnd('\') + '\'
if (-not $absoluteOutput.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Output path escapes repository: $OutputPath"
}
$relativeOutput = $absoluteOutput.Substring($repoPrefix.Length)
$parent = Split-Path -Parent $absoluteOutput
if (-not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
}

Push-Location $repoRoot
try {
    git log --date=iso-strict --pretty=format:'%H | %ad | %s' | Set-Content -Encoding utf8 -LiteralPath $absoluteOutput
    if ($LASTEXITCODE -ne 0) { throw 'git log failed.' }
    Write-Output "Exported Git history to $relativeOutput"
}
finally {
    Pop-Location
}
