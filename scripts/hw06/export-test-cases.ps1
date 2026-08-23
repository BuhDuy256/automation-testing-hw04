param(
    [string]$OutputPath = 'out/test-cases.xlsx'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$resolvedOutput = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputPath))
$expectedOut = [System.IO.Path]::GetFullPath((Join-Path $repoRoot 'out'))
if (-not $resolvedOutput.StartsWith($expectedOut + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Output must remain inside out/: $resolvedOutput"
}

function Read-JsonFile([string]$RelativePath) {
    return Get-Content -Raw -LiteralPath (Join-Path $repoRoot $RelativePath) | ConvertFrom-Json
}

function Escape-Xml([object]$Value) {
    if ($null -eq $Value) { return '' }
    return [System.Security.SecurityElement]::Escape([string]$Value)
}

function Cell([object]$Value, [string]$Style = '') {
    $styleAttribute = if ($Style) { " s=`"$Style`"" } else { '' }
    return "<c t=`"inlineStr`"$styleAttribute><is><t xml:space=`"preserve`">$(Escape-Xml $Value)</t></is></c>"
}

function Row([object[]]$Values, [string]$Style = '') {
    return '<row>' + (($Values | ForEach-Object { Cell $_ $Style }) -join '') + '</row>'
}

$project = Read-JsonFile 'work/registry/project.json'
$caseRegistry = Read-JsonFile 'work/registry/test-cases.json'
$reviewRegistry = Read-JsonFile 'work/registry/human-reviews.json'
$runRegistry = Read-JsonFile 'work/registry/runs.json'
$bugRegistry = Read-JsonFile 'work/registry/bugs.json'
$summary = Read-JsonFile 'work/generated/test-summary.json'

$reviewByCase = @{}
foreach ($review in $reviewRegistry.reviews) { $reviewByCase[$review.caseId] = $review }
$latestByCase = @{}
$orderedRuns = $runRegistry.runs | Sort-Object { if ($_.completedAtUtc) { [DateTime]$_.completedAtUtc } else { [DateTime]$_.startedAtUtc } }
foreach ($run in $orderedRuns) {
    foreach ($result in @($run.caseResults)) {
        $latestByCase[$result.caseId] = [pscustomobject]@{
            Result = $result.result
            Classification = $result.classification
            RunId = $run.id
        }
    }
}
$bugsByCase = @{}
foreach ($bug in $bugRegistry.bugs) {
    foreach ($caseId in @($bug.caseIds)) {
        if (-not $bugsByCase.ContainsKey($caseId)) { $bugsByCase[$caseId] = @() }
        $bugsByCase[$caseId] += $bug.id
    }
}

$summaryRows = @()
$summaryRows += Row @('HW06-AI API Testing Summary') '2'
$summaryRows += Row @('Student', $project.student.name)
$summaryRows += Row @('Student ID', $project.student.id)
$summaryRows += Row @('Class', $project.student.class)
$summaryRows += Row @('Selected APIs', $summary.selectedApiCount)
$summaryRows += Row @('AI-generated cases', $summary.totals.aiGenerated)
$summaryRows += Row @('Human-added cases', $summary.totals.humanAdded)
$summaryRows += Row @('Executable cases', $summary.totals.executable)
$summaryRows += Row @('Executed cases', $summary.totals.executed)
$summaryRows += Row @('Raw PASS results', $summary.totals.passed)
$summaryRows += Row @('FAIL results', $summary.totals.failed)
$summaryRows += Row @('Published bugs', $summary.bugCount)
$summaryRows += Row @('')
$summaryRows += Row @('Feature', 'Endpoint', 'AI Generated', 'Human Added', 'Audited', 'Executable', 'Executed', 'Raw Pass', 'Fail', 'Known-Bug Failures', 'Other Failures') '1'
foreach ($api in $summary.apis) {
    $summaryRows += Row @($api.feature, $api.endpoint, $api.aiGenerated, $api.humanAdded, $api.audited, $api.executable, $api.executed, $api.passed, $api.failed, $api.knownBugFailures, $api.otherFailures)
}
$summaryRows += Row @('Interpretation note', 'FR-15 raw PASS count includes 15 PASS-shaped SPEC-GAP observations; authoritative FR-15 results are 16 PASS, 28 FAIL, and 15 SPEC-GAP.')

$caseRows = @()
$caseRows += Row @('Case ID', 'API', 'Origin', 'Title', 'Preconditions', 'Request', 'Expected', 'Basis', 'Coverage', 'Requirement Refs', 'Human Verdict', 'Human Reasoning', 'Human Correction', 'Latest Result', 'Classification', 'Run ID', 'Mapped Bugs') '1'
foreach ($testCase in $caseRegistry.cases) {
    $review = $reviewByCase[$testCase.id]
    $latest = $latestByCase[$testCase.id]
    $caseRows += Row @(
        $testCase.id,
        $testCase.apiId,
        $testCase.origin,
        $testCase.title,
        $testCase.preconditions,
        $testCase.request,
        $testCase.expected,
        $testCase.basis,
        (@($testCase.coverage) -join ', '),
        (@($testCase.requirementRefs) -join ', '),
        $(if ($review) { $review.verdict } elseif ($testCase.origin -eq 'HUMAN') { 'HUMAN-ADDED' } else { '' }),
        $(if ($review) { $review.reasoning } else { '' }),
        $(if ($review) { $review.correction } else { $testCase.humanExtensionRationale }),
        $(if ($latest) { $latest.Result } else { 'NOT EXECUTABLE / NOT RUN' }),
        $(if ($latest) { $latest.Classification } else { '' }),
        $(if ($latest) { $latest.RunId } else { '' }),
        (@($bugsByCase[$testCase.id]) -join ', ')
    )
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('hw06-xlsx-' + [guid]::NewGuid().ToString('N'))
$xlPath = Join-Path $tempRoot 'xl'
New-Item -ItemType Directory -Path (Join-Path $tempRoot '_rels'), (Join-Path $xlPath '_rels'), (Join-Path $xlPath 'worksheets') -Force | Out-Null
try {
    @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
'@ | Set-Content -Encoding utf8 -LiteralPath (Join-Path $tempRoot '[Content_Types].xml')
    @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
'@ | Set-Content -Encoding utf8 -LiteralPath (Join-Path $tempRoot '_rels\.rels')
    @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Summary" sheetId="1" r:id="rId1"/><sheet name="Test Cases" sheetId="2" r:id="rId2"/></sheets>
</workbook>
'@ | Set-Content -Encoding utf8 -LiteralPath (Join-Path $xlPath 'workbook.xml')
    @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@ | Set-Content -Encoding utf8 -LiteralPath (Join-Path $xlPath '_rels\workbook.xml.rels')
    @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>
</styleSheet>
'@ | Set-Content -Encoding utf8 -LiteralPath (Join-Path $xlPath 'styles.xml')
    ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="12" width="22" customWidth="1"/></cols><sheetData>' + ($summaryRows -join '') + '</sheetData></worksheet>') | Set-Content -Encoding utf8 -LiteralPath (Join-Path $xlPath 'worksheets\sheet1.xml')
    ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="3" width="18" customWidth="1"/><col min="4" max="17" width="32" customWidth="1"/></cols><sheetData>' + ($caseRows -join '') + '</sheetData><autoFilter ref="A1:Q181"/></worksheet>') | Set-Content -Encoding utf8 -LiteralPath (Join-Path $xlPath 'worksheets\sheet2.xml')

    if (Test-Path -LiteralPath $resolvedOutput) { Remove-Item -LiteralPath $resolvedOutput -Force }
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $outputStream = [System.IO.File]::Open($resolvedOutput, [System.IO.FileMode]::CreateNew)
    try {
        $archive = New-Object System.IO.Compression.ZipArchive($outputStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
        try {
            foreach ($sourceFile in Get-ChildItem -LiteralPath $tempRoot -Recurse -File) {
                $entryName = $sourceFile.FullName.Substring($tempRoot.Length + 1).Replace('\', '/')
                $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
                $entryStream = $entry.Open()
                $inputStream = [System.IO.File]::OpenRead($sourceFile.FullName)
                try { $inputStream.CopyTo($entryStream) }
                finally { $inputStream.Dispose(); $entryStream.Dispose() }
            }
        }
        finally { $archive.Dispose() }
    }
    finally { $outputStream.Dispose() }
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        $resolvedTemp = (Resolve-Path -LiteralPath $tempRoot).Path
        $systemTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        if (-not $resolvedTemp.StartsWith($systemTemp, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe temp path: $resolvedTemp" }
        Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
    }
}

Write-Output "Created $resolvedOutput"
