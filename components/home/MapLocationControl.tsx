"use client";

import React, { useEffect, useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { MdMyLocation } from 'react-icons/md';
import { MdWarning } from 'react-icons/md';

export default function MapLocationControl({ 
  onCalculateDistances,
  isCalculatingDistances 
}: { 
  onCalculateDistances: () => void;
  isCalculatingDistances: boolean;
}) {
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  useEffect(() => {
    // Check if API key is missing or empty
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setApiKeyMissing(!apiKey || apiKey.trim() === '');
  }, []);
  const { userLocation, requestUserLocation, locationError, isLocating, setManualLocation, clearLocation } = useLocation();
  const [showLocationInput, setShowLocationInput] = React.useState(false);
  const [manualAddress, setManualAddress] = React.useState('');

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="bg-white rounded-md shadow-md overflow-hidden">
        {userLocation ? (
          <div className="p-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <span className="text-sm font-medium">Location Set</span>
            <button 
              onClick={clearLocation}
              className="text-xs text-blue-500 hover:underline"
            >
              Change
            </button>
            <button 
              onClick={onCalculateDistances}
              disabled={isCalculatingDistances}
              className="ml-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs hover:bg-blue-700 transition-colors"
            >
              {isCalculatingDistances ? 'Calculating...' : 'Update Distances'}
            </button>
          </div>
        ) : showLocationInput ? (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const success = await setManualLocation(manualAddress);
              if (success) {
                setShowLocationInput(false);
                setManualAddress('');
              }
            }}
            className="p-2 flex items-center gap-1"
          >
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter your location"
              className="border border-gray-300 rounded-md px-2 py-1 text-sm w-48"
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs"
              disabled={isLocating}
            >
              {isLocating ? 'Setting...' : 'Set'}
            </button>
            <button 
              type="button"
              onClick={() => setShowLocationInput(false)}
              className="text-gray-500 px-1 text-xs"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="p-2 flex items-center gap-2">
            <button
              onClick={requestUserLocation}
              className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded-md text-xs hover:bg-blue-700 transition-colors"
              disabled={isLocating}
            >
              <MdMyLocation className="text-sm" />
              {isLocating ? 'Getting location...' : 'Use my location'}
            </button>
            <button
              onClick={() => setShowLocationInput(true)}
              className="text-blue-600 hover:underline text-xs"
            >
              Enter manually
            </button>
          </div>
        )}
        {(locationError || apiKeyMissing) && (
          <div className="text-red-500 text-xs p-2 border-t border-gray-100 flex items-center gap-1">
            <MdWarning className="text-sm" />
            {apiKeyMissing ? 'Google Maps API key is missing' : locationError}
          </div>
        )}
      </div>
    </div>
  );
}