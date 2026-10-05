# NexaTelix: asks for the secret keys, saves them to .env.local and to Vercel, then republishes.
$ErrorActionPreference = "Continue"
Set-Location -LiteralPath $PSScriptRoot
$Host.UI.RawUI.WindowTitle = "NexaTelix - set keys"

function Ask([string]$label, [string]$hint, [bool]$secret, [bool]$optional = $false) {
  Write-Host ""
  Write-Host "  $label" -ForegroundColor Green
  if ($hint) { Write-Host "  $hint" -ForegroundColor DarkGray }
  while ($true) {
    if ($secret) {
      $s = Read-Host "  Paste (right-click to paste, it stays hidden)" -AsSecureString
      $v = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
    } else {
      $v = Read-Host "  Paste"
    }
    $v = $v.Trim()
    if ($v) { return $v }
    if ($optional) { return "" }
    Write-Host "  Nothing pasted, try again." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "  NexaTelix keys. Open Supabase > your project > Project Settings > API Keys (and Data API for the URL)." -ForegroundColor White

$sbUrl  = Ask "1/5  Supabase Project URL"            "Looks like https://abcdxyz.supabase.co" $false
$anon   = Ask "2/5  Supabase anon / publishable key"   "The public key (anon or sb_publishable_...)" $true
$svc    = Ask "3/5  Supabase service_role / secret key" "The secret one (service_role or sb_secret_...). Never share it." $true
$upUrl  = Ask "4/5  Partner panel address (optional - press Enter to skip for now)" "Leave blank to launch the site now; connect sending later" $false $true
$upKey  = Ask "5/5  Partner API key (optional - press Enter to skip for now)"      "Leave blank to launch now; connect sending later" $true $true

$bytes = New-Object byte[] 24
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$dlr = -join ($bytes | ForEach-Object { $_.ToString("x2") })

$vars = [ordered]@{
  "NEXT_PUBLIC_SUPABASE_URL"      = $sbUrl.TrimEnd("/")
  "NEXT_PUBLIC_SUPABASE_ANON_KEY" = $anon
  "SUPABASE_SERVICE_ROLE_KEY"     = $svc
  "NEXT_PUBLIC_SITE_URL"          = "https://nexatelix.com"
  "UPSTREAM_BASE_URL"             = $upUrl.TrimEnd("/")
  "UPSTREAM_API_KEY"              = $upKey
  "DLR_SECRET"                    = $dlr
  "CONTACT_TO"                    = "mulaniom2216@gmail.com"
}

# Keep an existing DLR_SECRET so delivery reports already in flight still arrive.
if (Test-Path ".env.local") {
  $old = Get-Content ".env.local" | Where-Object { $_ -match "^DLR_SECRET=(.+)$" }
  if ($old) { $vars["DLR_SECRET"] = ($old -replace "^DLR_SECRET=", "").Trim() }
}

$lines = $vars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
[IO.File]::WriteAllLines((Join-Path $PSScriptRoot ".env.local"), $lines)
Write-Host ""
Write-Host "  Saved to .env.local" -ForegroundColor Green

cmd /c "npx --yes vercel@latest whoami >nul 2>&1"
if ($LASTEXITCODE -ne 0) {
  Write-Host "  A browser tab will open. Log in to Vercel there, then come back here." -ForegroundColor Yellow
  cmd /c "npx --yes vercel@latest login"
}

Write-Host "  Saving keys to Vercel..." -ForegroundColor White
$tmp = Join-Path $env:TEMP "nx-env.txt"
foreach ($k in $vars.Keys) {
  if (-not $vars[$k]) { Write-Host "    skip  $k (blank for now)" -ForegroundColor DarkGray; continue }
  [IO.File]::WriteAllText($tmp, $vars[$k])
  cmd /c "npx --yes vercel@latest env rm $k production --yes >nul 2>&1"
  cmd /c "npx --yes vercel@latest env add $k production < `"$tmp`" >nul 2>&1"
  if ($LASTEXITCODE -eq 0) { Write-Host "    ok  $k" -ForegroundColor Green } else { Write-Host "    FAILED  $k" -ForegroundColor Red }
}
Remove-Item $tmp -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  Publishing the site with the new keys (1-2 minutes)..." -ForegroundColor White
cmd /c "npx --yes vercel@latest deploy --prod --yes > publish-log.txt 2>&1"
if ($LASTEXITCODE -eq 0) { Write-Host "  Published." -ForegroundColor Green } else { Write-Host "  Publish had a problem, see publish-log.txt" -ForegroundColor Red }
Write-Host ""
Write-Host "  DONE. Tell Claude it finished. Press Enter to close." -ForegroundColor White
Read-Host | Out-Null
