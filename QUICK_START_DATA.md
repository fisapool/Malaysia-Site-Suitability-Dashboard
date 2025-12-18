# Quick Start: Replacing Mock Data with Real Datasets

## Overview

Your GeoIntel application currently uses mock data. This guide shows you how to quickly replace it with your actual datasets.

## Current Setup

- **Mock Data**: `data/mockGeoData.ts`
- **API Service**: `services/mockApi.ts` (old) → `services/api.ts` (new)
- **Data Format**: GeoJSON FeatureCollection with specific properties

## Quick Steps

### Option 0: Get Malaysian Boundary Data from DOSM

If you need Malaysian district, parliament, or DUN boundary data, see:
- **DOSM Data Sources Guide**: `docs/DOSM_DATA_SOURCES.md`
- **Quick Clone Script**: Run `scripts/clone-dosm-repos.ps1` (Windows) or `scripts/clone-dosm-repos.sh` (Linux/Mac)

**Recommended repositories to clone**:
1. `aksara-data` - Most likely to contain boundary datasets
2. `data-open` - Open datasets
3. `aksara-back` - Backend with possible API endpoints

### Option 1: Static GeoJSON File (Simplest)

1. **Prepare your GeoJSON file** with this structure:
   ```json
   {
     "type": "FeatureCollection",
     "features": [{
       "properties": {
         "id": "unique-id",
         "name": "District Name",
         "population": 150000,
         "avg_income": 8500,
         "competitors": 45,
         "public_services": 25,
         "site_suitability_score": 92,
         "night_lights": 88
       },
       "geometry": { "type": "Polygon", "coordinates": [...] }
     }]
   }
   ```

2. **Place file in public directory**:
   ```
   public/data/districts.geojson
   ```

3. **Create/update `.env` file**:
   ```env
   VITE_DATA_SOURCE=file
   VITE_GEOJSON_DISTRICT=/data/districts.geojson
   ```

4. **Rebuild**: `npm run dev`

### Option 2: REST API

1. **Set up API endpoint** that returns GeoJSON:
   ```
   GET /api/boundaries/district
   ```

2. **Update `.env`**:
   ```env
   VITE_DATA_SOURCE=api
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. **Rebuild**: `npm run dev`

### Option 3: Different Property Names

If your data has different property names, use the transformer:

```typescript
import { fetchFromGeoJSONFile } from './services/api';
import { transformToDistrictFeatures } from './services/dataTransformer';

const mapping = {
  id: 'your_id_field',
  name: 'your_name_field',
  population: 'pop',  // if your data uses 'pop' instead of 'population'
  // ... etc
};

const rawData = await fetchFromGeoJSONFile('district');
const transformed = transformToDistrictFeatures(rawData, mapping);
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Choose one: 'mock' | 'file' | 'api'
VITE_DATA_SOURCE=mock

# For API mode
VITE_API_BASE_URL=http://localhost:3000

# For file mode (relative to public directory)
VITE_GEOJSON_DISTRICT=/data/districts.geojson
VITE_GEOJSON_PARLIAMENT=/data/parliament.geojson
VITE_GEOJSON_DUN=/data/dun.geojson
```

## Data Transformation

If your data structure doesn't match exactly, see:
- `services/dataTransformer.ts` - Utility functions for data transformation
- `docs/DATA_INTEGRATION_EXAMPLES.md` - Detailed examples

## Files Changed

- ✅ `services/api.ts` - New flexible API service
- ✅ `services/dataTransformer.ts` - Data transformation utilities
- ✅ `App.tsx` - Updated to use new API with error handling
- ✅ `vite-env.d.ts` - Type definitions for environment variables

## Next Steps

1. Choose your data source (file, API, or keep mock)
2. Configure environment variables
3. Test with your data
4. Customize transformations if needed

For detailed examples, see `docs/DATA_INTEGRATION_EXAMPLES.md`.

