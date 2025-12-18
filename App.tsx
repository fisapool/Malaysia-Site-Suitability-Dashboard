
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/MapComponent';
import { InfoPanel } from './components/InfoPanel';
import { Legend } from './components/Legend';
// FIX: Import FeatureCollection to resolve GeoJSON namespace error.
import type { FeatureCollection } from 'geojson';
import type { DistrictFeature, DataLayerId, BoundaryTypeId } from './types';
import { fetchDistrictData } from './services/api';

export default function App() {
  // FIX: Use imported FeatureCollection type instead of GeoJSON.FeatureCollection.
  const [districtData, setDistrictData] = useState<FeatureCollection | null>(null);
  const [activeLayer, setActiveLayer] = useState<DataLayerId>('population');
  const [activeBoundary, setActiveBoundary] = useState<BoundaryTypeId>('district');
  const [selectedFeature, setSelectedFeature] = useState<DistrictFeature | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showMissingData, setShowMissingData] = useState<boolean>(false); // Default to false - hide missing data

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // fetchDistrictData now handles transformation internally
        const data = await fetchDistrictData(activeBoundary);
        // Debug: Log first feature to verify transformation
        if (data.features.length > 0) {
          console.log('Sample transformed feature:', data.features[0]);
        }
        setDistrictData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load geospatial data';
        setError(errorMessage);
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [activeBoundary]);

  const handleFeatureSelect = useCallback((feature: DistrictFeature | null) => {
    setSelectedFeature(feature);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-100 font-sans">
      <Sidebar 
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        activeBoundary={activeBoundary}
        setActiveBoundary={setActiveBoundary}
        showMissingData={showMissingData}
        setShowMissingData={setShowMissingData}
      />
      <main className="flex-1 relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg">Loading Geospatial Data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
            <div className="flex flex-col items-center gap-4 max-w-md text-center">
              <p className="text-xl text-red-400">Error Loading Data</p>
              <p className="text-gray-300">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <MapComponent
            data={districtData}
            activeLayer={activeLayer}
            onFeatureSelect={handleFeatureSelect}
            selectedFeature={selectedFeature}
            showMissingData={showMissingData}
          />
        )}
        <div className="absolute top-4 right-4 z-[1000]">
          <InfoPanel feature={selectedFeature} allFeatures={districtData?.features || []} onClose={() => handleFeatureSelect(null)} />
        </div>
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Legend activeLayer={activeLayer} />
        </div>
      </main>
    </div>
  );
}
