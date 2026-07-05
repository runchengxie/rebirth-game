$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistDir = Join-Path $ProjectRoot "dist"
$ShareDir = Join-Path $DistDir "rebirth-game-share"
$ZipPath = Join-Path $DistDir "rebirth-game-share.zip"

New-Item -ItemType Directory -Force $DistDir | Out-Null
New-Item -ItemType Directory -Force $ShareDir | Out-Null
New-Item -ItemType Directory -Force (Join-Path $ShareDir "data") | Out-Null

Copy-Item -LiteralPath (Join-Path $ProjectRoot "index.html") -Destination $ShareDir -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "README.md") -Destination $ShareDir -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "data\game-data.js") -Destination (Join-Path $ShareDir "data") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "data\manifest.json") -Destination (Join-Path $ShareDir "data") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "data\2023.json") -Destination (Join-Path $ShareDir "data") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "data\2024.json") -Destination (Join-Path $ShareDir "data") -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "data\2025.json") -Destination (Join-Path $ShareDir "data") -Force

Compress-Archive -Path (Join-Path $ShareDir "*") -DestinationPath $ZipPath -Force

Write-Host "Wrote $ZipPath"
