Migration helper

This folder contains a small PowerShell helper to call the admin migration endpoint in dry-run mode and save the output for review.

Usage (PowerShell)

1. Set required environment variables in your shell session:

$env:ADMIN_MAINTENANCE_KEY = "your-admin-key"
# Optional: override API base URL if your dev server runs on a different host/port
$env:API_BASE_URL = "http://localhost:3000"

2. Start your Next.js dev server (if not deployed):

pnpm dev

3. Run the dry-run script (from project root):

.
Scripts\run-migration-dryrun.ps1

4. The script will save `migration-dryrun.json` in the current working directory. Paste that JSON here and I'll analyze candidates, highlight risky items, and propose a safe migration plan (whitelist/skip, two-step deletion, etc).

Safety notes:
- Always create a DB backup before executing the real migration.
- The service role key allows listing/deleting bucket objects; keep it secret.
- Dry-run does not modify data; it only previews what would be migrated/deleted.
