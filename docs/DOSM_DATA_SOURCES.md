# DOSM Data Sources for GeoIntel

This guide identifies which Department of Statistics Malaysia (DOSM) GitHub repositories to clone for geospatial boundary datasets.

## Recommended Repositories to Clone

Based on the [DOSM GitHub organization](https://github.com/dosm-malaysia?tab=repositories), here are the repositories most likely to contain boundary/geospatial data:

### 1. **aksara-data** (Priority 1)
**Repository**: `https://github.com/dosm-malaysia/aksara-data`

**Why**: This repository likely contains actual datasets (as the name suggests "aksara-data"). This is the most promising source for boundary files.

**Clone command**:
```bash
git clone https://github.com/dosm-malaysia/aksara-data.git
```

**What to look for**:
- GeoJSON files (`.geojson`)
- Shapefiles (`.shp`, `.shx`, `.dbf`)
- CSV files with coordinate data
- Folders named `boundaries`, `districts`, `parliament`, `dun`, `geojson`, or `shapefiles`

---

### 2. **data-open** (Priority 2)
**Repository**: `https://github.com/dosm-malaysia/data-open`

**Why**: Contains open datasets in Jupyter Notebook format. May include processed boundary data or scripts to generate boundaries.

**Clone command**:
```bash
git clone https://github.com/dosm-malaysia/data-open.git
```

**What to look for**:
- Jupyter notebooks (`.ipynb`) that process boundary data
- Exported GeoJSON or shapefiles in notebooks
- Data folders with boundary files
- Documentation on boundary data structure

---

### 3. **aksara-back** (Optional)
**Repository**: `https://github.com/dosm-malaysia/aksara-back`

**Why**: Backend repository (Python/Django) that might contain API endpoints or data processing scripts for boundaries.

**Clone command**:
```bash
git clone https://github.com/dosm-malaysia/aksara-back.git
```

**What to look for**:
- API endpoints that serve boundary data
- Data processing scripts
- Database schemas showing boundary data structure
- Migration files with boundary data

---

### 4. **opendosm-front** or **kawasanku-front** (Reference Only)
**Repositories**: 
- `https://github.com/dosm-malaysia/opendosm-front`
- `https://github.com/dosm-malaysia/kawasanku-front`

**Why**: Frontend applications that use boundary data. While they may not contain the raw datasets, they can show:
- How boundary data is structured
- API endpoints used to fetch boundaries
- Data format expectations

**Clone command**:
```bash
git clone https://github.com/dosm-malaysia/opendosm-front.git
git clone https://github.com/dosm-malaysia/kawasanku-front.git
```

---

## Quick Clone Script

Create a script to clone all potentially useful repositories:

```bash
# Create a directory for DOSM data
mkdir dosm-data
cd dosm-data

# Clone all relevant repositories
git clone https://github.com/dosm-malaysia/aksara-data.git
git clone https://github.com/dosm-malaysia/data-open.git
git clone https://github.com/dosm-malaysia/aksara-back.git

# Optional: Clone frontend repos for reference
git clone https://github.com/dosm-malaysia/opendosm-front.git
git clone https://github.com/dosm-malaysia/kawasanku-front.git
```

---

## Searching Within Cloned Repositories

After cloning, search for boundary-related files:

### Search for GeoJSON files:
```bash
find . -name "*.geojson" -type f
find . -name "*boundary*.geojson" -type f
find . -name "*district*.geojson" -type f
find . -name "*parliament*.geojson" -type f
find . -name "*dun*.geojson" -type f
```

### Search for Shapefiles:
```bash
find . -name "*.shp" -type f
find . -name "*boundary*.shp" -type f
```

### Search for relevant keywords:
```bash
grep -r "FeatureCollection" . --include="*.json" --include="*.geojson"
grep -r "district" . --include="*.md" -i
grep -r "parliament" . --include="*.md" -i
grep -r "DUN" . --include="*.md" -i
```

---

## Alternative: DOSM Open Data Portal

If the GitHub repositories don't have the boundary data you need, check the official portal:

**Open Data Portal**: [https://open.dosm.gov.my/](https://open.dosm.gov.my/)

This portal may provide:
- Direct downloads of boundary shapefiles/GeoJSON
- API access to boundary data
- More up-to-date datasets than GitHub

---

## Expected Data Structure

Once you find boundary data, it should match this structure:

```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "properties": {
      "id": "D01",  // District code
      "name": "District Name",
      // ... other properties
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[lon, lat], ...]]
    }
  }]
}
```

---

## Next Steps After Finding Data

1. **Convert if needed**: If you find shapefiles (`.shp`), convert to GeoJSON:
   ```bash
   # Using ogr2ogr (GDAL)
   ogr2ogr -f GeoJSON districts.geojson districts.shp
   ```

2. **Validate GeoJSON**: Ensure the file is valid:
   ```bash
   # Using geojsonhint (npm package)
   npx geojsonhint districts.geojson
   ```

3. **Check property names**: Verify that property names match or use the transformer:
   - See `services/dataTransformer.ts` for property mapping utilities
   - See `docs/DATA_INTEGRATION_EXAMPLES.md` for transformation examples

4. **Place in public directory**: Copy GeoJSON files to `public/data/`:
   ```bash
   cp districts.geojson ../geointel/public/data/
   ```

5. **Update environment**: Configure `.env` file:
   ```env
   VITE_DATA_SOURCE=file
   VITE_GEOJSON_DISTRICT=/data/districts.geojson
   ```

---

## Notes

- **License**: All DOSM repositories appear to use MIT or open licenses, but verify before commercial use
- **Coordinate System**: Malaysian boundary data typically uses WGS84 (EPSG:4326) - verify coordinates are [longitude, latitude]
- **Data Updates**: GitHub repositories may not be as up-to-date as the official portal
- **Language**: Property names might be in Bahasa Malaysia - use transformer to map to English names

---

## References

- [DOSM GitHub Organization](https://github.com/dosm-malaysia?tab=repositories)
- [DOSM Open Data Portal](https://open.dosm.gov.my/)
- [DOSM Twitter/X](https://twitter.com/StatsMalaysia)

