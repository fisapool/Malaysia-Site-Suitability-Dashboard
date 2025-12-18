# PowerShell script to copy DOSM boundary data to public directory
# Usage: .\scripts\setup-dosm-data.ps1

Write-Host "Setting up DOSM boundary data for GeoIntel application..." -ForegroundColor Blue
Write-Host ""

# Create public/data directory if it doesn't exist
$dataDir = "public\data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
    Write-Host "Created directory: $dataDir" -ForegroundColor Green
}

# Source directory
$sourceDir = "dosm-data\data-open\datasets\geodata"

# Check if source directory exists
if (-not (Test-Path $sourceDir)) {
    Write-Host "ERROR: DOSM data directory not found!" -ForegroundColor Red
    Write-Host "Please run .\scripts\clone-dosm-repos.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Copy files
$files = @{
    "administrative_2_district.geojson" = "districts.geojson"
    "electoral_0_parlimen.geojson" = "parliament.geojson"
    "electoral_1_dun.geojson" = "dun.geojson"
}

foreach ($sourceFile in $files.Keys) {
    $sourcePath = Join-Path $sourceDir $sourceFile
    $destFile = $files[$sourceFile]
    $destPath = Join-Path $dataDir $destFile
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath -Force
        Write-Host "Copied: $destFile" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Source file not found: $sourceFile" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Files copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Update your .env file with:" -ForegroundColor Yellow
Write-Host "   VITE_DATA_SOURCE=file"
Write-Host "   VITE_GEOJSON_DISTRICT=/data/districts.geojson"
Write-Host "   VITE_GEOJSON_PARLIAMENT=/data/parliament.geojson"
Write-Host "   VITE_GEOJSON_DUN=/data/dun.geojson"
Write-Host ""
Write-Host "2. Note: DOSM data structure differs from your app's expected format"
Write-Host "   - Properties: state, district, code_state_district (instead of id, name, population, etc.)"
Write-Host "   - You may need to use the data transformer or join with demographic data"
Write-Host "   - See docs/INTEGRATE_DOSM_DATA.md for details"
Write-Host ""
Write-Host "3. Run: npm run dev"
Write-Host ""

