$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm build
} else {
    npm --workspaces run build
}
