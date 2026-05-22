$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm build:viewer
    pnpm build:bridge
} else {
    npm run build --workspace viewer
    npm run build --workspace bridge
}

$staging = Join-Path $root "dist\\extension_package"
$viewerDist = Join-Path $root "viewer\\dist"
$bridgeDist = Join-Path $root "bridge\\dist"
$extensionDir = Join-Path $staging "r3f_live_preview"
$packageJson = Get-Content (Join-Path $root "package.json") | ConvertFrom-Json
$version = $packageJson.version
$zipPath = Join-Path $root ("dist\\r3f_live_preview_blender_v{0}.zip" -f $version)

if (Test-Path $staging) {
    Remove-Item -LiteralPath $staging -Recurse -Force
}
if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Force $extensionDir | Out-Null
Copy-Item -Path (Join-Path $root "blender_extension\\*") -Destination $extensionDir -Recurse
Copy-Item -Path $viewerDist -Destination (Join-Path $extensionDir "viewer_dist") -Recurse
Copy-Item -Path $bridgeDist -Destination (Join-Path $extensionDir "bridge_dist") -Recurse

Compress-Archive -Path (Join-Path $extensionDir "*") -DestinationPath $zipPath
node (Join-Path $root "scripts\\update_release_manifest.cjs")
Write-Host "Created package: $zipPath"
