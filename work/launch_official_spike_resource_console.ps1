# Visible-console launcher for the official Spike resource monitor pane.
# It only hardens the console against mark-mode freezing and forwards the
# approved pane arguments unchanged. It creates no measured artifact.

$ErrorActionPreference = 'Stop'
. .\work\disable_console_quickedit.ps1

& .\work\spike_resource_monitor_pane.ps1 `
  -RunId '20260817t134816776' `
  -BackendPid 11976
