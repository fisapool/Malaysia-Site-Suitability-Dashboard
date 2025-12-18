// Utilities for transforming geospatial data to match expected format
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import type { DistrictProperties } from '../types';

/**
 * Property mapping configuration
 * Maps source property names to target property names
 */
export interface PropertyMapping {
  // Identity fields
  id?: string | string[];              // Source field(s) for id
  name?: string | string[];            // Source field(s) for name
  
  // Numeric fields
  population?: string;
  avg_income?: string;
  competitors?: string;
  public_services?: string;
  site_suitability_score?: string;
  night_lights?: string;
}

/**
 * Transform GeoJSON features to match expected DistrictProperties format
 */
export function transformToDistrictFeatures(
  data: FeatureCollection,
  mapping: PropertyMapping = {}
): FeatureCollection {
  return {
    ...data,
    features: data.features.map(feature => transformFeature(feature, mapping)),
  };
}

/**
 * Transform a single feature
 */
function transformFeature(
  feature: Feature,
  mapping: PropertyMapping
): Feature<Polygon | MultiPolygon, DistrictProperties> {
  const props = feature.properties as any;
  
  // Helper to get value with fallback
  const getValue = (keys: string | string[] | undefined, defaultValue: any = 0): any => {
    if (!keys) return defaultValue;
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    for (const key of keyArray) {
      if (props[key] !== undefined && props[key] !== null) {
        return props[key];
      }
    }
    return defaultValue;
  };
  
  // Helper to get numeric value
  const getNumeric = (key: string | undefined, defaultValue: number = 0): number => {
    const value = getValue(key, defaultValue);
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? defaultValue : num;
  };
  
  // Helper to check if census data exists (any non-zero population or income, or explicit flag)
  const hasCensusData = (): boolean => {
    // Check if explicit flag exists
    if (props.hasCensusData !== undefined) {
      return Boolean(props.hasCensusData);
    }
    // Check if any census-related fields have actual values
    const population = getNumeric(mapping.population || 'population', 0);
    const avgIncome = getNumeric(mapping.avg_income || 'avg_income', 0);
    // If both are zero, assume no data (unless explicitly set)
    return population > 0 || avgIncome > 0;
  };
  
  // Build transformed properties
  const transformedProps: DistrictProperties = {
    id: getValue(mapping.id || ['id', 'ID', 'district_id', 'code'], ''),
    name: getValue(mapping.name || ['name', 'NAME', 'district_name', 'label'], 'Unknown'),
    population: getNumeric(mapping.population || 'population', 0),
    avg_income: getNumeric(mapping.avg_income || 'avg_income', 0),
    competitors: getNumeric(mapping.competitors || 'competitors', 0),
    public_services: getNumeric(mapping.public_services || 'public_services', 0),
    site_suitability_score: getNumeric(mapping.site_suitability_score || 'site_suitability_score', 0),
    night_lights: getNumeric(mapping.night_lights || 'night_lights', 0),
    hasCensusData: hasCensusData(),
  };
  
  // Support both Polygon and MultiPolygon geometries
  if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
    throw new Error(`Unsupported geometry type: ${feature.geometry.type}. Expected Polygon or MultiPolygon.`);
  }
  
  return {
    ...feature,
    geometry: feature.geometry,
    properties: transformedProps,
  } as Feature<Polygon | MultiPolygon, DistrictProperties>;
}

/**
 * Calculate missing properties from available data
 * Useful when your data source has different fields
 */
export function calculateMissingProperties(
  props: any,
  availableFields: string[]
): Partial<DistrictProperties> {
  const calculated: Partial<DistrictProperties> = {};
  
  // Example: Calculate site_suitability_score from other metrics if missing
  if (!availableFields.includes('site_suitability_score') && 
      (availableFields.includes('population') || availableFields.includes('income'))) {
    // Simple scoring algorithm - customize based on your needs
    const popScore = Math.min((props.population || 0) / 10000, 1) * 40;
    const incomeScore = Math.min((props.avg_income || 0) / 1000, 1) * 40;
    const serviceScore = Math.min((props.public_services || 0) / 30, 1) * 20;
    calculated.site_suitability_score = Math.round(popScore + incomeScore + serviceScore);
  }
  
  // Example: Estimate night_lights from population if missing
  if (!availableFields.includes('night_lights') && availableFields.includes('population')) {
    calculated.night_lights = Math.min((props.population || 0) / 2000, 100);
  }
  
  return calculated;
}

