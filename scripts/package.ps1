$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistDir = Join-Path $ProjectRoot "dist"
$ShareDir = Join-Path $DistDir "rebirth-game-share"
$ZipPath = Join-Path $DistDir "rebirth-game-share.zip"
$ManifestPath = Join-Path $ProjectRoot "data\manifest.json"

New-Item -ItemType Directory -Force $DistDir | Out-Null
$DistRoot = [System.IO.Path]::GetFullPath($DistDir)
$ShareRoot = [System.IO.Path]::GetFullPath($ShareDir)
if (-not $ShareRoot.StartsWith($DistRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Share directory is outside dist: $ShareRoot"
}
if (Test-Path -LiteralPath $ShareDir) {
    Remove-Item -LiteralPath $ShareDir -Recurse -Force
}
New-Item -ItemType Directory -Force $ShareDir | Out-Null
New-Item -ItemType Directory -Force (Join-Path $ShareDir "data") | Out-Null

$Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$RootFiles = @("index.html", "styles.css", "app.js", "README.md", "AGENTS.md", "pyproject.toml", "requirements.txt")
$DataFiles = @("game-data.js", "manifest.json") + @($Manifest.files)
$ProjectDirs = @("scripts", "docs", ".github")

foreach ($File in $RootFiles) {
    Copy-Item -LiteralPath (Join-Path $ProjectRoot $File) -Destination $ShareDir -Force
}

foreach ($File in ($DataFiles | Select-Object -Unique)) {
    Copy-Item -LiteralPath (Join-Path $ProjectRoot "data\$File") -Destination (Join-Path $ShareDir "data") -Force
}

foreach ($Dir in $ProjectDirs) {
    Copy-Item -LiteralPath (Join-Path $ProjectRoot $Dir) -Destination $ShareDir -Recurse -Force
}

Get-ChildItem -LiteralPath $ShareDir -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -LiteralPath $ShareDir -Recurse -File -Filter "*.pyc" | Remove-Item -Force

Push-Location -LiteralPath $ShareDir
try {
    Compress-Archive -Path @($RootFiles + "data" + $ProjectDirs) -DestinationPath $ZipPath -Force
}
finally {
    Pop-Location
}

Write-Host "Wrote $ZipPath"
