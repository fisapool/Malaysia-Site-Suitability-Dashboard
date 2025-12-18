
import React from 'react';
import type { DataLayerId } from '../types';
import { DATA_LAYERS } from '../constants';

interface LegendProps {
  activeLayer: DataLayerId;
}

export const Legend: React.FC<LegendProps> = ({ activeLayer }) => {
  const layer = DATA_LAYERS[activeLayer];

  if (!layer) {
    return null;
  }
  
  const { colorScheme, stops } = layer;

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-xs relative">
      <div className="mb-2">
        <h3 className="font-bold text-gray-800 text-md">{layer.name}</h3>
      </div>
      <div className="flex items-center">
        {colorScheme.map((color, index) => (
          <div key={index} className="flex-1 h-3" style={{ backgroundColor: color }}></div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
};
