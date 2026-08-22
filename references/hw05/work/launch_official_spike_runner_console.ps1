# Visible-console launcher for the ONE official Spike invocation.
# It only names the window and records the runner console transcript.
# The runner invocation below is the approved command, unchanged.

. .\work\disable_console_quickedit.ps1
$Host.UI.RawUI.WindowTitle = 'OFFICIAL-SPIKE-RUNNER 20260817t134816776'
Start-Transcript -LiteralPath 'work\official_spike_runner_console_20260817t134816776.log' | Out-Null

try {
    & .\work\run_official_spike.ps1 `
      -RunId '20260817t134816776' `
      -BackendRestartedBeforeRun $true `
      -GuiCaptureReady $true
}
finally {
    Stop-Transcript | Out-Null
}
