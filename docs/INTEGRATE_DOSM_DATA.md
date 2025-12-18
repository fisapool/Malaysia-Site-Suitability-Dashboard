# Integrating DOSM Boundary Data

## Found Data Files

You've successfully cloned the DOSM repositories! Here are the boundary files found:

### GeoJSON Files (Ready to Use)
- `dosm-data/data-open/datasets/geodata/administrative_2_district.geojson` - **District boundaries** ✅
- `dosm-data/data-open/datasets/geodata/electoral_0_parlimen.geojson` - **Parliament boundaries** ✅
- `dosm-data/data-open/datasets/geodata/electoral_1_dun.geojson` - **DUN boundaries** ✅

### Data Structure

The DOSM files have different property names than your app expects:

**DOSM District Properties:**
- `state` - State name
- `district` - District name  
- `code_state` - State code (number)
- `code_district` - District code (number)
- `code_state_district` - Combined code (e.g., "11_4")

**Your App Expects:**
- `id` - Unique identifier
- `name` - Display name
- `population` - Population count
- `avg_income` - Average income
- `competitors` - Number of competitors
- `public_services` - Number of public services
- `site_suitability_score` - Score 0-100
- `night_lights` - Score 0-100

## Quick Integration Steps

### Option 1: Copy Files to Public Directory (Simplest)

1. **Copy the GeoJSON files to your public directory:**
```powershell
# Create data directory
New-Item -ItemType Directory -Force -Path "public\data"

# Copy district boundaries
Copy-Item "dosm-data\data-open\datasets\geodata\administrative_2_district.geojson" "public\data\districts.geojson"

# Copy parliament boundaries  
Copy-Item "dosm-data\data-open\datasets\geodata\electoral_0_parlimen.geojson" "public\data\parliament.geojson"

# Copy DUN boundaries
Copy-Item "dosm-data\data-open\datasets\geodata\electoral_1_dun.geojson" "public\data\dun.geojson"
```

2. **Update `.env` file:**
```env
VITE_DATA_SOURCE=file
VITE_GEOJSON_DISTRICT=/data/districts.geojson
VITE_GEOJSON_PARLIAMENT=/data/parliament.geojson
VITE_GEOJSON_DUN=/data/dun.geojson
```

### Option 2: Use Data Transformer (Recommended)

Since the property names differ, use the transformer to map DOSM properties to your expected format.

1. **Update `services/api.ts` to transform DOSM data:**

```typescript
import { transformToDistrictFeatures } from './dataTransformer';

const fetchFromGeoJSONFile = async (boundaryType: BoundaryTypeId): Promise<FeatureCollection> => {
  const filePath = GEOJSON_FILES[boundaryType] || GEOJSON_FILES.district;
  
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON file: ${response.statusText}`);
    }
    const rawData = await response.json();
    
    // Transform DOSM properties to expected format
    const mapping = {
      id: ['code_state_district', 'code_district', 'code_parlimen', 'code_dun'],
      name: ['district', 'parlimen', 'dun'],
      // For now, set missing properties to 0 - you'll need to join with demographic data
      population: null,
      avg_income: null,
      competitors: null,
      public_services: null,
      site_suitability_score: null,
      night_lights: null,
    };
    
    const transformedData = transformToDistrictFeatures(rawData, mapping);
    
    // Fill in missing numeric properties with 0 for now
    // TODO: Join with demographic data from CSV files or API
    transformedData.features = transformedData.features.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        population: feature.properties.population || 0,
        avg_income: feature.properties.avg_income || 0,
        competitors: feature.properties.competitors || 0,
        public_services: feature.properties.public_services || 0,
        site_suitability_score: feature.properties.site_suitability_score || 50,
        night_lights: feature.properties.night_lights || 50,
      }
    }));
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching GeoJSON file:', error);
    throw error;
  }
};
```

### Option 3: Join with Demographic Data

The DOSM repository also contains CSV files with demographic data:
- `state_district.csv`
- `census_district.csv`
- `census_dun.csv`

You can create a script to:
1. Load the GeoJSON boundary files
2. Load the demographic CSV files
3. Join them by district/parliament/DUN code
4. Create enriched GeoJSON files with all required properties

## Next Steps

1. **Copy files to public directory** (quickest way to see the boundaries)
2. **Update environment variables** to point to the files
3. **Test the application** - boundaries should display correctly
4. **Add demographic data** - Join CSV data or use API to populate numeric fields
5. **Customize styling** - Adjust colors and legends based on available data

## Notes

- The DOSM data has **accurate boundary coordinates** for Malaysia
- Some properties (population, income, etc.) need to be joined from other data sources
- The `code_state_district` format (e.g., "11_4") can serve as unique IDs
- Geometry types may include both `Polygon` and `MultiPolygon` - your app should handle both

## Troubleshooting

If boundaries don't display:
- Check browser console for errors
- Verify file paths in `.env` are correct
- Ensure coordinates are in [longitude, latitude] order (they should be)
- Check that files are accessible via HTTP (in `public/` directory)

