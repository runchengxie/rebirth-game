$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistDir = Join-Path $ProjectRoot "dist"
$PackageDir = Join-Path $ProjectRoot "dist-package"
$ShareDir = Join-Path $PackageDir "rebirth-research-share"
$ZipPath = Join-Path $DistDir "rebirth-research-share.zip"

Push-Location -LiteralPath $ProjectRoot
try {
    npm run build
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath (Join-Path $DistDir "index.html"))) {
    throw "Vite build output is missing dist/index.html"
}

New-Item -ItemType Directory -Force $PackageDir | Out-Null
$PackageRoot = [System.IO.Path]::GetFullPath($PackageDir)
$ShareRoot = [System.IO.Path]::GetFullPath($ShareDir)
if (-not $ShareRoot.StartsWith($PackageRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Share directory is outside package dir: $ShareRoot"
}

if (Test-Path -LiteralPath $ShareDir) {
    Remove-Item -LiteralPath $ShareDir -Recurse -Force
}
New-Item -ItemType Directory -Force $ShareDir | Out-Null

Copy-Item -Path (Join-Path $DistDir "*") -Destination $ShareDir -Recurse -Force
Copy-Item -LiteralPath (Join-Path $ProjectRoot "README.md") -Destination $ShareDir -Force

Get-ChildItem -LiteralPath $ShareDir -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -LiteralPath $ShareDir -Recurse -File -Filter "*.pyc" | Remove-Item -Force

if (Test-Path -LiteralPath $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
}

Push-Location -LiteralPath $ShareDir
try {
    Compress-Archive -Path @("index.html", "assets", "README.md") -DestinationPath $ZipPath -Force
}
finally {
    Pop-Location
}

Write-Host "Wrote $ZipPath"
