#!/bin/bash
# Script to clone DOSM repositories for geospatial boundary data
# Usage: ./scripts/clone-dosm-repos.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Cloning DOSM repositories for geospatial boundary data...${NC}\n"

# Create directory for DOSM data
DATA_DIR="dosm-data"
mkdir -p "$DATA_DIR"
cd "$DATA_DIR"

echo -e "${GREEN}Priority 1: Cloning aksara-data (most likely to contain datasets)...${NC}"
if [ -d "aksara-data" ]; then
    echo -e "${YELLOW}aksara-data already exists, skipping...${NC}"
else
    git clone https://github.com/dosm-malaysia/aksara-data.git
fi

echo -e "\n${GREEN}Priority 2: Cloning data-open (open datasets)...${NC}"
if [ -d "data-open" ]; then
    echo -e "${YELLOW}data-open already exists, skipping...${NC}"
else
    git clone https://github.com/dosm-malaysia/data-open.git
fi

echo -e "\n${GREEN}Priority 3: Cloning aksara-back (backend - may contain API/data processing)...${NC}"
if [ -d "aksara-back" ]; then
    echo -e "${YELLOW}aksara-back already exists, skipping...${NC}"
else
    git clone https://github.com/dosm-malaysia/aksara-back.git
fi

echo -e "\n${BLUE}Searching for GeoJSON and shapefiles in cloned repositories...${NC}\n"

echo -e "${YELLOW}GeoJSON files found:${NC}"
find . -name "*.geojson" -type f | head -20 || echo "No GeoJSON files found"

echo -e "\n${YELLOW}Shapefiles found:${NC}"
find . -name "*.shp" -type f | head -20 || echo "No shapefiles found"

echo -e "\n${YELLOW}Potential boundary-related files:${NC}"
find . \( -name "*boundary*" -o -name "*district*" -o -name "*parliament*" -o -name "*dun*" \) -type f | head -20 || echo "No obvious boundary files found"

echo -e "\n${GREEN}Done! Repositories cloned to: $(pwd)${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Explore the repositories for boundary data"
echo "2. Look for GeoJSON or shapefiles"
echo "3. Convert shapefiles to GeoJSON if needed: ogr2ogr -f GeoJSON output.geojson input.shp"
echo "4. Copy GeoJSON files to public/data/ directory"
echo "5. Update .env file with file paths"

