# Run canonical API audit using env vars from an existing integrated terminal session.
# Does not read/write .env or print API keys.
param(
  [int]$TerminalPid = 0,
  [ValidateSet("anthropic", "openai", "gemini")]
  [string]$Provider = "anthropic",
  [int]$Limit = 0,
  [switch]$All,
  [string[]]$Lessons = @()
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $repoRoot

Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class ProcessEnvReader {
  [StructLayout(LayoutKind.Sequential)]
  struct PROCESS_BASIC_INFORMATION {
    public IntPtr Reserved1;
    public IntPtr PebBaseAddress;
    public IntPtr Reserved2_0;
    public IntPtr Reserved2_1;
    public IntPtr UniqueProcessId;
    public IntPtr Reserved3;
  }

  [DllImport("ntdll.dll")]
  static extern int NtQueryInformationProcess(
    IntPtr processHandle, int processInformationClass,
    ref PROCESS_BASIC_INFORMATION processInformation,
    int processInformationLength, out int returnLength);

  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool ReadProcessMemory(
    IntPtr hProcess, IntPtr lpBaseAddress, byte[] lpBuffer,
    int dwSize, out int lpNumberOfBytesRead);

  [DllImport("kernel32.dll", SetLastError = true)]
  static extern IntPtr OpenProcess(int dwDesiredAccess, bool bInheritHandle, int dwProcessId);

  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool CloseHandle(IntPtr hObject);

  const int ProcessBasicInformation = 0;
  const int PROCESS_QUERY_INFORMATION = 0x0400;
  const int PROCESS_VM_READ = 0x0010;

  public static Dictionary<string, string> Read(int pid) {
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    IntPtr hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid);
    if (hProcess == IntPtr.Zero) throw new InvalidOperationException("OpenProcess failed for pid " + pid);

    try {
      var pbi = new PROCESS_BASIC_INFORMATION();
      int retLen;
      if (NtQueryInformationProcess(hProcess, ProcessBasicInformation, ref pbi, Marshal.SizeOf(pbi), out retLen) != 0)
        throw new InvalidOperationException("NtQueryInformationProcess failed");

      IntPtr peb = pbi.PebBaseAddress;
      int ptrSize = IntPtr.Size;
      int processParamsOffset = ptrSize == 8 ? 0x20 : 0x10;
      int environmentOffset = ptrSize == 8 ? 0x80 : 0x48;

      byte[] ptrBuf = new byte[ptrSize];
      if (!ReadProcessMemory(hProcess, IntPtr.Add(peb, processParamsOffset), ptrBuf, ptrSize, out retLen))
        throw new InvalidOperationException("ReadProcessMemory ProcessParameters failed");

      IntPtr processParameters = ptrSize == 8
        ? new IntPtr(BitConverter.ToInt64(ptrBuf, 0))
        : new IntPtr(BitConverter.ToInt32(ptrBuf, 0));

      if (!ReadProcessMemory(hProcess, IntPtr.Add(processParameters, environmentOffset), ptrBuf, ptrSize, out retLen))
        throw new InvalidOperationException("ReadProcessMemory Environment failed");

      IntPtr envBlock = ptrSize == 8
        ? new IntPtr(BitConverter.ToInt64(ptrBuf, 0))
        : new IntPtr(BitConverter.ToInt32(ptrBuf, 0));

      if (envBlock == IntPtr.Zero) return result;

      const int maxBytes = 262144;
      byte[] envData = new byte[maxBytes];
      if (!ReadProcessMemory(hProcess, envBlock, envData, maxBytes, out retLen) || retLen < 2)
        throw new InvalidOperationException("ReadProcessMemory env block failed");

      var text = Encoding.Unicode.GetString(envData, 0, retLen);
      foreach (var entry in text.Split('\0')) {
        if (string.IsNullOrEmpty(entry)) continue;
        int eq = entry.IndexOf('=');
        if (eq <= 0) continue;
        result[entry.Substring(0, eq)] = entry.Substring(eq + 1);
      }
      return result;
    } finally {
      CloseHandle(hProcess);
    }
  }
}
"@

function Find-TerminalPid {
  # Prefer Cursor integrated terminal hosting shellIntegration.ps1
  $shell = Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -match '^(pwsh|powershell)\.exe$' -and
      $_.CommandLine -match 'shellIntegration\.ps1'
    } |
    Sort-Object ProcessId |
    Select-Object -First 1 -ExpandProperty ProcessId
  if ($shell) { return $shell }
  return 0
}

if ($TerminalPid -le 0) {
  $TerminalPid = Find-TerminalPid
  if (-not $TerminalPid) { throw "No integrated terminal process found for viva-ai-systems. Pass -TerminalPid explicitly." }
}

Write-Host "Using terminal session pid $TerminalPid (env inherited, keys not printed)"

$envMap = [ProcessEnvReader]::Read($TerminalPid)
Write-Host "Env entries read from session: $($envMap.Count)"
if (-not ($envMap.ContainsKey("ANTHROPIC_API_KEY") -or $envMap.ContainsKey("OPENAI_API_KEY") -or $envMap.ContainsKey("GEMINI_API_KEY"))) {
  throw "No AI review API keys found in terminal session $TerminalPid. Set keys in that terminal first."
}
foreach ($key in $envMap.Keys) {
  Set-Item -Path "Env:$key" -Value $envMap[$key]
}
$env:AI_REVIEW_PROVIDER = $Provider

$args = @("scripts/adaptive-canonical/audit-canonical.ts")
if ($All) { $args += "--all" }
elseif ($Limit -gt 0) { $args += @("--limit", "$Limit") }
elseif ($Lessons.Count -gt 0) { $args += @("--lessons", ($Lessons -join ",")) }
else { throw "Specify -Limit, -All, or -Lessons" }

& bun @args
exit $LASTEXITCODE
