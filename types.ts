
// FIX: Import Feature, Polygon, and MultiPolygon to resolve GeoJSON namespace errors.
import type { Feature, Polygon, MultiPolygon } from 'geojson';

export interface DistrictProperties {
  id: string;
  name: string;
  population: number;
  avg_income: number;
  competitors: number;
  public_services: number;
  site_suitability_score: number;
  night_lights: number;
  hasCensusData?: boolean;  // Flag to distinguish missing data from zero values
}

// FIX: Support both Polygon and MultiPolygon geometries
export type DistrictFeature = Feature<Polygon | MultiPolygon, DistrictProperties>;

export type DataLayerId = 'population' | 'avg_income' | 'competitors' | 'site_suitability_score' | 'night_lights' | 'public_services';

export interface DataLayer {
  id: DataLayerId;
  name: string;
  description: string;
  shortDescription: string;
  fullExplanation: string;
  measurementMethod: string;
  context?: string;
  colorScheme: readonly string[];
  stops: number[];
}

export type BoundaryTypeId = 'district' | 'parliament' | 'dun';

export interface BoundaryType {
  id: BoundaryTypeId;
  name: string;
}
