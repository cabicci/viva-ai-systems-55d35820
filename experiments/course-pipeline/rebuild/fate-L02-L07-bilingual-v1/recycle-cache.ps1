param([Parameter(Mandatory=$true)][string]$ProjectRoot,[switch]$VerifyOnly)
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath $ProjectRoot).Path
$reportFolder=Join-Path $root 'production\L02-L07-bilingual-v1'
$plan=Get-Content -LiteralPath (Join-Path $reportFolder 'cleanup-plan.json') -Raw | ConvertFrom-Json
$expected=Join-Path $root 'media\review-build-cache'
$receipt=Join-Path $reportFolder 'cleanup-result.json'
if($VerifyOnly){
 if(Test-Path -LiteralPath $expected){throw 'Verify-only expects the original cache to have been recycled'}
 $intent=Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json -AsHashtable
 if($intent.targetRelative -ne 'media/review-build-cache' -or $intent.permanentDeletion){throw 'Mismatching prior recycle intent'}
}else{
$target=(Resolve-Path -LiteralPath $expected).Path
if($target -cne $expected -or -not $target.StartsWith($root+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Resolved cleanup target escaped the verified project'}
if($plan.permanentDeleteAuthorized -or $plan.status -ne 'verified_ready_for_recycle'){throw 'Invalid recycle-only plan'}
$entries=@(Get-ChildItem -LiteralPath $target -Recurse -Force)
if($entries | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }){throw 'Reparse point in cleanup target'}
$actualFiles=@($entries | Where-Object {-not $_.PSIsContainer})
if($actualFiles.Count -ne $plan.fileCount){throw 'Cache changed after review'}
foreach($f in $plan.files){
 $path=Join-Path $target $f.path
 if((Get-Item -LiteralPath $path).Length -ne $f.bytes -or (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256){throw 'Cache preimage changed'}
}
foreach($f in $plan.uniqueSourceFilesPreserved){if((Get-FileHash -LiteralPath (Join-Path $root $f.preserved) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256){throw 'Preserved unique source is missing or changed'}}
Add-Type -AssemblyName Microsoft.VisualBasic
$intent=[ordered]@{status='recycle_requested';targetRelative=$plan.relativeTarget;fileCount=$plan.fileCount;bytes=$plan.bytes;permanentDeletion=$false;utc=[DateTime]::UtcNow.ToString('o')}
$receipt=Join-Path $reportFolder 'cleanup-result.json'
$intent | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receipt -Encoding utf8
[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($target,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin,[Microsoft.VisualBasic.FileIO.UICancelOption]::ThrowException)
if(Test-Path -LiteralPath $target){throw 'Cache remains at original location'}
}
$shell=New-Object -ComObject Shell.Application
$bin=$shell.Namespace(10)
$parent=[IO.Path]::GetDirectoryName($expected)
$found=@($bin.Items() | Where-Object {$_.Name -eq 'review-build-cache' -and $_.ExtendedProperty('System.Recycle.DeletedFrom') -eq $parent})
$verified=$null
foreach($item in $found){
 $trashPath=$item.Path
 if(-not (Test-Path -LiteralPath $trashPath -PathType Container)){continue}
 $files=@(Get-ChildItem -LiteralPath $trashPath -Recurse -Force -File)
 if($files.Count -ne $plan.fileCount){continue}
 $ok=$true
 foreach($f in $plan.files){
  $file=Join-Path $trashPath $f.path
  if(-not (Test-Path -LiteralPath $file -PathType Leaf) -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $f.sha256){$ok=$false;break}
 }
 if($ok){$verified=$trashPath;break}
}
if(-not $verified){$intent.status='original_removed_recycle_location_not_verified';$intent | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receipt -Encoding utf8;throw 'Recycle destination requires verification; no permanent delete fallback was attempted'}
$intent.status='recycled_and_verified'
$intent.observedDeviceLocalRestorePath=$verified
$intent.allRecycledFileHashesMatch=$true
$intent.uniqueSourceCopiesPreserved=$plan.uniqueSourceFilesPreserved.Count
$intent | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receipt -Encoding utf8
Write-Output ('Recycled and hash-verified '+$plan.fileCount+' disposable cache files; '+[Math]::Round($plan.bytes/1MB,2)+' MiB')
