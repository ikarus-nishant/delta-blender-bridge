$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Start-Process -FilePath pnpm.cmd -ArgumentList "dev:viewer" -WindowStyle Hidden
    Start-Process -FilePath pnpm.cmd -ArgumentList "dev:bridge" -WindowStyle Hidden
} else {
    Start-Process -FilePath npm.cmd -ArgumentList "run","dev","--workspace","viewer" -WindowStyle Hidden
    Start-Process -FilePath npm.cmd -ArgumentList "run","dev","--workspace","bridge" -WindowStyle Hidden
}
