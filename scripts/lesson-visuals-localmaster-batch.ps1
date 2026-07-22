# LocalMaster Method 1+4 batch runner (wraps bun script).
# Usage:
#   pwsh scripts/lesson-visuals-localmaster-batch.ps1 -MaxCells 40 -BatchSize 20
param(
  [int]$MaxCells = 0,
  [int]$BatchSize = 20,
  [int]$Offset = 0
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot/..
$argsList = @("run", "scripts/lesson-visuals-localmaster-batch.ts", "--batch-size=$BatchSize", "--offset=$Offset")
if ($MaxCells -gt 0) { $argsList += "--max-cells=$MaxCells" }
& bun @argsList
exit $LASTEXITCODE
