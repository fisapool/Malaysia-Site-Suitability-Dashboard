
// FIX: Import FeatureCollection to resolve GeoJSON namespace error.
import type { FeatureCollection } from 'geojson';
import { MOCK_GEO_DATA } from '../data/mockGeoData';

export const fetchDistrictData = (): Promise<FeatureCollection> => {
  return new Promise(resolve => {
    setTimeout(() => {
      // FIX: Use imported FeatureCollection type for casting.
      resolve(MOCK_GEO_DATA as FeatureCollection);
    }, 1500); // Simulate network delay
  });
};
