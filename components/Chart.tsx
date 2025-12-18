
import React, { useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DistrictProperties, DistrictFeature, DataLayerId } from '../types';
import { DATA_LAYERS } from '../constants';
import { renderMarkdown } from '../utils/markdown';

// Mapping from chart metric names to DataLayerId
const CHART_NAME_TO_METRIC: Record<string, DataLayerId> = {
  'Population': 'population',
  'Income': 'avg_income',
  'Competitors': 'competitors',
  'Score': 'site_suitability_score',
  'Night Lights': 'night_lights',
};

interface ComparisonChartProps {
  featureProperties: DistrictProperties;
  allFeatures?: DistrictFeature[];
}

/**
 * Calculate market averages from all features
 */
function calculateMarketAverages(allFeatures: DistrictFeature[]): DistrictProperties {
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:25',message:'calculateMarketAverages entry',data:{allFeaturesLength:allFeatures.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  if (allFeatures.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:28',message:'Using fallback values',data:{reason:'allFeatures.length === 0'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Fallback to default values if no data
    return {
      id: '',
      name: '',
      population: 80000,
      avg_income: 6000,
      competitors: 25,
      public_services: 15,
      site_suitability_score: 70,
      night_lights: 60,
    };
  }

  const totals = allFeatures.reduce(
    (acc, feature) => {
      const props = feature.properties;
      // #region agent log
      fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:43',message:'Processing feature in reduce',data:{featureName:props.name,props:{population:props.population,avg_income:props.avg_income,competitors:props.competitors,site_suitability_score:props.site_suitability_score,night_lights:props.night_lights},accBefore:acc},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return {
        population: acc.population + (props.population || 0),
        avg_income: acc.avg_income + (props.avg_income || 0),
        competitors: acc.competitors + (props.competitors || 0),
        public_services: acc.public_services + (props.public_services || 0),
        site_suitability_score: acc.site_suitability_score + (props.site_suitability_score || 0),
        night_lights: acc.night_lights + (props.night_lights || 0),
        count: acc.count + 1,
      };
    },
    {
      population: 0,
      avg_income: 0,
      competitors: 0,
      public_services: 0,
      site_suitability_score: 0,
      night_lights: 0,
      count: 0,
    }
  );

  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:62',message:'Totals calculated',data:{totals,divisionBy:totals.count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  const result = {
    id: '',
    name: '',
    population: Math.round(totals.population / totals.count),
    avg_income: Math.round(totals.avg_income / totals.count),
    competitors: Math.round(totals.competitors / totals.count),
    public_services: Math.round(totals.public_services / totals.count),
    site_suitability_score: Math.round(totals.site_suitability_score / totals.count),
    night_lights: Math.round(totals.night_lights / totals.count),
  };
  
  // #region agent log
  fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:72',message:'Market averages result',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  return result;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ featureProperties, allFeatures = [] }) => {
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:76',message:'Chart component entry',data:{featureName:featureProperties.name,featureProps:{population:featureProperties.population,avg_income:featureProperties.avg_income,competitors:featureProperties.competitors,site_suitability_score:featureProperties.site_suitability_score,night_lights:featureProperties.night_lights},allFeaturesCount:allFeatures.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Calculate market averages from all features
    const marketAverages = useMemo(() => {
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:79',message:'Before calculateMarketAverages',data:{allFeaturesCount:allFeatures.length,sampleFeature:allFeatures[0]?.properties},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const result = calculateMarketAverages(allFeatures);
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:82',message:'After calculateMarketAverages',data:{marketAverages:result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return result;
    }, [allFeatures]);

    // Create data with both original and normalized values
    // Normalize each metric row independently to 0-100 scale for visibility
    const rawData = [
        { 
            name: 'Population', 
            [featureProperties.name]: featureProperties.population, 
            'Market Average': marketAverages.population,
        },
        { 
            name: 'Income', 
            [featureProperties.name]: featureProperties.avg_income, 
            'Market Average': marketAverages.avg_income,
        },
        { 
            name: 'Competitors', 
            [featureProperties.name]: featureProperties.competitors, 
            'Market Average': marketAverages.competitors,
        },
        { 
            name: 'Score', 
            [featureProperties.name]: featureProperties.site_suitability_score, 
            'Market Average': marketAverages.site_suitability_score,
        },
        {
            name: 'Night Lights',
            [featureProperties.name]: featureProperties.night_lights,
            'Market Average': marketAverages.night_lights,
        }
    ];
    
    // Normalize each row independently: find max in row, normalize to 0-100
    const data = rawData.map(row => {
        const featureValue = row[featureProperties.name] || 0;
        const marketValue = row['Market Average'] || 0;
        const maxInRow = Math.max(featureValue, marketValue, 1); // Avoid division by zero
        
        return {
            ...row,
            [`${featureProperties.name}_original`]: featureValue,
            [`Market Average_original`]: marketValue,
            [featureProperties.name]: maxInRow > 0 ? (featureValue / maxInRow) * 100 : 0,
            'Market Average': maxInRow > 0 ? (marketValue / maxInRow) * 100 : 0,
        };
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:107',message:'Chart data array constructed',data:{rawData,normalizedData:data,featureName:featureProperties.name,dataKeys:data.map(d=>Object.keys(d))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    
    // #region agent log
    useEffect(() => {
      fetch('http://127.0.0.1:7251/ingest/7504df2d-d915-4838-a144-5d55fad20bb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Chart.tsx:110',message:'Bar component dataKey verification',data:{featureName:featureProperties.name,dataKeysInData:data.map(d=>Object.keys(d).filter(k=>k!=='name')),expectedDataKey:featureProperties.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }, [data, featureProperties.name]);
    // #endregion

    // Custom tooltip component that includes metric explanations
    // Uses original values from the data row, not normalized values
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) {
            return null;
        }

        const metricId = CHART_NAME_TO_METRIC[label];
        const layerInfo = metricId ? DATA_LAYERS[metricId] : null;
        
        // Find the data row for this metric to get original values
        const dataRow = data.find(d => d.name === label);
        const selectedValue = dataRow?.[`${featureProperties.name}_original`] ?? dataRow?.[featureProperties.name];
        const marketValue = dataRow?.[`Market Average_original`] ?? dataRow?.['Market Average'];

        return (
            <div 
              className="bg-white border border-gray-200 rounded-lg shadow-xl"
              style={{ 
                maxWidth: '350px',
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-line',
                fontSize: '14px',
                lineHeight: '1.5',
                padding: '14px 16px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
              role="tooltip"
            >
                <div className="font-bold text-base mb-2 text-gray-800">{label}</div>
                <div className="space-y-1 mb-3">
                    <div className="text-sm">
                        <span className="font-semibold text-blue-600">{featureProperties.name}:</span>{' '}
                        <span className="text-gray-700">{selectedValue?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-gray-600">Market Average:</span>{' '}
                        <span className="text-gray-700">{marketValue?.toLocaleString() || 'N/A'}</span>
                    </div>
                </div>
                {layerInfo?.fullExplanation && (
                    <div className="border-t pt-2 mt-2">
                        <div className="text-gray-600 leading-relaxed break-words">
                            {renderMarkdown(layerInfo.fullExplanation)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 10,
          bottom: 5,
        }}
        layout="vertical"
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis 
          type="number" 
          tick={{ fontSize: 12 }} 
          tickFormatter={(value) => `${value.toFixed(0)}%`}
          domain={[0, 100]}
        />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, width: 60 }} />
        <Tooltip
            content={<CustomTooltip />}
            cursor={false}
        />
        <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
        <Bar dataKey={featureProperties.name} fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="Market Average" fill="#9ca3af" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
