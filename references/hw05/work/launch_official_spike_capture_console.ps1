# Visible-console launcher for the official Spike rolling capture helper.
# It only names the window and forwards the approved capture arguments unchanged.

$ErrorActionPreference = 'Stop'
. .\work\disable_console_quickedit.ps1
$Host.UI.RawUI.WindowTitle = 'OFFICIAL-SPIKE-CAPTURE 20260817t134816776'

& .\work\capture_official_spike_frames.ps1 `
  -RunId '20260817t134816776' `
  -RunDirectory '.\out\23127179_Spike_20260817_evidence\20260817t134816776' `
  -BackendPid 11976
