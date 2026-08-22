# Disables console QuickEdit/mouse input for the current console.
# A stray click in QuickEdit mode enters mark mode and blocks console writes,
# which would freeze a live Spike pane or stall the runner sampling loop.

if (-not ('Spike.ConsoleMode' -as [type])) {
    Add-Type -Name 'ConsoleMode' -Namespace 'Spike' -MemberDefinition @'
[DllImport("kernel32.dll", SetLastError=true)]
public static extern System.IntPtr GetStdHandle(int nStdHandle);
[DllImport("kernel32.dll", SetLastError=true)]
public static extern bool GetConsoleMode(System.IntPtr hConsoleHandle, out uint lpMode);
[DllImport("kernel32.dll", SetLastError=true)]
public static extern bool SetConsoleMode(System.IntPtr hConsoleHandle, uint dwMode);
'@
}

$handle = [Spike.ConsoleMode]::GetStdHandle(-10)   # STD_INPUT_HANDLE
$mode = 0
if ([Spike.ConsoleMode]::GetConsoleMode($handle, [ref]$mode)) {
    $desired = ($mode -band (-bnot 0x0040)) -band (-bnot 0x0010)   # clear QUICK_EDIT and MOUSE_INPUT
    $desired = $desired -bor 0x0080                                 # keep EXTENDED_FLAGS so the change applies
    $null = [Spike.ConsoleMode]::SetConsoleMode($handle, $desired)
}
