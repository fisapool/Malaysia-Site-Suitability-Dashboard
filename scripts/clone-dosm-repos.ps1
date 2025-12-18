# PowerShell script to clone DOSM repositories for geospatial boundary data
# Usage: .\scripts\clone-dosm-repos.ps1

$ErrorActionPreference = "Stop"

Write-Host "Cloning DOSM repositories for geospatial boundary data..." -ForegroundColor Blue
Write-Host ""

# Create directory for DOSM data
$DataDir = "dosm-data"
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
}
Set-Location $DataDir

# Function to clone repository if it doesn't exist
function Clone-IfNotExists {
    param(
        [string]$RepoName,
        [string]$Description
    )
    
    Write-Host "$Description" -ForegroundColor Green
    if (Test-Path $RepoName) {
        Write-Host "$RepoName already exists, skipping..." -ForegroundColor Yellow
    } else {
        git clone "https://github.com/dosm-malaysia/$RepoName.git"
    }
    Write-Host ""
}

# Clone repositories
Clone-IfNotExists "aksara-data" "Priority 1: Cloning aksara-data (most likely to contain datasets)..."
Clone-IfNotExists "data-open" "Priority 2: Cloning data-open (open datasets)..."
Clone-IfNotExists "aksara-back" "Priority 3: Cloning aksara-back (backend - may contain API/data processing)..."

Write-Host "Searching for GeoJSON and shapefiles in cloned repositories..." -ForegroundColor Blue
Write-Host ""

# Search for files
Write-Host "GeoJSON files found:" -ForegroundColor Yellow
Get-ChildItem -Recurse -Filter "*.geojson" -ErrorAction SilentlyContinue | Select-Object -First 20 -ExpandProperty FullName
if (-not (Get-ChildItem -Recurse -Filter "*.geojson" -ErrorAction SilentlyContinue)) {
    Write-Host "No GeoJSON files found"
}

Write-Host ""
Write-Host "Shapefiles found:" -ForegroundColor Yellow
Get-ChildItem -Recurse -Filter "*.shp" -ErrorAction SilentlyContinue | Select-Object -First 20 -ExpandProperty FullName
if (-not (Get-ChildItem -Recurse -Filter "*.shp" -ErrorAction SilentlyContinue)) {
    Write-Host "No shapefiles found"
}

Write-Host ""
Write-Host "Potential boundary-related files:" -ForegroundColor Yellow
$searchTerms = @("*boundary*", "*district*", "*parliament*", "*dun*")
$found = $false
foreach ($term in $searchTerms) {
    $files = Get-ChildItem -Recurse -Filter $term -ErrorAction SilentlyContinue | Select-Object -First 5 -ExpandProperty FullName
    if ($files) {
        $found = $true
        $files | ForEach-Object { Write-Host $_ }
    }
}
if (-not $found) {
    Write-Host "No obvious boundary files found"
}

Write-Host ""
Write-Host "Done! Repositories cloned to: $(Get-Location)" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Explore the repositories for boundary data"
Write-Host "2. Look for GeoJSON or shapefiles"
Write-Host "3. Convert shapefiles to GeoJSON if needed"
Write-Host "4. Copy GeoJSON files to public/data/ directory"
Write-Host "5. Update .env file with file paths"

