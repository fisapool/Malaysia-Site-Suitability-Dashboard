
import React from 'react';
import type { DistrictFeature } from '../types';
import { ComparisonChart } from './Chart';
import { Users, DollarSign, Building, ShieldCheck, TrendingUp, X, Sun, Info } from 'lucide-react';
import { DATA_LAYERS } from '../constants';
import { Tooltip } from './Tooltip';

interface InfoPanelProps {
  feature: DistrictFeature | null;
  allFeatures?: DistrictFeature[];
  onClose: () => void;
}

const StatCard: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  value: string | number, 
  color: string,
  showTooltip?: boolean,
  shortDescription?: string
}> = ({ icon, label, value, color, showTooltip = false, shortDescription }) => {
    // Handle undefined/null values and ensure safe display
    const displayValue = value !== undefined && value !== null
        ? (typeof value === 'number' ? value.toLocaleString() : value)
        : 'N/A';
    
    return (
        <div className="relative bg-gray-50 rounded-lg p-2 flex items-center group overflow-visible">
            <div className={`p-1.5 rounded-full mr-2`} style={{ backgroundColor: `${color}20`, color: color }}>
                <div className="scale-75">{icon}</div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <p className="text-[10px] text-gray-500 font-medium truncate">{label}</p>
                    {showTooltip && shortDescription ? (
                        <Tooltip 
                            content={shortDescription}
                            maxWords={4}
                            delay={400}
                            position="auto"
                        >
                            <Info 
                                size={14} 
                                className="text-gray-500 hover:text-gray-700 cursor-help transition-colors hover:scale-110"
                                style={{ minWidth: '14px', minHeight: '14px' }}
                                aria-label={`Information about ${label}`}
                            />
                        </Tooltip>
                    ) : null}
                </div>
                <p className="text-sm font-bold text-gray-800 truncate">{displayValue}</p>
            </div>
        </div>
    );
};


export const InfoPanel: React.FC<InfoPanelProps> = ({ feature, allFeatures = [], onClose }) => {
  if (!feature) {
    return null;
  }

  const { name, population, avg_income, competitors, site_suitability_score, public_services, night_lights, hasCensusData } = feature.properties;
  const hasData = hasCensusData !== false; // Default to true for backward compatibility

  return (
    <div className="w-96 bg-white rounded-2xl shadow-2xl p-6 flex flex-col max-h-[calc(100vh-2rem)] overflow-y-auto animate-fade-in-right">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{name}</h2>
        <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
            <X size={20} />
        </button>
      </div>
      
      {!hasData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-yellow-600 text-lg mr-2">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">Census Data Not Available</p>
              <p className="text-xs text-yellow-700 mt-1">This area does not have census data. Values shown are placeholders.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard 
          icon={<TrendingUp size={20}/>} 
          label="Suitability Score" 
          value={hasData ? (site_suitability_score ?? 0) : 'N/A'} 
          color={hasData ? "#756bb1" : "#999"}
          showTooltip={true}
          shortDescription={DATA_LAYERS.site_suitability_score?.shortDescription}
        />
        <StatCard 
          icon={<Sun size={20}/>} 
          label="Night Lights" 
          value={hasData ? (night_lights ?? 0) : 'N/A'} 
          color={hasData ? "#d95f0e" : "#999"}
          showTooltip={true}
          shortDescription={DATA_LAYERS.night_lights?.shortDescription}
        />
        <StatCard 
          icon={<Users size={20}/>} 
          label="Population" 
          value={hasData ? (population ?? 0) : 'N/A'} 
          color={hasData ? "#3182bd" : "#999"}
        />
        <StatCard 
          icon={<DollarSign size={20}/>} 
          label="Avg. Income" 
          value={hasData && avg_income !== undefined && avg_income !== null ? `RM ${Number(avg_income).toLocaleString()}` : 'N/A'} 
          color={hasData ? "#31a354" : "#999"}
        />
        <StatCard 
          icon={<Building size={20}/>} 
          label="Competitors" 
          value={hasData ? (competitors ?? 0) : 'N/A'} 
          color={hasData ? "#e6550d" : "#999"}
        />
        <StatCard 
          icon={<ShieldCheck size={20}/>} 
          label="Public Services" 
          value={hasData ? (public_services ?? 0) : 'N/A'} 
          color={hasData ? "#08519c" : "#999"}
          showTooltip={true}
          shortDescription={DATA_LAYERS.public_services?.shortDescription}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Market Comparison</h3>
        <div className="h-64">
            <ComparisonChart featureProperties={feature.properties} allFeatures={allFeatures} />
        </div>
      </div>
    </div>
  );
};

// Add fade-in animation to tailwind config or a style tag if needed. For simplicity, here's a CSS-in-JS like approach:
// index.html <style> @keyframes... </style>
// @tailwind base ...
// then add animation-fade-in-right to the className
const animationStyles = `
@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fade-in-right {
  animation: fadeInRight 0.3s ease-out forwards;
}
`;
// Ideally this would be in a CSS file, but for a single file component structure, it can be managed.
// We will add this to the index.html for this project.
const styleSheet = document.createElement("style");
styleSheet.innerText = animationStyles;
document.head.appendChild(styleSheet);
