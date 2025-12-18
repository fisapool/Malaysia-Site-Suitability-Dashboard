
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
// FIX: Import L from leaflet to resolve reference error.
import L, { type LatLngExpression, type LatLngBounds } from 'leaflet';
// FIX: Import GeoJSON types to resolve namespace errors.
import type { Feature, FeatureCollection } from 'geojson';
import type { DistrictFeature, DataLayerId } from '../types';
import { DATA_LAYERS, getLayerColor, MALAYSIA_CENTER, MALAYSIA_ZOOM, MALAYSIA_BOUNDS } from '../constants';

interface MapComponentProps {
  // FIX: Use imported FeatureCollection type.
  data: FeatureCollection | null;
  activeLayer: DataLayerId;
  onFeatureSelect: (feature: DistrictFeature) => void;
  selectedFeature: DistrictFeature | null;
  showMissingData?: boolean;  // Toggle to show/hide features without census data
}

// Component to fit map bounds to GeoJSON data
const FitBounds = ({ bounds, padding = [50, 50] }: { bounds: LatLngBounds | null, padding?: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: padding,
        maxZoom: 8, // Prevent zooming in too much
      });
    }
  }, [bounds, map, padding]);
  
  return null;
};

// Component to handle map instance reference and reset functionality
const MapController = ({ onMapReady }: { onMapReady: (map: L.Map) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ data, activeLayer, onFeatureSelect, selectedFeature, showMissingData = true }) => {
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Memoize filtered feature collection to prevent unnecessary GeoJSON component remounts
  const filteredData = useMemo(() => {
    if (!data) return null;
    
    const filteredFeatures = showMissingData 
      ? data.features 
      : data.features.filter(f => (f.properties as any).hasCensusData !== false);
    
    return {
      ...data,
      features: filteredFeatures
    } as FeatureCollection;
  }, [data, showMissingData]);
  
  // Calculate bounds from GeoJSON data when it loads or changes
  useEffect(() => {
    if (data && data.features.length > 0) {
      try {
        const geoJsonLayer = L.geoJSON(data);
        const calculatedBounds = geoJsonLayer.getBounds();
        if (calculatedBounds.isValid()) {
          setBounds(calculatedBounds);
        } else {
          // Fallback to Malaysia bounds if calculated bounds are invalid
          setBounds(L.latLngBounds(MALAYSIA_BOUNDS[0], MALAYSIA_BOUNDS[1]));
        }
      } catch (error) {
        console.error('Error calculating bounds:', error);
        // Fallback to Malaysia bounds
        setBounds(L.latLngBounds(MALAYSIA_BOUNDS[0], MALAYSIA_BOUNDS[1]));
      }
    } else {
      // If no data, use default Malaysia bounds
      setBounds(L.latLngBounds(MALAYSIA_BOUNDS[0], MALAYSIA_BOUNDS[1]));
    }
  }, [data]);

  // Handle map instance ready
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  // Reset map to Malaysia view
  const resetToMalaysia = () => {
    if (mapRef.current) {
      if (bounds && bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 8,
        });
      } else {
        mapRef.current.setView(MALAYSIA_CENTER, MALAYSIA_ZOOM);
      }
    }
  };

  // FIX: Use imported Feature type.
  const geoJsonStyle = (feature?: Feature) => {
    if (!feature) {
      return {};
    }
    const props = feature.properties as any;
    const hasData = props.hasCensusData !== false; // Default to true if not set (backward compatibility)
    const value = props[activeLayer] || 0;
    const color = hasData ? getLayerColor(value, activeLayer) : '#cccccc'; // Grey for missing data
    const isSelected = selectedFeature?.properties.id === feature.properties.id;

    return {
      fillColor: color,
      weight: isSelected ? 3 : 1.5,
      opacity: hasData ? 1 : 0.5, // Reduced opacity for missing data
      color: isSelected ? '#3388ff' : (hasData ? '#666' : '#999'),
      fillOpacity: hasData ? 0.7 : 0.3, // Lower opacity for missing data
      // Add pattern for missing data (will use CSS-like approach)
      dashArray: hasData ? undefined : '5,5', // Dashed border for missing data
    };
  };

  // FIX: Use imported Feature type.
  const onEachFeature = (feature: Feature, layer: any) => {
    layer.on({
      click: () => {
        // Ensure feature has the correct structure before selecting
        const districtFeature = feature as DistrictFeature;
        // Validate that properties exist
        if (districtFeature.properties && districtFeature.properties.id) {
          onFeatureSelect(districtFeature);
        } else {
          console.warn('Feature missing required properties:', feature);
        }
      },
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#333',
          fillOpacity: 0.9,
        });
        // FIX: 'L' is now available through import.
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
      },
      mouseout: (e: any) => {
        const layer = e.target;
        // The geoJsonRef is not available here, so we reset to a style that matches the logic
        const isSelected = selectedFeature?.properties.id === feature.properties.id;
        layer.setStyle({
            weight: isSelected ? 3 : 1.5,
            color: isSelected ? '#3388ff' : '#666',
            fillOpacity: 0.7
        });
      },
    });
    const props = feature.properties as any;
    const layerInfo = DATA_LAYERS[activeLayer];
    const value = props[activeLayer];
    const hasData = props.hasCensusData !== false; // Default to true if not set
    
    // FIX: Handle undefined/null values and ensure value is a number before calling toLocaleString
    let displayValue: string;
    if (!hasData) {
      displayValue = 'Data not available';
    } else if (value !== undefined && value !== null) {
      displayValue = Number(value).toLocaleString();
    } else {
      displayValue = 'N/A';
    }
    
    // Format explanation - convert markdown-style bold to HTML, preserve line breaks
    const formatExplanation = (text: string): string => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    };
    
    const tooltipContent = `
        <div class="font-bold text-base mb-2">${props.name || 'Unknown'}</div>
        <div class="mb-2">
            <div class="font-semibold text-sm text-gray-700">${layerInfo.name}: ${displayValue}</div>
        </div>
        <div class="text-gray-600 border-t pt-2 mt-2" style="max-width: 350px; word-wrap: break-word; overflow-wrap: anywhere; white-space: pre-line; font-size: 14px; line-height: 1.5; padding: 14px 0; max-height: 300px; overflow-y: auto;">
            ${formatExplanation(layerInfo.fullExplanation)}
        </div>
        ${!hasData ? '<div class="text-xs text-yellow-700 mt-2 pt-2 border-t">⚠️ Census data not available for this area</div>' : ''}
    `;
    // Tooltips removed - no bindTooltip call
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={MALAYSIA_CENTER} 
        zoom={MALAYSIA_ZOOM} 
        minZoom={5}
        maxZoom={18}
        zoomSnap={0.25}
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
        maxBounds={L.latLngBounds(MALAYSIA_BOUNDS[0], MALAYSIA_BOUNDS[1])}
        maxBoundsViscosity={1.0}
      >
        <MapController onMapReady={handleMapReady} />
        <FitBounds bounds={bounds} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {filteredData && (
          <GeoJSON
            key={`${activeLayer}-${selectedFeature?.properties.id || 'none'}`}
            data={filteredData}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      {/* Reset to Malaysia button - positioned bottom-right for better UX */}
      <button
        onClick={resetToMalaysia}
        className="absolute bottom-4 right-4 z-[1000] bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-lg border border-gray-300 flex items-center gap-2 transition-colors"
        title="Reset view to Malaysia"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        Reset View
      </button>
    </div>
  );
};
