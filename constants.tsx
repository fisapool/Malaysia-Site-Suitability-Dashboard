
import type { DataLayer, BoundaryType } from './types';
import { scaleQuantile } from 'd3-scale';

export const DATA_LAYERS: Record<string, DataLayer> = {
  population: {
    id: 'population',
    name: 'Population Density',
    description: 'Total population in the area.',
    shortDescription: 'Total number of residents in the area.',
    fullExplanation: '**Population Density**\n\nMeasures the total number of residents living within a geographic boundary.\n\nCalculated from census data aggregated at the district, parliament, or DUN level.\n\nHigher density indicates greater potential customer base and market size.',
    measurementMethod: 'Aggregated from census data at administrative boundary level.',
    context: 'Based on official census records from the Department of Statistics Malaysia (DOSM).',
    colorScheme: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
    stops: [10000, 25000, 50000, 100000, 200000],
  },
  avg_income: {
    id: 'avg_income',
    name: 'Average Income',
    description: 'Average household income.',
    shortDescription: 'Average monthly household income in Malaysian Ringgit.',
    fullExplanation: '**Average Income**\n\nMeasures the mean monthly household income within a geographic area.\n\nCalculated from household income surveys (HIES) and census data.\n\nHigher values indicate greater purchasing power and economic capacity.',
    measurementMethod: 'Calculated from household income and expenditure survey (HIES) data aggregated by administrative boundaries.',
    context: 'Data sourced from DOSM Household Income and Expenditure Survey.',
    colorScheme: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'],
    stops: [3000, 4500, 6000, 7500, 9000],
  },
  competitors: {
    id: 'competitors',
    name: 'Competitor Density',
    description: 'Number of competing businesses.',
    shortDescription: 'Count of competing businesses in the area.',
    fullExplanation: '**Competitor Density**\n\nMeasures the number of competing businesses in the same geographic area.\n\nCounted from business registration and commercial activity records.\n\nHigher counts indicate more competitive market conditions.',
    measurementMethod: 'Aggregated count of registered businesses in similar categories within the boundary.',
    context: 'Based on business registration and commercial activity records.',
    colorScheme: ['#feedde', '#fdbe85', '#fd8d3c', '#e6550d', '#a63603'],
    stops: [5, 10, 20, 35, 50],
  },
  site_suitability_score: {
    id: 'site_suitability_score',
    name: 'Site Suitability Score',
    description: 'Overall score based on multiple factors.',
    shortDescription: 'Composite score evaluating location potential for business operations.',
    fullExplanation: '**Site Suitability Score**\n\nA composite metric measuring location potential for business operations.\n\nCalculated by combining weighted factors: population, income, competitors, public services, and economic activity.\n\nHigher scores indicate more favorable conditions for business establishment.',
    measurementMethod: 'Weighted combination of demographic, economic, and infrastructure factors normalized to a 0-100 scale.',
    context: 'Composite index derived from multiple data sources including census, economic, and infrastructure data.',
    colorScheme: ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f'],
    stops: [40, 55, 70, 85, 100],
  },
  night_lights: {
    id: 'night_lights',
    name: 'Night Lights Intensity',
    description: 'Economic activity proxy based on night lights.',
    shortDescription: 'Satellite-measured night light intensity as an economic activity indicator.',
    fullExplanation: '**Night Lights Intensity**\n\nMeasures visible light emissions at night from satellite imagery.\n\nUsed as a proxy indicator for economic activity and urbanization.\n\nHigher intensity correlates with greater economic activity and development.',
    measurementMethod: 'Satellite remote sensing data measuring visible light emissions during nighttime hours.',
    context: 'Derived from satellite imagery data, commonly used in economic geography research.',
    colorScheme: ['#fff7d4', '#fee391', '#fec44f', '#fe9929', '#d95f0e'],
    stops: [20, 35, 50, 65, 80],
  },
  public_services: {
    id: 'public_services',
    name: 'Public Services',
    description: 'Number of public service facilities in the area.',
    shortDescription: 'Count of public service facilities and infrastructure.',
    fullExplanation: '**Public Services**\n\nMeasures the number of public service facilities within a geographic area.\n\nIncludes government offices, healthcare, education, and other essential amenities.\n\nHigher counts indicate better access to public services and infrastructure.',
    measurementMethod: 'Aggregated count of public service facilities including government offices, healthcare, education, and other public amenities.',
    context: 'Based on public facility registrations and infrastructure mapping data.',
    colorScheme: ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0'],
    stops: [5, 10, 15, 20, 30],
  },
};

export const BOUNDARIES: BoundaryType[] = [
  { id: 'district', name: 'District' },
  { id: 'parliament', name: 'Parliament' },
  { id: 'dun', name: 'DUN' },
];

export const getLayerColor = (value: number, layerId: keyof typeof DATA_LAYERS) => {
    const layer = DATA_LAYERS[layerId];
    if (!layer) return '#cccccc';
    
    const colorScale = scaleQuantile<string>()
      .domain(layer.stops)
      .range(layer.colorScheme);

    return colorScale(value);
};

// Malaysia map configuration
export const MALAYSIA_CENTER: [number, number] = [4.2, 109.0]; // Geographic center of Malaysia
export const MALAYSIA_ZOOM = 6; // Country-level zoom
export const MALAYSIA_BOUNDS: [[number, number], [number, number]] = [
  [0.85, 99.5],  // Southwest corner (southern tip of Johor, western tip of Perlis)
  [7.5, 119.5]   // Northeast corner (northern tip of Perlis, eastern tip of Sabah)
];
