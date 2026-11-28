# Publish the plugin to WordPress.org SVN. The owner runs this; svn asks for
# the SVN password (WordPress.org profile -> Account & Security), never typed by Claude.
#
#   powershell -ExecutionPolicy Bypass -File wp-plugin\svn-publish.ps1
#
# What it does:
#   1. checks the plugin build is current (labels copy + version in 4 places);
#   2. checks out (or updates) the SVN repo in C:\projects\wporg-svn\<slug>;
#   3. mirrors the plugin folder into trunk/ and wp-plugin/wporg-assets into assets/;
#   4. shows the change list and waits for Enter;
#   5. commits trunk + assets, then copies trunk to tags/<Stable tag> and commits that.
# Re-running with no changes commits nothing.

$ErrorActionPreference = "Stop"
$Slug = "belgradebest-countdown-for-expo-2027-belgrade"
$Url  = "https://plugins.svn.wordpress.org/$Slug"
$User = "litocreative"
$Repo = Split-Path -Parent $PSScriptRoot
$Src  = Join-Path $PSScriptRoot $Slug
$Art  = Join-Path $PSScriptRoot "wporg-assets"
$Work = "C:\projects\wporg-svn\$Slug"

function Invoke-Svn { & svn @args; if ($LASTEXITCODE -ne 0) { throw "svn $($args[0]) failed" } }

Push-Location $Repo
node wp-plugin/build-plugin.mjs --check
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Build check failed: run node wp-plugin/build-plugin.mjs first." }
Pop-Location

$Version = (Select-String -Path (Join-Path $Src "readme.txt") -Pattern '^Stable tag:\s*(\S+)').Matches[0].Groups[1].Value
Write-Host "Publishing $Slug version $Version" -ForegroundColor Cyan

if (Test-Path (Join-Path $Work ".svn")) {
  Invoke-Svn update $Work
} else {
  New-Item -ItemType Directory -Force (Split-Path $Work) | Out-Null
  Invoke-Svn checkout $Url $Work --username $User
}
foreach ($d in "trunk","tags","assets") { if (-not (Test-Path "$Work\$d")) { New-Item -ItemType Directory "$Work\$d" | Out-Null } }

# Mirror files (robocopy exit codes below 8 mean success).
robocopy $Src "$Work\trunk" /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy trunk failed" }
robocopy $Art "$Work\assets" /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy assets failed" }

Push-Location $Work
try {
  Invoke-Svn add --force --quiet trunk assets tags
  # Files removed from the source: schedule them for deletion.
  svn status | Where-Object { $_ -match '^!\s+(.+)$' } | ForEach-Object { Invoke-Svn delete --quiet $Matches[1] }
  # PNGs must be served as images on the directory pages.
  Get-ChildItem assets -Filter *.png | ForEach-Object { Invoke-Svn propset --quiet svn:mime-type image/png $_.FullName }

  $Changes = svn status
  if ($Changes) {
    Write-Host "`nChanges to commit:" -ForegroundColor Cyan
    $Changes | ForEach-Object { Write-Host "  $_" }
    Read-Host "`nPress Enter to commit trunk + assets (Ctrl+C to stop)"
    Invoke-Svn commit -m "Release $Version" --username $User
  } else {
    Write-Host "trunk and assets are already up to date." -ForegroundColor Green
  }

  cmd /c "svn ls $Url/tags/$Version >nul 2>&1"
  if ($LASTEXITCODE -eq 0) {
    Write-Host "tags/$Version already exists - not re-tagging." -ForegroundColor Yellow
  } else {
    Invoke-Svn update
    Invoke-Svn copy trunk "tags/$Version"
    Invoke-Svn commit -m "Tag $Version" --username $User
  }
} finally { Pop-Location }

Write-Host "`nDone. Listing: https://wordpress.org/plugins/$Slug/ (search results can take up to 72 h)." -ForegroundColor Green
