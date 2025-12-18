
import React from 'react';
import type { DataLayerId, BoundaryTypeId } from '../types';
import { DATA_LAYERS, BOUNDARIES } from '../constants';
import { Layers, Landmark, Map } from 'lucide-react';

interface SidebarProps {
  activeLayer: DataLayerId;
  setActiveLayer: (layer: DataLayerId) => void;
  activeBoundary: BoundaryTypeId;
  setActiveBoundary: (boundary: BoundaryTypeId) => void;
  showMissingData: boolean;
  setShowMissingData: (show: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeLayer, setActiveLayer, activeBoundary, setActiveBoundary, showMissingData, setShowMissingData }) => {
  return (
    <aside className="w-80 bg-gray-800 text-white p-6 flex flex-col space-y-8 shadow-2xl z-20">
      <div className="flex items-center space-x-3">
        <Map size={32} className="text-blue-400" />
        <h1 className="text-2xl font-bold tracking-tight">GeoIntel</h1>
      </div>
      
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <Landmark size={16} className="mr-2"/>
          Boundary Type
        </h2>
        <div className="flex flex-col space-y-2">
          {BOUNDARIES.map(boundary => (
            <button
              key={boundary.id}
              onClick={() => setActiveBoundary(boundary.id)}
              className={`text-left px-4 py-2 rounded-md transition-colors text-sm ${
                activeBoundary === boundary.id
                  ? 'bg-blue-600 font-semibold'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {boundary.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <Layers size={16} className="mr-2"/>
          Data Layers
        </h2>
        <div className="space-y-1">
          {Object.values(DATA_LAYERS).map(layer => (
            <label
              key={layer.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                activeLayer === layer.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'
              }`}
            >
              <input
                type="radio"
                name="dataLayer"
                value={layer.id}
                checked={activeLayer === layer.id}
                onChange={() => setActiveLayer(layer.id)}
                className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium">{layer.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <Layers size={16} className="mr-2"/>
          Data Filter
        </h2>
        <label className="flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-700/50">
          <input
            type="checkbox"
            checked={showMissingData}
            onChange={(e) => setShowMissingData(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-3 text-sm font-medium">Show areas without census data</span>
        </label>
        {!showMissingData && (
          <p className="text-xs text-gray-500 mt-2 px-3">
            Only showing areas with available census data for accurate analysis.
          </p>
        )}
      </div>
    </aside>
  );
};
