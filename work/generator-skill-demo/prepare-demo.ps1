[CmdletBinding()]
param(
    [string]$RunId
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

if ([string]::IsNullOrWhiteSpace($RunId)) {
    $RunId = 'DEMO-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
}

if ($RunId -notmatch '^[A-Za-z0-9_-]+$') {
    throw 'RunId may contain only letters, numbers, underscores, and hyphens.'
}

$demoRoot = Join-Path $repoRoot 'work\trash\generator-skill-demo'
$runDir = Join-Path $demoRoot $RunId
$inputDir = Join-Path $runDir 'input'
$outputDir = Join-Path $runDir 'output'
$promptPath = Join-Path $runDir 'RUN_PROMPT.md'

if (Test-Path -LiteralPath $runDir) {
    throw "Demo run already exists: $runDir"
}

$sourceFiles = [ordered]@{
    'fr04-verified-spec.md' = Join-Path $repoRoot 'out\sources\fr04-verified-spec.md'
    'eshop-requirements.md' = Join-Path $repoRoot 'out\sources\eshop-requirements.md'
    'eshop-api-specification.md' = Join-Path $repoRoot 'out\sources\eshop-api-specification.md'
    'hw06-api-test-generator-SKILL.md' = Join-Path $repoRoot '.codex\skills\hw06-api-test-generator\SKILL.md'
}

foreach ($sourcePath in $sourceFiles.Values) {
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "Required demo input is missing: $sourcePath"
    }
}

New-Item -ItemType Directory -Path $inputDir -Force | Out-Null
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

foreach ($entry in $sourceFiles.GetEnumerator()) {
    Copy-Item -LiteralPath $entry.Value -Destination (Join-Path $inputDir $entry.Key)
}

Set-Content -LiteralPath (Join-Path $inputDir 'existing-coverage.md') -Encoding utf8 -Value @(
    '# Existing Coverage'
    ''
    'None. This disposable demonstration starts from an empty coverage set.'
)

$templatePath = Join-Path $PSScriptRoot 'demo-prompt.template.md'
$prompt = Get-Content -Raw -LiteralPath $templatePath
$relativeRunDir = 'work/trash/generator-skill-demo/' + $RunId
$prompt = $prompt.Replace('{{DEMO_RUN_ID}}', $RunId)
$prompt = $prompt.Replace('{{DEMO_RUN_DIR}}', $relativeRunDir)
Set-Content -LiteralPath $promptPath -Encoding utf8 -Value $prompt

Write-Output "Demo run prepared: $runDir"
Write-Output "Paste this file into a fresh AI session: $promptPath"
Write-Output "Generated results must remain in: $outputDir"
