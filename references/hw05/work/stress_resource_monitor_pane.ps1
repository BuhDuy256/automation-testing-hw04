param(
    [Parameter(Mandatory = $true)][string]$RunId,
    [Parameter(Mandatory = $true)][int]$BackendPid
)

# Compact on-screen resource pane for official Stress visual evidence.
# It only displays live Get-Process values; it produces no measured artifact.

$Host.UI.RawUI.WindowTitle = "STRESS-RESOURCE-MONITOR $RunId"
$logicalProcessors = [Environment]::ProcessorCount
$previous = @{}

function Format-Role {
    param([string]$Label, [int]$ProcessId)
    if ($ProcessId -le 0) { return @("$Label", ' pid n/a') }
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        $cpuSeconds = $process.TotalProcessorTime.TotalSeconds
        $now = Get-Date
        $cpuText = '  ..'
        if ($previous.ContainsKey($Label)) {
            $delta = ($now - $previous[$Label].Time).TotalSeconds
            if ($delta -gt 0) {
                $percent = 100 * ($cpuSeconds - $previous[$Label].Cpu) / ($delta * $logicalProcessors)
                $cpuText = ('{0,5:N1}%' -f $percent)
            }
        }
        $previous[$Label] = @{ Time = $now; Cpu = $cpuSeconds }
        return @(
            ("$Label " + $process.ProcessName),
            (' PID  ' + $ProcessId),
            (' CPU ' + $cpuText),
            (' WS  ' + ('{0,6:N0}' -f ($process.WorkingSet64 / 1MB)) + 'MB')
        )
    }
    catch {
        return @("$Label", ' PID  ' + $ProcessId, ' EXITED')
    }
}

while ($true) {
    $k6Process = Get-Process -Name 'k6' -ErrorAction SilentlyContinue | Select-Object -First 1
    $k6Pid = -1
    if ($k6Process) { $k6Pid = $k6Process.Id }

    $output = @()
    $output += 'OFFICIAL STRESS'
    $output += 'RUN_ID'
    $output += $RunId
    $output += ''
    $output += (Get-Date).ToString('HH:mm:ss')
    $output += ''
    $output += (Format-Role -Label 'BACKEND' -ProcessId $BackendPid)
    $output += ''
    $output += (Format-Role -Label 'K6' -ProcessId $k6Pid)

    [Console]::SetCursorPosition(0, 0)
    foreach ($line in $output) {
        Write-Host ($line.PadRight([Math]::Max(1, $Host.UI.RawUI.WindowSize.Width - 1)))
    }
    Start-Sleep -Milliseconds 1000
}
