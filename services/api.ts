// API service for fetching geospatial data
import type { FeatureCollection } from 'geojson';
import { MOCK_GEO_DATA } from '../data/mockGeoData';
import type { BoundaryTypeId } from '../types';
import { transformToDistrictFeatures, type PropertyMapping } from './dataTransformer';

// Configuration for data sources
const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE || 'mock') as 'mock' | 'file' | 'api';

// API endpoints (configure in .env file)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const GEOJSON_FILES: Record<string, string> = {
  district: import.meta.env.VITE_GEOJSON_DISTRICT || '/data/districts.geojson',
  parliament: import.meta.env.VITE_GEOJSON_PARLIAMENT || '/data/parliament.geojson',
  dun: import.meta.env.VITE_GEOJSON_DUN || '/data/dun.geojson',
};

/**
 * Fetch district data based on configured data source
 */
export const fetchDistrictData = async (boundaryType: BoundaryTypeId = 'district'): Promise<FeatureCollection> => {
  switch (DATA_SOURCE) {
    case 'file':
      return fetchFromGeoJSONFile(boundaryType);
    
    case 'api':
      return fetchFromAPI(boundaryType);
    
    case 'mock':
    default:
      return fetchMockData();
  }
};

/**
 * Get property mapping for DOSM data based on boundary type
 */
const getDOSMMapping = (boundaryType: BoundaryTypeId): PropertyMapping => {
  switch (boundaryType) {
    case 'district':
      return {
        id: ['code_state_district', 'code_district', 'id', 'ID'],
        // Try to get name from district field, fallback to name
        name: ['district', 'name', 'NAME'],
        // Numeric fields will default to 0 if not found
      };
    case 'parliament':
      return {
        id: ['code_parlimen', 'code_state_parlimen', 'id', 'ID'],
        name: ['parlimen', 'name', 'NAME'],
      };
    case 'dun':
      return {
        id: ['code_dun', 'code_state_dun', 'id', 'ID'],
        name: ['dun', 'name', 'NAME'],
      };
    default:
      return {
        id: ['id', 'ID', 'code'],
        name: ['name', 'NAME', 'label'],
      };
  }
};

/**
 * Enhance feature name with state information if available (for DOSM data)
 */
const enhanceFeatureName = (feature: any, boundaryType: BoundaryTypeId): string => {
  const props = feature.properties || {};
  const baseName = props.district || props.parlimen || props.dun || props.name || 'Unknown';
  const state = props.state;
  
  // Combine state and boundary name for better display
  if (state && baseName !== 'Unknown') {
    return `${baseName}, ${state}`;
  }
  
  return baseName;
};

/**
 * Fetch data from static GeoJSON file in public directory
 */
const fetchFromGeoJSONFile = async (boundaryType: BoundaryTypeId): Promise<FeatureCollection> => {
  const filePath = GEOJSON_FILES[boundaryType] || GEOJSON_FILES.district;
  
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON file: ${response.statusText}`);
    }
    const rawData = await response.json();
    
    // Validate it's a FeatureCollection
    if (rawData.type !== 'FeatureCollection' || !Array.isArray(rawData.features)) {
      throw new Error('Invalid GeoJSON format: expected FeatureCollection');
    }
    
    // Transform DOSM properties to expected format
    const mapping = getDOSMMapping(boundaryType);
    const transformedData = transformToDistrictFeatures(rawData, mapping);
    
    // Enhance names with state information if available
    transformedData.features = transformedData.features.map(feature => {
      const enhancedName = enhanceFeatureName(feature, boundaryType);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          name: enhancedName,
        },
      };
    });
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching GeoJSON file:', error);
    throw error;
  }
};

/**
 * Fetch data from REST API endpoint
 */
const fetchFromAPI = async (boundaryType: BoundaryTypeId): Promise<FeatureCollection> => {
  const endpoint = `${API_BASE_URL}/api/boundaries/${boundaryType}`;
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const rawData = await response.json();
    
    // Validate it's a FeatureCollection
    if (rawData.type !== 'FeatureCollection' || !Array.isArray(rawData.features)) {
      throw new Error('Invalid GeoJSON format: expected FeatureCollection');
    }
    
    // Transform API data to expected format (assuming similar structure to DOSM)
    const mapping = getDOSMMapping(boundaryType);
    const transformedData = transformToDistrictFeatures(rawData, mapping);
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching from API:', error);
    throw error;
  }
};

/**
 * Fetch mock data (fallback)
 */
const fetchMockData = (): Promise<FeatureCollection> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_GEO_DATA as FeatureCollection);
    }, 500); // Reduced delay for better UX
  });
};

/**
 * Transform external data to match expected format
 * Use this if your data structure differs from the expected format
 */
export const transformGeoJSONData = (
  data: FeatureCollection,
  propertyMapping?: Record<string, string>
): FeatureCollection => {
  const defaultMapping: Record<string, string> = {
    // Map your data property names to expected names
    // Example: 'pop' -> 'population', 'income' -> 'avg_income'
  };
  
  const mapping: Record<string, string> = { ...defaultMapping, ...propertyMapping };
  
  return {
    ...data,
    features: data.features.map(feature => {
      const transformedProperties: Record<string, any> = { ...feature.properties };
      
      // Apply property mapping
      Object.entries(mapping).forEach(([sourceKey, targetKey]) => {
        if (transformedProperties[sourceKey] !== undefined && typeof targetKey === 'string') {
          transformedProperties[targetKey] = transformedProperties[sourceKey];
          if (sourceKey !== targetKey) {
            delete transformedProperties[sourceKey];
          }
        }
      });
      
      return {
        ...feature,
        properties: transformedProperties,
      };
    }),
  };
};

