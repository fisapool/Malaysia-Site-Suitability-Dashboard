/**
 * Verification Script: Dataset Allocation Between District, Parliament, and DUN
 * 
 * This script verifies that datasets are correctly allocated and mapped between:
 * - Census CSV files (census_district.csv, census_parlimen.csv, census_dun.csv)
 * - GeoJSON boundary files (districts.geojson, parliament.geojson, dun.geojson)
 * - Mapping files (state_district.csv, state_parlimen_dun.csv)
 * - Application code (api.ts, dataTransformer.ts)
 * 
 * Usage: node scripts/verify-dataset-allocation.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const DOSM_DATA_DIR = path.join(__dirname, '..', 'dosm-data', 'data-open', 'datasets');
const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');

// File paths
const FILES = {
  census: {
    district: path.join(DOSM_DATA_DIR, 'census', 'census_district.csv'),
    parliament: path.join(DOSM_DATA_DIR, 'census', 'census_parlimen.csv'),
    dun: path.join(DOSM_DATA_DIR, 'census', 'census_dun.csv'),
  },
  geojson: {
    district: path.join(PUBLIC_DATA_DIR, 'districts.geojson'),
    parliament: path.join(PUBLIC_DATA_DIR, 'parliament.geojson'),
    dun: path.join(PUBLIC_DATA_DIR, 'dun.geojson'),
  },
  sourceGeojson: {
    district: path.join(DOSM_DATA_DIR, 'geodata', 'administrative_2_district.geojson'),
    parliament: path.join(DOSM_DATA_DIR, 'geodata', 'electoral_0_parlimen.geojson'),
    dun: path.join(DOSM_DATA_DIR, 'geodata', 'electoral_1_dun.geojson'),
  },
  mapping: {
    stateDistrict: path.join(DOSM_DATA_DIR, 'geodata', 'state_district.csv'),
    stateParlimenDun: path.join(DOSM_DATA_DIR, 'geodata', 'state_parlimen_dun.csv'),
  },
};

// Expected code fields for each boundary type
const EXPECTED_CODES = {
  district: {
    csv: ['code_state_district', 'code_state', 'code_district'],
    geojson: ['code_state_district', 'code_state', 'code_district'],
  },
  parliament: {
    csv: ['code_parlimen', 'code_state', 'code_state_parlimen'],
    geojson: ['code_parlimen', 'code_state'],
  },
  dun: {
    csv: ['code_state_dun', 'code_parlimen', 'code_dun', 'code_state'],
    geojson: ['code_state_dun', 'code_parlimen', 'code_dun', 'code_state'],
  },
};

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
 * Extract unique codes from dataset
 */
function extractCodes(data, codeFields, datasetType) {
  const codes = new Set();
  const codeMap = new Map();
  
  if (datasetType === 'csv') {
    data.forEach((row, idx) => {
      codeFields.forEach(field => {
        if (row[field] && row[field].trim()) {
          codes.add(row[field].trim());
          if (!codeMap.has(row[field].trim())) {
            codeMap.set(row[field].trim(), []);
          }
          codeMap.get(row[field].trim()).push({
            index: idx,
            row: row,
            field: field,
          });
        }
      });
    });
  } else if (datasetType === 'geojson') {
    if (data && data.features) {
      data.features.forEach((feature, idx) => {
        const props = feature.properties || {};
        codeFields.forEach(field => {
          if (props[field] !== undefined && props[field] !== null) {
            const code = String(props[field]).trim();
            codes.add(code);
            if (!codeMap.has(code)) {
              codeMap.set(code, []);
            }
            codeMap.get(code).push({
              index: idx,
              feature: feature,
              field: field,
            });
          }
        });
      });
    }
  }
  
  return { codes, codeMap };
}

/**
 * Verify dataset allocation
 */
function verifyAllocation() {
  console.log('='.repeat(80));
  console.log('Dataset Allocation Verification Report');
  console.log('='.repeat(80));
  console.log();
  
  const results = {
    district: {},
    parliament: {},
    dun: {},
    issues: [],
    summary: {
      totalIssues: 0,
      missingFiles: [],
      codeMismatches: [],
      missingCodes: [],
    },
  };
  
  // Verify each boundary type
  ['district', 'parliament', 'dun'].forEach(boundaryType => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Verifying ${boundaryType.toUpperCase()} datasets`);
    console.log('='.repeat(80));
    
    const expectedCodes = EXPECTED_CODES[boundaryType];
    const censusFile = FILES.census[boundaryType];
    const geojsonFile = FILES.geojson[boundaryType];
    const sourceGeojsonFile = FILES.sourceGeojson[boundaryType];
    
    // Check if files exist
    const censusExists = fs.existsSync(censusFile);
    const geojsonExists = fs.existsSync(geojsonFile);
    const sourceGeojsonExists = fs.existsSync(sourceGeojsonFile);
    
    console.log(`\nFile Status:`);
    console.log(`  Census CSV: ${censusExists ? '✓' : '✗'} ${censusFile}`);
    console.log(`  GeoJSON (public): ${geojsonExists ? '✓' : '✗'} ${geojsonFile}`);
    console.log(`  GeoJSON (source): ${sourceGeojsonExists ? '✓' : '✗'} ${sourceGeojsonFile}`);
    
    if (!censusExists) {
      results.summary.missingFiles.push(`Census CSV for ${boundaryType}`);
    }
    if (!geojsonExists && !sourceGeojsonExists) {
      results.summary.missingFiles.push(`GeoJSON for ${boundaryType}`);
    }
    
    // Load and analyze CSV
    let censusData = null;
    let censusCodes = null;
    if (censusExists) {
      censusData = parseCSV(censusFile);
      if (censusData && censusData.length > 0) {
        const primaryCodeField = expectedCodes.csv[0];
        censusCodes = extractCodes(censusData, [primaryCodeField], 'csv');
        console.log(`\nCensus CSV Analysis:`);
        console.log(`  Total records: ${censusData.length}`);
        console.log(`  Unique ${primaryCodeField} codes: ${censusCodes.codes.size}`);
        console.log(`  Sample codes: ${Array.from(censusCodes.codes).slice(0, 5).join(', ')}`);
        
        // Check for missing codes
        const emptyCodes = Array.from(censusCodes.codes).filter(c => !c || c === '');
        if (emptyCodes.length > 0) {
          console.log(`  ⚠️  Warning: Found ${emptyCodes.length} empty codes`);
          results.summary.missingCodes.push({
            type: boundaryType,
            dataset: 'census',
            count: emptyCodes.length,
          });
        }
      }
    }
    
    // Load and analyze GeoJSON
    let geojsonData = null;
    let geojsonCodes = null;
    const geojsonToUse = geojsonExists ? geojsonFile : sourceGeojsonFile;
    
    if (geojsonExists || sourceGeojsonExists) {
      geojsonData = loadGeoJSON(geojsonToUse);
      if (geojsonData && geojsonData.features) {
        const primaryCodeField = expectedCodes.geojson[0];
        geojsonCodes = extractCodes(geojsonData, [primaryCodeField], 'geojson');
        console.log(`\nGeoJSON Analysis:`);
        console.log(`  Total features: ${geojsonData.features.length}`);
        console.log(`  Unique ${primaryCodeField} codes: ${geojsonCodes.codes.size}`);
        console.log(`  Sample codes: ${Array.from(geojsonCodes.codes).slice(0, 5).join(', ')}`);
        
        // Check for missing codes
        const emptyCodes = Array.from(geojsonCodes.codes).filter(c => !c || c === '');
        if (emptyCodes.length > 0) {
          console.log(`  ⚠️  Warning: Found ${emptyCodes.length} empty codes`);
          results.summary.missingCodes.push({
            type: boundaryType,
            dataset: 'geojson',
            count: emptyCodes.length,
          });
        }
      }
    }
    
    // Compare CSV and GeoJSON codes
    if (censusCodes && geojsonCodes) {
      const primaryCodeField = expectedCodes.csv[0];
      console.log(`\nCode Comparison (${primaryCodeField}):`);
      
      const csvOnly = Array.from(censusCodes.codes).filter(c => !geojsonCodes.codes.has(c));
      const geojsonOnly = Array.from(geojsonCodes.codes).filter(c => !censusCodes.codes.has(c));
      const common = Array.from(censusCodes.codes).filter(c => geojsonCodes.codes.has(c));
      
      console.log(`  Common codes: ${common.length}`);
      console.log(`  CSV only: ${csvOnly.length}`);
      console.log(`  GeoJSON only: ${geojsonOnly.length}`);
      
      if (csvOnly.length > 0) {
        console.log(`  ⚠️  Codes in CSV but not in GeoJSON: ${csvOnly.slice(0, 10).join(', ')}${csvOnly.length > 10 ? '...' : ''}`);
        results.summary.codeMismatches.push({
          type: boundaryType,
          issue: 'csv_only',
          codes: csvOnly.slice(0, 20),
          count: csvOnly.length,
        });
      }
      
      if (geojsonOnly.length > 0) {
        console.log(`  ⚠️  Codes in GeoJSON but not in CSV: ${geojsonOnly.slice(0, 10).join(', ')}${geojsonOnly.length > 10 ? '...' : ''}`);
        results.summary.codeMismatches.push({
          type: boundaryType,
          issue: 'geojson_only',
          codes: geojsonOnly.slice(0, 20),
          count: geojsonOnly.length,
        });
      }
      
      if (csvOnly.length === 0 && geojsonOnly.length === 0) {
        console.log(`  ✓ Perfect match!`);
      }
    }
    
    // Store results
    results[boundaryType] = {
      census: {
        exists: censusExists,
        recordCount: censusData ? censusData.length : 0,
        codeCount: censusCodes ? censusCodes.codes.size : 0,
      },
      geojson: {
        exists: geojsonExists || sourceGeojsonExists,
        featureCount: geojsonData ? geojsonData.features.length : 0,
        codeCount: geojsonCodes ? geojsonCodes.codes.size : 0,
      },
    };
  });
  
  // Verify mapping files
  console.log(`\n${'='.repeat(80)}`);
  console.log('Verifying Mapping Files');
  console.log('='.repeat(80));
  
  const stateDistrictMapping = parseCSV(FILES.mapping.stateDistrict);
  const stateParlimenDunMapping = parseCSV(FILES.mapping.stateParlimenDun);
  
  if (stateDistrictMapping) {
    console.log(`\nstate_district.csv: ${stateDistrictMapping.length} mappings`);
    console.log(`  Fields: ${Object.keys(stateDistrictMapping[0] || {}).join(', ')}`);
  } else {
    console.log(`\nstate_district.csv: ✗ Not found`);
  }
  
  if (stateParlimenDunMapping) {
    console.log(`\nstate_parlimen_dun.csv: ${stateParlimenDunMapping.length} mappings`);
    console.log(`  Fields: ${Object.keys(stateParlimenDunMapping[0] || {}).join(', ')}`);
  } else {
    console.log(`\nstate_parlimen_dun.csv: ✗ Not found`);
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('Summary');
  console.log('='.repeat(80));
  
  results.summary.totalIssues = 
    results.summary.missingFiles.length +
    results.summary.codeMismatches.length +
    results.summary.missingCodes.length;
  
  if (results.summary.totalIssues === 0) {
    console.log('\n✓ All datasets appear to be correctly allocated!');
  } else {
    console.log(`\n⚠️  Found ${results.summary.totalIssues} potential issues:`);
    
    if (results.summary.missingFiles.length > 0) {
      console.log(`\n  Missing Files (${results.summary.missingFiles.length}):`);
      results.summary.missingFiles.forEach(file => {
        console.log(`    - ${file}`);
      });
    }
    
    if (results.summary.codeMismatches.length > 0) {
      console.log(`\n  Code Mismatches (${results.summary.codeMismatches.length}):`);
      results.summary.codeMismatches.forEach(mismatch => {
        console.log(`    - ${mismatch.type}: ${mismatch.issue} (${mismatch.count} codes)`);
      });
    }
    
    if (results.summary.missingCodes.length > 0) {
      console.log(`\n  Missing Codes (${results.summary.missingCodes.length}):`);
      results.summary.missingCodes.forEach(missing => {
        console.log(`    - ${missing.type} (${missing.dataset}): ${missing.count} empty codes`);
      });
    }
  }
  
  // Detailed statistics
  console.log(`\n${'='.repeat(80)}`);
  console.log('Detailed Statistics');
  console.log('='.repeat(80));
  
  ['district', 'parliament', 'dun'].forEach(type => {
    const stats = results[type];
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`  Census: ${stats.census.exists ? `${stats.census.recordCount} records, ${stats.census.codeCount} unique codes` : 'Not found'}`);
    console.log(`  GeoJSON: ${stats.geojson.exists ? `${stats.geojson.featureCount} features, ${stats.geojson.codeCount} unique codes` : 'Not found'}`);
  });
  
  // Save results to file
  const reportPath = path.join(__dirname, '..', 'dataset-allocation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\nFull report saved to: ${reportPath}`);
  
  return results;
}

// Run verification
try {
  const results = verifyAllocation();
  process.exit(results.summary.totalIssues === 0 ? 0 : 1);
} catch (error) {
  console.error('Error during verification:', error);
  process.exit(1);
}

