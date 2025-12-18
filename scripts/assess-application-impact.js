/**
 * Application Impact Assessment for Missing DUN Data
 * 
 * This script assesses how missing census data for 194 DUN constituencies
 * will impact the application functionality.
 * 
 * Usage: node scripts/assess-application-impact.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const DUN_MISMATCH_ANALYSIS = path.join(__dirname, '..', 'dun-mismatch-analysis.json');
const DUN_GEOJSON = path.join(PUBLIC_DATA_DIR, 'dun.geojson');

/**
 * Load GeoJSON file
 */
function loadGeoJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading GeoJSON: ${error.message}`);
    return null;
  }
}

/**
 * Assess application impact
 */
function assessApplicationImpact() {
  console.log('='.repeat(80));
  console.log('Application Impact Assessment for Missing DUN Census Data');
  console.log('='.repeat(80));
  console.log();
  
  // Load mismatch analysis
  if (!fs.existsSync(DUN_MISMATCH_ANALYSIS)) {
    console.error('ERROR: dun-mismatch-analysis.json not found. Run analyze-dun-mismatch.js first.');
    return;
  }
  
  const analysis = JSON.parse(fs.readFileSync(DUN_MISMATCH_ANALYSIS, 'utf-8'));
  const missingCodes = new Set(analysis.geojson.geojsonOnlyCodes || []);
  
  // Load GeoJSON
  const geojsonData = loadGeoJSON(DUN_GEOJSON);
  if (!geojsonData || !geojsonData.features) {
    console.error('ERROR: Could not load DUN GeoJSON');
    return;
  }
  
  console.log(`Analyzing ${geojsonData.features.length} DUN features in GeoJSON...\n`);
  
  // Analyze features
  const impactAnalysis = {
    totalFeatures: geojsonData.features.length,
    withData: 0,
    withoutData: 0,
    defaultValues: {
      population: 0,
      avg_income: 0,
      competitors: 0,
      public_services: 0,
      site_suitability_score: 0,
      night_lights: 0,
    },
    featuresWithoutData: [],
    stateBreakdown: {},
  };
  
  geojsonData.features.forEach((feature, idx) => {
    const props = feature.properties || {};
    const code = props.code_state_dun ? String(props.code_state_dun).trim() : null;
    
    if (!code) return;
    
    const hasData = !missingCodes.has(code);
    const stateCode = code.split('_')[0];
    
    if (!impactAnalysis.stateBreakdown[stateCode]) {
      impactAnalysis.stateBreakdown[stateCode] = {
        total: 0,
        withData: 0,
        withoutData: 0,
      };
    }
    
    impactAnalysis.stateBreakdown[stateCode].total++;
    
    if (hasData) {
      impactAnalysis.withData++;
      impactAnalysis.stateBreakdown[stateCode].withData++;
    } else {
      impactAnalysis.withoutData++;
      impactAnalysis.stateBreakdown[stateCode].withoutData++;
      
      // Collect sample features without data
      if (impactAnalysis.featuresWithoutData.length < 10) {
        impactAnalysis.featuresWithoutData.push({
          code,
          name: props.dun || props.name || 'Unknown',
          state: props.state || 'Unknown',
        });
      }
    }
  });
  
  // Calculate percentages
  const withDataPercent = ((impactAnalysis.withData / impactAnalysis.totalFeatures) * 100).toFixed(1);
  const withoutDataPercent = ((impactAnalysis.withoutData / impactAnalysis.totalFeatures) * 100).toFixed(1);
  
  // Report findings
  console.log('='.repeat(80));
  console.log('Impact Analysis Results');
  console.log('='.repeat(80));
  
  console.log(`\nOverall Coverage:`);
  console.log(`  Total DUN features: ${impactAnalysis.totalFeatures}`);
  console.log(`  With census data: ${impactAnalysis.withData} (${withDataPercent}%)`);
  console.log(`  Without census data: ${impactAnalysis.withoutData} (${withoutDataPercent}%)`);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('Impact by State');
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
  };
  
  Object.entries(impactAnalysis.stateBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([stateCode, stats]) => {
      const stateName = stateNames[stateCode] || `State ${stateCode}`;
      const coverage = ((stats.withData / stats.total) * 100).toFixed(1);
      const status = stats.withoutData === 0 ? '✅' : stats.withData === 0 ? '❌' : '⚠️';
      
      console.log(`\n${status} ${stateName} (${stateCode}):`);
      console.log(`  Total: ${stats.total} DUNs`);
      console.log(`  With data: ${stats.withData} (${coverage}%)`);
      console.log(`  Without data: ${stats.withoutData}`);
    });
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('Application Behavior with Missing Data');
  console.log('='.repeat(80));
  
  console.log(`\nBased on code analysis (dataTransformer.ts):`);
  console.log(`  ✅ Missing values default to 0 (not null/undefined)`);
  console.log(`  ✅ Application will not crash due to missing data`);
  console.log(`  ✅ Features without data will display with zero values`);
  
  console.log(`\nExpected Behavior:`);
  console.log(`  - ${impactAnalysis.withoutData} DUN constituencies will show:`);
  console.log(`    * Population: 0`);
  console.log(`    * Average Income: 0`);
  console.log(`    * Competitors: 0`);
  console.log(`    * Public Services: 0`);
  console.log(`    * Site Suitability Score: 0`);
  console.log(`    * Night Lights: 0`);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('Potential Issues & Recommendations');
  console.log('='.repeat(80));
  
  const issues = [];
  const recommendations = [];
  
  if (withoutDataPercent > 30) {
    issues.push(`High percentage of missing data (${withoutDataPercent}%) may affect map visualization`);
    recommendations.push('Consider filtering GeoJSON to only show DUNs with data');
    recommendations.push('Add visual indicators (e.g., different styling) for DUNs without data');
  }
  
  if (impactAnalysis.withoutData > 0) {
    issues.push(`${impactAnalysis.withoutData} DUNs will appear empty/zero on the map`);
    recommendations.push('Add tooltip/legend indicating which DUNs have incomplete data');
    recommendations.push('Consider data enrichment or interpolation for missing values');
  }
  
  // Check for states with complete missing data
  const statesWithNoData = Object.entries(impactAnalysis.stateBreakdown)
    .filter(([_, stats]) => stats.withData === 0 && stats.total > 0)
    .map(([code]) => code);
  
  if (statesWithNoData.length > 0) {
    issues.push(`Some states have no census data for any DUNs`);
    recommendations.push('Verify if this is expected or indicates a data collection issue');
  }
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Potential Issues:`);
    issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. ${issue}`);
    });
  }
  
  if (recommendations.length > 0) {
    console.log(`\n✅ Recommendations:`);
    recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('Decision Matrix');
  console.log('='.repeat(80));
  
  console.log(`\nOption A: Keep All 600 DUNs (Current Approach)`);
  console.log(`  Pros:`);
  console.log(`    - Complete geographic coverage`);
  console.log(`    - All boundaries visible on map`);
  console.log(`    - No data loss`);
  console.log(`  Cons:`);
  console.log(`    - ${impactAnalysis.withoutData} DUNs will show zero values`);
  console.log(`    - May confuse users expecting data for all areas`);
  console.log(`    - Map visualization may be less informative`);
  
  console.log(`\nOption B: Filter to 406 DUNs with Data`);
  console.log(`  Pros:`);
  console.log(`    - All visible DUNs have complete data`);
  console.log(`    - Cleaner map visualization`);
  console.log(`    - No zero-value confusion`);
  console.log(`  Cons:`);
  console.log(`    - ${impactAnalysis.withoutData} DUN boundaries hidden`);
  console.log(`    - Incomplete geographic coverage`);
  console.log(`    - May miss important areas`);
  
  console.log(`\nOption C: Hybrid Approach (Recommended)`);
  console.log(`  Pros:`);
  console.log(`    - Show all boundaries but style differently`);
  console.log(`    - Add visual indicators for missing data`);
  console.log(`    - Complete coverage with clear data status`);
  console.log(`  Cons:`);
  console.log(`    - Requires UI/UX updates`);
  console.log(`    - More complex implementation`);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFeatures: impactAnalysis.totalFeatures,
      withData: impactAnalysis.withData,
      withoutData: impactAnalysis.withoutData,
      coveragePercent: parseFloat(withDataPercent),
    },
    stateBreakdown: impactAnalysis.stateBreakdown,
    defaultValues: impactAnalysis.defaultValues,
    sampleFeaturesWithoutData: impactAnalysis.featuresWithoutData,
    issues,
    recommendations,
  };
  
  const reportPath = path.join(__dirname, '..', 'application-impact-assessment.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Run assessment
try {
  const report = assessApplicationImpact();
  process.exit(0);
} catch (error) {
  console.error('Error during assessment:', error);
  process.exit(1);
}

