# Data Integration Examples

## Example 1: Using Static GeoJSON Files

### Step 1: Prepare Your GeoJSON File

Create a GeoJSON file with your actual data. Example structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "D001",
        "name": "District Name",
        "population": 150000,
        "avg_income": 8500,
        "competitors": 45,
        "public_services": 25,
        "site_suitability_score": 92,
        "night_lights": 88
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [101.69, 3.14],
          [101.71, 3.14],
          [101.71, 3.16],
          [101.69, 3.16],
          [101.69, 3.14]
        ]]
      }
    }
  ]
}
```

### Step 2: Place File in Public Directory

Create the directory structure and place your file:

```
public/
  data/
    districts.geojson
```

### Step 3: Configure Environment

Create a `.env` file (or update existing):

```env
VITE_DATA_SOURCE=file
VITE_GEOJSON_DISTRICT=/data/districts.geojson
```

### Step 4: Rebuild Application

The application will now load from the static file.

---

## Example 2: Using REST API

### Step 1: Set Up API Endpoint

Your API should return GeoJSON FeatureCollection:

```javascript
// Example Express.js endpoint
app.get('/api/boundaries/:type', (req, res) => {
  const { type } = req.params; // 'district', 'parliament', or 'dun'
  
  // Query your database or load from file
  const geoJsonData = getBoundaryData(type);
  
  res.json(geoJsonData);
});
```

### Step 2: Configure Environment

```env
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:3000
```

### Step 3: Handle CORS (if needed)

If your API is on a different origin, configure CORS:

```javascript
// Example CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
```

---

## Example 3: Transforming Data with Different Property Names

If your data has different property names, use the transformer:

```typescript
import { fetchFromGeoJSONFile } from './services/api';
import { transformToDistrictFeatures } from './services/dataTransformer';

// Define property mapping
const mapping = {
  id: 'district_code',        // Your source field for id
  name: 'district_name',      // Your source field for name
  population: 'pop',          // Your source field for population
  avg_income: 'income_avg',   // Your source field for avg_income
  competitors: 'comp_count',  // Your source field for competitors
  public_services: 'services', // Your source field for public_services
  site_suitability_score: 'suitability', // Your source field
  night_lights: 'lights',     // Your source field for night_lights
};

// Fetch and transform
const rawData = await fetchFromGeoJSONFile('district');
const transformedData = transformToDistrictFeatures(rawData, mapping);
```

Update `services/api.ts` to use transformation:

```typescript
import { transformToDistrictFeatures } from './dataTransformer';

const fetchFromGeoJSONFile = async (boundaryType: BoundaryTypeId): Promise<FeatureCollection> => {
  // ... fetch logic ...
  const rawData = await response.json();
  
  // Transform if needed
  const mapping = {
    // Your property mappings
  };
  
  return transformToDistrictFeatures(rawData, mapping);
};
```

---

## Example 4: Loading from PostgreSQL/PostGIS Database

### Backend API Example (Node.js)

```javascript
const { Client } = require('pg');

app.get('/api/boundaries/:type', async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Query PostGIS to get GeoJSON directly
    const query = `
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'properties', json_build_object(
              'id', id,
              'name', name,
              'population', population,
              'avg_income', avg_income,
              'competitors', competitors,
              'public_services', public_services,
              'site_suitability_score', site_suitability_score,
              'night_lights', night_lights
            ),
            'geometry', ST_AsGeoJSON(geom)::json
          )
        )
      ) as geojson
      FROM boundaries
      WHERE type = $1
    `;
    
    const result = await client.query(query, [req.params.type]);
    res.json(result.rows[0].geojson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
});
```

---

## Example 5: Using Environment Variables for Different Environments

### Development (.env.development)
```env
VITE_DATA_SOURCE=mock
```

### Staging (.env.staging)
```env
VITE_DATA_SOURCE=file
VITE_GEOJSON_DISTRICT=/data/staging-districts.geojson
```

### Production (.env.production)
```env
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## Common Data Sources

### Government/Public Data
- **OpenStreetMap**: Use Overpass API or download GeoJSON extracts
- **Census Data**: Combine demographic data with boundary files
- **Government Portals**: Many governments provide GeoJSON boundary data

### Converting Shapefiles to GeoJSON
```bash
# Using ogr2ogr (GDAL)
ogr2ogr -f GeoJSON districts.geojson districts.shp

# Using mapshaper (Node.js tool)
mapshaper districts.shp -o format=geojson districts.geojson
```

### Data Processing Tips
1. **Simplify geometries** for better performance:
   ```bash
   mapshaper districts.geojson -simplify 10% -o districts-simplified.geojson
   ```

2. **Validate GeoJSON** before using:
   ```bash
   geojsonhint districts.geojson
   ```

3. **Normalize coordinates** if needed (ensure longitude/latitude order)

