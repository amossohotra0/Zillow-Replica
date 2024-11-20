"use client";

import { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { IoLocationOutline } from 'react-icons/io5';
import { MdMyLocation } from 'react-icons/md';

export default function LocationSelector() {
  const { userLocation, locationError, isLocating, requestUserLocation, setManualLocation, clearLocation } = useLocation();
  const [manualAddress, setManualAddress] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await setManualLocation(manualAddress);
    if (success) {
      setShowInput(false);
    }
  };

  return (
    <div className="relative">
      {userLocation ? (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md">
          <IoLocationOutline className="text-lg" />
          <span className="text-sm font-medium">Location Set</span>
          <button 
            onClick={clearLocation}
            className="text-xs text-blue-500 hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {showInput ? (
            <form onSubmit={handleManualSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter your location"
                className="border border-gray-300 rounded-md px-2 py-1 text-sm w-48"
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm"
                disabled={isLocating}
              >
                {isLocating ? 'Setting...' : 'Set'}
              </button>
              <button 
                type="button"
                onClick={() => setShowInput(false)}
                className="text-gray-500 px-1"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <button
                onClick={requestUserLocation}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors"
                disabled={isLocating}
              >
                <MdMyLocation className="text-lg" />
                {isLocating ? 'Getting location...' : 'Use my location'}
              </button>
              <button
                onClick={() => setShowInput(true)}
                className="text-blue-600 hover:underline text-sm"
              >
                Enter manually
              </button>
            </>
          )}
        </div>
      )}
      
      {locationError && (
        <div className="text-red-500 text-xs mt-1">{locationError}</div>
      )}
    </div>
  );
}