/**
 * Script to enrich GeoJSON boundary files with demographic data from CSV files
 * 
 * Usage: node scripts/enrich-geojson.js [boundaryType]
 * boundaryType: 'district', 'parliament', or 'dun'
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOSM_DATA_DIR = path.join(__dirname, '..', 'dosm-data', 'data-open', 'datasets');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// CSV to GeoJSON mapping
const CSV_MAPPINGS = {
  district: {
    geojson: path.join(DOSM_DATA_DIR, 'geodata', 'administrative_2_district.geojson'),
    csv: path.join(DOSM_DATA_DIR, 'census', 'census_district.csv'),
    incomeCsv: path.join(DOSM_DATA_DIR, 'economy', 'hies_2019.csv'), // State-level income data
    joinKey: 'code_state_district',
    outputFile: path.join(OUTPUT_DIR, 'districts.geojson'),
  },
  parliament: {
    geojson: path.join(DOSM_DATA_DIR, 'geodata', 'electoral_0_parlimen.geojson'),
    csv: path.join(DOSM_DATA_DIR, 'census', 'census_parlimen.csv'),
    joinKey: 'code_parlimen',
    outputFile: path.join(OUTPUT_DIR, 'parliament.geojson'),
  },
  dun: {
    geojson: path.join(DOSM_DATA_DIR, 'geodata', 'electoral_1_dun.geojson'),
    csv: path.join(DOSM_DATA_DIR, 'census', 'census_dun.csv'),
    joinKey: 'code_state_dun', // DUN uses code_state_dun format like "9_N.01"
    outputFile: path.join(OUTPUT_DIR, 'dun.geojson'),
  },
};

/**
 * Parse CSV file and return as array of objects
 * Handles quoted values and commas within quotes
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith(',,,,'));
  
  if (lines.length === 0) return [];
  
  // Parse header
  const headerLine = lines[0];
  const headers = [];
  let currentHeader = '';
  let inQuotes = false;
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(currentHeader.trim());
      currentHeader = '';
    } else {
      currentHeader += char;
    }
  }
  if (currentHeader) headers.push(currentHeader.trim());
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith('state,district')) continue;
    
    const values = [];
    let currentValue = '';
    inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (currentValue) values.push(currentValue.trim());
    
    // Only process rows with enough values
    if (values.length >= headers.length && values[0] && values[0] !== 'state') {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return data;
}

/**
 * Get the latest year's data for each district
 */
function getLatestData(csvData, joinKey) {
  const latestByKey = {};
  
  csvData.forEach(row => {
    const key = row[joinKey];
    if (!key) return;
    
    const year = parseInt(row.year || '0');
    if (!latestByKey[key] || year > parseInt(latestByKey[key].year || '0')) {
      latestByKey[key] = row;
    }
  });
  
  return latestByKey;
}

/**
 * Enrich GeoJSON with demographic data
 */
function enrichGeoJSON(boundaryType) {
  const config = CSV_MAPPINGS[boundaryType];
  if (!config) {
    console.error(`Unknown boundary type: ${boundaryType}`);
    process.exit(1);
  }
  
  // Check if files exist
  if (!fs.existsSync(config.geojson)) {
    console.error(`GeoJSON file not found: ${config.geojson}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(config.csv)) {
    console.error(`CSV file not found: ${config.csv}`);
    console.log('Skipping enrichment - will use boundary data only');
    // Copy GeoJSON as-is
    const geojson = JSON.parse(fs.readFileSync(config.geojson, 'utf-8'));
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(config.outputFile, JSON.stringify(geojson, null, 2));
    console.log(`Copied GeoJSON to ${config.outputFile}`);
    return;
  }
  
  // Load data
  console.log(`Loading GeoJSON from ${config.geojson}...`);
  const geojson = JSON.parse(fs.readFileSync(config.geojson, 'utf-8'));
  
  console.log(`Loading CSV from ${config.csv}...`);
  const csvData = parseCSV(config.csv);
  const latestData = getLatestData(csvData, config.joinKey);
  
  // Load income data if available (for districts, use district-level income from HIES)
  let incomeData = {};
  if (config.incomeCsv && fs.existsSync(config.incomeCsv)) {
    console.log(`Loading income data from ${config.incomeCsv}...`);
    const incomeCsvData = parseCSV(config.incomeCsv);
    // For HIES data, create a map by district name (prefer district-level, fallback to state-level)
    incomeCsvData.forEach(row => {
      const areaType = (row.area_type || '').trim();
      const area = (row.area || '').trim();
      const incomeMean = row.income_mean || row.income_avg || '';
      
      if (area && incomeMean) {
        const income = parseFloat(incomeMean);
        if (!isNaN(income) && income > 0) {
          // Use district-level data if available, otherwise state-level as fallback
          if (areaType === 'district') {
            incomeData[area] = Math.round(income);
          } else if (areaType === 'state' && !incomeData[area]) {
            // Only use state-level if we don't have district-level data
            incomeData[area] = Math.round(income);
          }
        }
      }
    });
    console.log(`Loaded income data for ${Object.keys(incomeData).length} areas`);
    if (Object.keys(incomeData).length > 0) {
      console.log(`Sample areas: ${Object.keys(incomeData).slice(0, 5).join(', ')}`);
    }
  }
  
  console.log(`Enriching ${geojson.features.length} features with demographic data...`);
  
  // Enrich features
  let enrichedCount = 0;
  let missingDataCount = 0;
  let sampleKeys = [];
  
  geojson.features.forEach((feature, index) => {
    const props = feature.properties || {};
    
    // Get join key from feature properties (boundary-type specific)
    let joinKey;
    if (boundaryType === 'district') {
      joinKey = props.code_state_district || props.code;
    } else if (boundaryType === 'parliament') {
      joinKey = props.code_parlimen || props.code;
    } else if (boundaryType === 'dun') {
      joinKey = props.code_state_dun || props.code_dun || props.code;
    } else {
      joinKey = props.code_state_district || props.code_parlimen || props.code_state_dun || props.code_dun || props.code;
    }
    
    // Debug: collect sample keys
    if (index < 3) {
      sampleKeys.push({ joinKey, props: Object.keys(props) });
    }
    
    if (joinKey && latestData[joinKey]) {
      const demoData = latestData[joinKey];
      
      // Map CSV columns to expected properties
      const pop = parseInt(demoData.population_total || demoData.population || '0') || 0;
      // Fix: Remove commas from area_km2 before parsing (e.g., "9,062" -> 9062)
      const area = parseFloat((demoData.area_km2 || '1').replace(/,/g, '')) || 1;
      const density = pop / area;
      
      // Calculate night lights proxy (based on population density)
      const calculatedNightLights = Math.min(Math.round((density / 500) * 50), 100);
      
      // Calculate site suitability score (0-100) based on population and density
      const calculatedScore = Math.min(Math.round((density / 1000) * 50), 100);
      
      const preExistingNightLights = props.night_lights;
      const preExistingScore = props.site_suitability_score;
      
      feature.properties = {
        ...props,
        // Keep original DOSM properties
        id: props.code_state_district || props.code_parlimen || props.code_state_dun || props.code_dun || props.id || '',
        name: props.district || props.parlimen || props.dun || props.name || 'Unknown',
        
        // Add demographic data
        population: pop,
        avg_income: (() => {
          // Try income_avg from census data first (for parliament/DUN)
          if (demoData.income_avg) {
            return Math.round(parseFloat(demoData.income_avg) || 0);
          }
          // For districts, try district name first, then state name from HIES
          if (boundaryType === 'district') {
            const districtName = props.district || props.name;
            if (districtName && incomeData[districtName]) {
              return incomeData[districtName];
            }
            // Fallback to state-level income
            if (props.state && incomeData[props.state]) {
              return incomeData[props.state];
            }
          }
          return 0;
        })(),
        
        // Calculate derived metrics (if not available)
        competitors: props.competitors || Math.floor((parseInt(demoData.population_total || '0') || 0) / 5000),
        public_services: props.public_services || Math.floor((parseInt(demoData.population_total || '0') || 0) / 10000),
        
        // Calculate site suitability score (0-100) based on population and density
        site_suitability_score: preExistingScore || calculatedScore,
        
        // Calculate night lights proxy (based on population density)
        night_lights: preExistingNightLights || calculatedNightLights,
        
        // Mark as having census data
        hasCensusData: true,
      };
      
      enrichedCount++;
    } else {
      // No matching demographic data - use defaults and mark as missing
      feature.properties = {
        ...props,
        id: props.code_state_district || props.code_parlimen || props.code_state_dun || props.code_dun || props.id || '',
        name: props.district || props.parlimen || props.dun || props.name || 'Unknown',
        population: 0,
        avg_income: 0,
        competitors: 0,
        public_services: 0,
        site_suitability_score: 0,
        night_lights: 0,
        // Explicitly mark as missing census data
        hasCensusData: false,
      };
      
      missingDataCount++;
    }
  });
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Write enriched GeoJSON
  fs.writeFileSync(config.outputFile, JSON.stringify(geojson, null, 2));
  
  // Debug output
  if (enrichedCount === 0 && sampleKeys.length > 0) {
    console.log('\n⚠️  No matches found. Sample join keys from GeoJSON:');
    sampleKeys.forEach((sk, i) => {
      console.log(`  Feature ${i + 1}: joinKey="${sk.joinKey}", available keys: ${sk.props.join(', ')}`);
    });
    console.log(`\nSample join keys from CSV (first 5):`);
    const csvKeys = Object.keys(latestData).slice(0, 5);
    csvKeys.forEach(key => console.log(`  "${key}"`));
  }
  
  
  console.log(`✅ Enriched ${enrichedCount} of ${geojson.features.length} features`);
  console.log(`✅ Missing data: ${missingDataCount} features marked with hasCensusData: false`);
  console.log(`✅ Output written to ${config.outputFile}`);
}

// Main execution
const boundaryType = process.argv[2] || 'district';

if (boundaryType === 'all') {
  ['district', 'parliament', 'dun'].forEach(type => {
    console.log(`\n=== Processing ${type} ===`);
    enrichGeoJSON(type);
  });
} else {
  enrichGeoJSON(boundaryType);
}

