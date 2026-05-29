# Run admin migration endpoint in dry-run mode and save JSON output
# Requirements:
# - ADMIN_MAINTENANCE_KEY env var must be set
# - Optional: API_BASE_URL env var (defaults to http://localhost:3000)

$adminKey = $env:ADMIN_MAINTENANCE_KEY
if (-not $adminKey) {
  Write-Error "ADMIN_MAINTENANCE_KEY is not set. Set it first and retry."
  exit 1
}

$base = $env:API_BASE_URL
if (-not $base) { $base = "http://localhost:3000" }

$uri = "$base/api/admin/migrate-uploads?dryRun=1"
Write-Output "Calling: $uri"

try {
  $resp = Invoke-RestMethod -Method Post -Uri $uri -Headers @{ "x-admin-key" = $adminKey } -ErrorAction Stop
} catch {
  Write-Error "Request failed: $_"
  exit 1
}

$outPath = Join-Path -Path (Get-Location) -ChildPath "migration-dryrun.json"
$resp | ConvertTo-Json -Depth 20 | Out-File -FilePath $outPath -Encoding utf8

Write-Output "Dry-run saved to: $outPath"
if ($resp.migrationCandidates) { Write-Output "migrationCandidates: $($resp.migrationCandidates.Count)" }
if ($resp.orphans) { Write-Output "orphans: $($resp.orphans.Count)" }

Write-Output "Open the saved file and paste the JSON here when ready for analysis."
