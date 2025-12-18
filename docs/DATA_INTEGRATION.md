# Data Integration Guide

This guide explains how to replace mock data with actual datasets in the GeoIntel application.

## Current Data Structure

The application expects GeoJSON FeatureCollection format with the following property structure:

```typescript
{
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {
      id: string;                    // Unique identifier
      name: string;                  // Display name
      population: number;
      avg_income: number;
      competitors: number;
      public_services: number;
      site_suitability_score: number; // 0-100
      night_lights: number;           // 0-100
    },
    geometry: {
      type: "Polygon",
      coordinates: number[][][]      // Array of coordinate rings
    }
  }]
}
```

## Integration Options

### Option 1: Static GeoJSON Files

Best for: Pre-processed data, small to medium datasets, offline capability

**Steps:**
1. Place your GeoJSON file in the `public/data/` directory
2. Update `services/mockApi.ts` to fetch from the file

**Example file structure:**
```
public/
  data/
    districts.geojson
    parliament.geojson
    dun.geojson
```

### Option 2: REST API Endpoint

Best for: Dynamic data, large datasets, real-time updates

**Steps:**
1. Set up an API endpoint that returns GeoJSON
2. Update `services/mockApi.ts` to fetch from the API
3. Configure CORS if needed

### Option 3: Database Query

Best for: Structured databases (PostgreSQL/PostGIS, MongoDB), complex queries

**Steps:**
1. Create a backend service to query the database
2. Transform database results to GeoJSON format
3. Expose via REST API or GraphQL

### Option 4: Data Transformation Service

Best for: Data that needs cleaning/transformation before use

**Steps:**
1. Create transformation utilities
2. Fetch raw data from source
3. Transform to match expected structure
4. Cache transformed data

## Implementation Examples

See the code examples in the updated service files for each option.

