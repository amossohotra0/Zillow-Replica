"use client";

import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { IoLocationOutline, IoSearchOutline } from 'react-icons/io5';
import { Button } from './ui/button';
import PageLoader from './ui/PageLoader';

interface LocationPromptProps {
  onLocationSet: () => void;
}

const LocationPrompt: React.FC<LocationPromptProps> = ({ onLocationSet }) => {
  const { 
    userLocation, 
    locationError, 
    isLocating, 
    requestUserLocation, 
    setManualLocation 
  } = useLocation();
  
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAddress.trim()) {
      const success = await setManualLocation(manualAddress.trim());
      if (success) {
        onLocationSet();
      }
    }
  };

  // If location is already set, trigger the callback
  React.useEffect(() => {
    if (userLocation) {
      onLocationSet();
    }
  }, [userLocation, onLocationSet]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoLocationOutline className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Find Properties Near You
          </h1>
          <p className="text-gray-600">
            We'll show you properties within 5 miles of your location to get you started.
          </p>
        </div>

        {locationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{locationError}</p>
          </div>
        )}

        {!showManualInput ? (
          <div className="space-y-4">
            {/* Auto Location Button */}
            <Button
              onClick={requestUserLocation}
              disabled={isLocating}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLocating ? (
                <>
                  <PageLoader width="w-5" height="h-5" />
                  <span>Getting your location...</span>
                </>
              ) : (
                <>
                  <IoLocationOutline className="w-5 h-5" />
                  <span>Use My Current Location</span>
                </>
              )}
            </Button>

            {/* Manual Entry Option */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button
              onClick={() => setShowManualInput(true)}
              variant="outline"
              className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <IoSearchOutline className="w-5 h-5" />
              <span>Enter Address Manually</span>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleManualLocationSubmit} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your address or ZIP code
              </label>
              <input
                id="address"
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Dallas, TX or 75201"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLocating}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowManualInput(false)}
                variant="outline"
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isLocating}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLocating || !manualAddress.trim()}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLocating ? (
                  <PageLoader width="w-5" height="h-5" />
                ) : (
                  'Find Properties'
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6">
          <button
            onClick={onLocationSet}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 py-2"
          >
            Skip for now - I'll search manually
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Why do we need your location?</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Show properties within 5 miles of you</li>
              <li>• Calculate accurate distances to properties</li>
              <li>• Provide relevant local market insights</li>
              <li>• Your location data stays private and secure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPrompt;
