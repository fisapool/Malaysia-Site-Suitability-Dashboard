/**
 * Verify Data Completeness for Missing DUN Codes
 * 
 * This script helps verify if the 194 missing DUN codes are valid constituencies
 * and whether census data should exist for them.
 * 
 * Usage: node scripts/verify-data-completeness.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOSM_DATA_DIR = path.join(__dirname, '..', 'dosm-data', 'data-open', 'datasets');
const DUN_MISMATCH_ANALYSIS = path.join(__dirname, '..', 'dun-mismatch-analysis.json');
const MAPPING_FILE = path.join(DOSM_DATA_DIR, 'geodata', 'state_parlimen_dun.csv');
const CENSUS_DUN_CSV = path.join(DOSM_DATA_DIR, 'census', 'census_dun.csv');

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return null;
  
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
 * Main verification function
 */
function verifyDataCompleteness() {
  console.log('='.repeat(80));
  console.log('Data Completeness Verification for Missing DUN Codes');
  console.log('='.repeat(80));
  console.log();
  
  // Load mismatch analysis
  if (!fs.existsSync(DUN_MISMATCH_ANALYSIS)) {
    console.error('ERROR: dun-mismatch-analysis.json not found. Run analyze-dun-mismatch.js first.');
    return;
  }
  
  const analysis = JSON.parse(fs.readFileSync(DUN_MISMATCH_ANALYSIS, 'utf-8'));
  const missingCodes = analysis.geojson.geojsonOnlyCodes || [];
  
  console.log(`Analyzing ${missingCodes.length} missing DUN codes...\n`);
  
  // Load mapping file
  const mappingData = parseCSV(MAPPING_FILE);
  if (!mappingData) {
    console.error('ERROR: Could not load mapping file');
    return;
  }
  
  // Load census data to check year
  const censusData = parseCSV(CENSUS_DUN_CSV);
  const censusYear = censusData && censusData.length > 0 ? censusData[0].year : 'Unknown';
  
  console.log(`Census Data Year: ${censusYear}`);
  console.log(`Total DUN constituencies in mapping: ${new Set(mappingData.map(r => r.code_state_dun?.trim())).size}`);
  console.log();
  
  // Verify each missing code
  const verificationResults = {
    validInMapping: [],
    notInMapping: [],
    byState: {},
    byParliament: {},
  };
  
  const mappingByCode = new Map();
  mappingData.forEach(row => {
    const code = row.code_state_dun?.trim();
    if (code) {
      mappingByCode.set(code, row);
    }
  });
  
  missingCodes.forEach(code => {
    const mapping = mappingByCode.get(code);
    
    if (mapping) {
      verificationResults.validInMapping.push({
        code,
        state: mapping.state,
        parliament: mapping.parlimen,
        dun: mapping.dun,
        code_parlimen: mapping.code_parlimen,
      });
      
      // Group by state
      const stateCode = code.split('_')[0];
      if (!verificationResults.byState[stateCode]) {
        verificationResults.byState[stateCode] = [];
      }
      verificationResults.byState[stateCode].push({
        code,
        dun: mapping.dun,
        parliament: mapping.parlimen,
      });
      
      // Group by parliament
      const parlimenCode = mapping.code_parlimen;
      if (parlimenCode) {
        if (!verificationResults.byParliament[parlimenCode]) {
          verificationResults.byParliament[parlimenCode] = [];
        }
        verificationResults.byParliament[parlimenCode].push({
          code,
          dun: mapping.dun,
          state: mapping.state,
        });
      }
    } else {
      verificationResults.notInMapping.push(code);
    }
  });
  
  // Report results
  console.log('='.repeat(80));
  console.log('Verification Results');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Valid in Mapping File: ${verificationResults.validInMapping.length} codes`);
  console.log(`   These are legitimate DUN constituencies that exist in the mapping file.`);
  console.log(`   Census data should exist for these if they were active during ${censusYear}.`);
  
  if (verificationResults.notInMapping.length > 0) {
    console.log(`\n⚠️  Not in Mapping File: ${verificationResults.notInMapping.length} codes`);
    console.log(`   These codes exist in GeoJSON but not in the mapping file.`);
    console.log(`   They may be deprecated, invalid, or newly created constituencies.`);
    console.log(`   Sample codes: ${verificationResults.notInMapping.slice(0, 10).join(', ')}`);
  }
  
  // Analysis by state
  console.log(`\n${'='.repeat(80)}`);
  console.log('Missing Codes by State');
  console.log('='.repeat(80));
  
  const stateNames = {
    '1': 'Johor',
    '2': 'Kedah',
    '3': 'Kelantan',
    '4': 'Melaka',
    '5': 'Negeri Sembilan',
    '6': 'Pahang',
    '7': 'Pulau Pinang',
    '8': 'Perak',
    '9': 'Perlis',
    '10': 'Selangor',
    '11': 'Terengganu',
    '12': 'Sabah',
    '13': 'Sarawak',
    '14': 'WP Kuala Lumpur',
    '15': 'WP Labuan',
    '16': 'WP Putrajaya',
  };
  
  Object.entries(verificationResults.byState)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([stateCode, codes]) => {
      const stateName = stateNames[stateCode] || `State ${stateCode}`;
      console.log(`\n${stateName} (${stateCode}): ${codes.length} missing DUN codes`);
      
      // Check if parliament constituencies have other DUNs with data
      const parlimenGroups = {};
      codes.forEach(({ code, parliament }) => {
        if (!parlimenGroups[parliament]) {
          parlimenGroups[parliament] = [];
        }
        parlimenGroups[parliament].push(code);
      });
      
      // Show parliament-level breakdown
      Object.entries(parlimenGroups)
        .slice(0, 3)
        .forEach(([parlimen, dunCodes]) => {
          console.log(`  ${parlimen}: ${dunCodes.length} DUNs missing data`);
        });
      if (Object.keys(parlimenGroups).length > 3) {
        console.log(`  ... and ${Object.keys(parlimenGroups).length - 3} more parliament constituencies`);
      }
    });
  
  // Check if parliament constituencies have partial data
  console.log(`\n${'='.repeat(80)}`);
  console.log('Parliament Constituencies with Partial DUN Data');
  console.log('='.repeat(80));
  
  const parlimenWithMissing = Object.entries(verificationResults.byParliament)
    .filter(([_, codes]) => codes.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  
  console.log(`\nFound ${parlimenWithMissing.length} parliament constituencies with missing DUN data:`);
  
  // Count DUNs per parliament
  const parlimenStats = {};
  mappingData.forEach(row => {
    const parlimen = row.code_parlimen;
    if (parlimen) {
      if (!parlimenStats[parlimen]) {
        parlimenStats[parlimen] = { total: 0, withData: 0, missing: 0 };
      }
      parlimenStats[parlimen].total++;
      
      const dunCode = row.code_state_dun?.trim();
      if (censusData && censusData.some(r => r.code_state_dun?.trim() === dunCode)) {
        parlimenStats[parlimen].withData++;
      } else {
        parlimenStats[parlimen].missing++;
      }
    }
  });
  
  // Show parliament constituencies with partial coverage
  const partialCoverage = Object.entries(parlimenStats)
    .filter(([_, stats]) => stats.missing > 0 && stats.withData > 0)
    .sort(([_, a], [__, b]) => b.missing - a.missing)
    .slice(0, 10);
  
  if (partialCoverage.length > 0) {
    console.log(`\nParliament constituencies with partial DUN data coverage:`);
    partialCoverage.forEach(([parlimen, stats]) => {
      const mapping = mappingData.find(r => r.code_parlimen === parlimen);
      console.log(`  ${parlimen} (${mapping?.parlimen || 'Unknown'}): ${stats.withData}/${stats.total} DUNs have data (${stats.missing} missing)`);
    });
  }
  
  // Recommendations
  console.log(`\n${'='.repeat(80)}`);
  console.log('Recommendations');
  console.log('='.repeat(80));
  
  console.log(`\n1. Data Completeness Status:`);
  console.log(`   - ${verificationResults.validInMapping.length} missing codes are valid constituencies`);
  console.log(`   - These should have census data if they existed in ${censusYear}`);
  console.log(`   - Missing data may be due to:`);
  console.log(`     * Constituencies created after ${censusYear}`);
  console.log(`     * Incomplete data collection`);
  console.log(`     * Administrative boundaries without population`);
  
  console.log(`\n2. Next Steps:`);
  console.log(`   - Review DOSM documentation for expected census coverage`);
  console.log(`   - Check if additional census files exist for missing constituencies`);
  console.log(`   - Verify if missing constituencies were active in ${censusYear}`);
  console.log(`   - Consider if missing data is acceptable for your use case`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    censusYear,
    totalMissingCodes: missingCodes.length,
    validInMapping: verificationResults.validInMapping.length,
    notInMapping: verificationResults.notInMapping.length,
    byState: verificationResults.byState,
    byParliament: verificationResults.byParliament,
    parlimenStats: Object.fromEntries(
      Object.entries(parlimenStats).filter(([_, stats]) => stats.missing > 0)
    ),
  };
  
  const reportPath = path.join(__dirname, '..', 'data-completeness-verification.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Run verification
try {
  const report = verifyDataCompleteness();
  process.exit(0);
} catch (error) {
  console.error('Error during verification:', error);
  process.exit(1);
}

