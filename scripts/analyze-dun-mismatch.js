/**
 * Detailed Analysis Script: DUN Dataset Mismatch Investigation
 * 
 * This script performs a deep dive into the DUN dataset mismatch to understand:
 * 1. Why GeoJSON has 600 features but census CSV has 406 unique codes
 * 2. Which codes are missing from census data
 * 3. Whether the mismatch is expected or indicates a data issue
 * 
 * Usage: node scripts/analyze-dun-mismatch.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const DOSM_DATA_DIR = path.join(__dirname, '..', 'dosm-data', 'data-open', 'datasets');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');

const CENSUS_DUN_CSV = path.join(DOSM_DATA_DIR, 'census', 'census_dun.csv');
const DUN_GEOJSON = path.join(PUBLIC_DATA_DIR, 'dun.geojson');
const SOURCE_DUN_GEOJSON = path.join(DOSM_DATA_DIR, 'geodata', 'electoral_1_dun.geojson');
const MAPPING_FILE = path.join(DOSM_DATA_DIR, 'geodata', 'state_parlimen_dun.csv');

/**
 * Parse CSV file and return array of objects
 */
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      rows.push(row);
    }
  }
  
  return rows;
}

/**
 * Load GeoJSON file
 */
function loadGeoJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading GeoJSON ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Main analysis function
 */
function analyzeDunMismatch() {
  console.log('='.repeat(80));
  console.log('DUN Dataset Mismatch Analysis');
  console.log('='.repeat(80));
  console.log();
  
  // Load census CSV
  console.log('Loading Census CSV...');
  const censusData = parseCSV(CENSUS_DUN_CSV);
  if (!censusData || censusData.length === 0) {
    console.error('ERROR: Could not load census CSV');
    return;
  }
  console.log(`  Loaded ${censusData.length} records`);
  
  // Extract codes from census CSV
  const censusCodes = new Set();
  const censusCodeMap = new Map(); // code -> array of records
  
  censusData.forEach((row, idx) => {
    const code = row.code_state_dun?.trim();
    if (code) {
      censusCodes.add(code);
      if (!censusCodeMap.has(code)) {
        censusCodeMap.set(code, []);
      }
      censusCodeMap.get(code).push({
        index: idx,
        row: row,
      });
    }
  });
  
  console.log(`  Unique code_state_dun codes: ${censusCodes.size}`);
  
  // Check for duplicate codes in census
  const duplicateCodes = Array.from(censusCodeMap.entries())
    .filter(([code, records]) => records.length > 1)
    .map(([code, records]) => ({ code, count: records.length }));
  
  if (duplicateCodes.length > 0) {
    console.log(`  ⚠️  Found ${duplicateCodes.length} codes with multiple records:`);
    duplicateCodes.slice(0, 10).forEach(({ code, count }) => {
      console.log(`    - ${code}: ${count} records`);
    });
    if (duplicateCodes.length > 10) {
      console.log(`    ... and ${duplicateCodes.length - 10} more`);
    }
  }
  
  // Load GeoJSON
  console.log('\nLoading GeoJSON...');
  const geojsonFile = fs.existsSync(DUN_GEOJSON) ? DUN_GEOJSON : SOURCE_DUN_GEOJSON;
  const geojsonData = loadGeoJSON(geojsonFile);
  if (!geojsonData || !geojsonData.features) {
    console.error('ERROR: Could not load GeoJSON');
    return;
  }
  console.log(`  Loaded ${geojsonData.features.length} features from ${path.basename(geojsonFile)}`);
  
  // Extract codes from GeoJSON
  const geojsonCodes = new Set();
  const geojsonCodeMap = new Map(); // code -> array of features
  
  geojsonData.features.forEach((feature, idx) => {
    const props = feature.properties || {};
    const code = props.code_state_dun ? String(props.code_state_dun).trim() : null;
    
    if (code) {
      geojsonCodes.add(code);
      if (!geojsonCodeMap.has(code)) {
        geojsonCodeMap.set(code, []);
      }
      geojsonCodeMap.get(code).push({
        index: idx,
        feature: feature,
        props: props,
      });
    } else {
      // Check for alternative code fields
      const altCode = props.code_dun || props.code || props.id;
      if (altCode) {
        console.log(`  ⚠️  Feature ${idx} missing code_state_dun, has: ${JSON.stringify(Object.keys(props))}`);
      }
    }
  });
  
  console.log(`  Unique code_state_dun codes: ${geojsonCodes.size}`);
  
  // Check for duplicate codes in GeoJSON
  const duplicateGeoJsonCodes = Array.from(geojsonCodeMap.entries())
    .filter(([code, features]) => features.length > 1)
    .map(([code, features]) => ({ code, count: features.length }));
  
  if (duplicateGeoJsonCodes.length > 0) {
    console.log(`  ⚠️  Found ${duplicateGeoJsonCodes.length} codes with multiple features:`);
    duplicateGeoJsonCodes.slice(0, 10).forEach(([code, count]) => {
      console.log(`    - ${code}: ${count} features`);
    });
    if (duplicateGeoJsonCodes.length > 10) {
      console.log(`    ... and ${duplicateGeoJsonCodes.length - 10} more`);
    }
  }
  
  // Compare codes
  console.log('\n' + '='.repeat(80));
  console.log('Code Comparison');
  console.log('='.repeat(80));
  
  const csvOnly = Array.from(censusCodes).filter(c => !geojsonCodes.has(c));
  const geojsonOnly = Array.from(geojsonCodes).filter(c => !censusCodes.has(c));
  const common = Array.from(censusCodes).filter(c => geojsonCodes.has(c));
  
  console.log(`\nCommon codes (in both): ${common.length}`);
  console.log(`CSV only codes: ${csvOnly.length}`);
  console.log(`GeoJSON only codes: ${geojsonOnly.length}`);
  
  // Analyze CSV-only codes
  if (csvOnly.length > 0) {
    console.log(`\n📋 Codes in CSV but NOT in GeoJSON (${csvOnly.length}):`);
    csvOnly.slice(0, 20).forEach(code => {
      const records = censusCodeMap.get(code);
      const sample = records[0].row;
      console.log(`  - ${code}: ${sample.dun || 'N/A'} (${sample.state || 'N/A'})`);
    });
    if (csvOnly.length > 20) {
      console.log(`  ... and ${csvOnly.length - 20} more`);
    }
  }
  
  // Analyze GeoJSON-only codes
  if (geojsonOnly.length > 0) {
    console.log(`\n🗺️  Codes in GeoJSON but NOT in CSV (${geojsonOnly.length}):`);
    
    // Group by state code (first part before underscore)
    const byState = new Map();
    geojsonOnly.forEach(code => {
      const stateCode = code.split('_')[0];
      if (!byState.has(stateCode)) {
        byState.set(stateCode, []);
      }
      byState.get(stateCode).push(code);
    });
    
    console.log(`\n  Grouped by state:`);
    Array.from(byState.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([stateCode, codes]) => {
        console.log(`    State ${stateCode}: ${codes.length} codes`);
        codes.slice(0, 5).forEach(code => {
          const features = geojsonCodeMap.get(code);
          if (features && features.length > 0) {
            const props = features[0].props;
            console.log(`      - ${code}: ${props.dun || props.name || 'N/A'}`);
          } else {
            console.log(`      - ${code}`);
          }
        });
        if (codes.length > 5) {
          console.log(`      ... and ${codes.length - 5} more`);
        }
      });
  }
  
  // Load mapping file to understand relationships
  console.log('\n' + '='.repeat(80));
  console.log('Mapping File Analysis');
  console.log('='.repeat(80));
  
  const mappingData = parseCSV(MAPPING_FILE);
  let mappingCodesSet = null;
  
  if (mappingData) {
    console.log(`\nLoaded ${mappingData.length} mappings from state_parlimen_dun.csv`);
    
    mappingCodesSet = new Set();
    mappingData.forEach(row => {
      const code = row.code_state_dun?.trim();
      if (code) {
        mappingCodesSet.add(code);
      }
    });
    
    console.log(`  Unique code_state_dun in mapping: ${mappingCodesSet.size}`);
    
    // Compare mapping with census and GeoJSON
    const mappingOnly = Array.from(mappingCodesSet).filter(c => !censusCodes.has(c) && !geojsonCodes.has(c));
    const mappingInCensus = Array.from(mappingCodesSet).filter(c => censusCodes.has(c));
    const mappingInGeoJson = Array.from(mappingCodesSet).filter(c => geojsonCodes.has(c));
    
    console.log(`  Mappings in census CSV: ${mappingInCensus.length}`);
    console.log(`  Mappings in GeoJSON: ${mappingInGeoJson.length}`);
    console.log(`  Mappings in neither: ${mappingOnly.length}`);
    
    if (mappingOnly.length > 0) {
      console.log(`\n  ⚠️  Codes in mapping but not in census or GeoJSON:`);
      mappingOnly.slice(0, 10).forEach(code => {
        const mapping = mappingData.find(r => r.code_state_dun?.trim() === code);
        if (mapping) {
          console.log(`    - ${code}: ${mapping.dun || 'N/A'} (${mapping.state || 'N/A'})`);
        }
      });
    }
  }
  
  // Summary and recommendations
  console.log('\n' + '='.repeat(80));
  console.log('Summary & Recommendations');
  console.log('='.repeat(80));
  
  console.log(`\nKey Findings:`);
  console.log(`  1. Census CSV has ${censusCodes.size} unique DUN codes`);
  console.log(`  2. GeoJSON has ${geojsonCodes.size} unique DUN codes`);
  console.log(`  3. ${common.length} codes are present in both datasets`);
  console.log(`  4. ${csvOnly.length} codes exist only in census CSV`);
  console.log(`  5. ${geojsonOnly.length} codes exist only in GeoJSON`);
  
  if (geojsonOnly.length > 0) {
    console.log(`\n⚠️  Potential Issues:`);
    console.log(`  - ${geojsonOnly.length} DUN constituencies in GeoJSON have no census data`);
    console.log(`  - This could indicate:`);
    console.log(`    a) Census data is incomplete (missing some constituencies)`);
    console.log(`    b) GeoJSON includes deprecated/redistricted constituencies`);
    console.log(`    c) Some constituencies were created after the census year`);
    console.log(`    d) Data allocation issue during processing`);
    
    console.log(`\n✅ Recommended Actions:`);
    console.log(`  1. Verify if missing codes are valid constituencies or errors`);
    console.log(`  2. Check if census data needs to be updated`);
    console.log(`  3. Consider filtering GeoJSON to only include constituencies with census data`);
    console.log(`  4. Review state_parlimen_dun.csv to understand constituency relationships`);
  }
  
  if (csvOnly.length > 0) {
    console.log(`\n⚠️  Additional Issue:`);
    console.log(`  - ${csvOnly.length} DUN codes in census CSV are missing from GeoJSON`);
    console.log(`  - This suggests GeoJSON boundaries may be incomplete`);
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    census: {
      totalRecords: censusData.length,
      uniqueCodes: censusCodes.size,
      duplicateCodes: duplicateCodes,
      csvOnlyCodes: csvOnly,
    },
    geojson: {
      totalFeatures: geojsonData.features.length,
      uniqueCodes: geojsonCodes.size,
      duplicateCodes: duplicateGeoJsonCodes,
      geojsonOnlyCodes: geojsonOnly,
    },
    comparison: {
      commonCodes: common.length,
      csvOnlyCount: csvOnly.length,
      geojsonOnlyCount: geojsonOnly.length,
    },
    mapping: mappingData ? {
      totalMappings: mappingData.length,
      uniqueCodes: mappingCodesSet ? mappingCodesSet.size : 0,
    } : null,
  };
  
  const reportPath = path.join(__dirname, '..', 'dun-mismatch-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Run analysis
try {
  const report = analyzeDunMismatch();
  process.exit(0);
} catch (error) {
  console.error('Error during analysis:', error);
  process.exit(1);
}

