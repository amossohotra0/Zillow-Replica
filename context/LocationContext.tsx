"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  isLocating: boolean;
  requestUserLocation: () => void;
  setManualLocation: (address: string) => Promise<boolean>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  useEffect(() => {
    setHasMounted(true);

    const storedLocation = localStorage.getItem("userLocation");
    if (storedLocation) {
      try {
        setUserLocation(JSON.parse(storedLocation));
      } catch (e) {
        localStorage.removeItem("userLocation");
      }
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      localStorage.setItem("userLocation", JSON.stringify(userLocation));
    }
  }, [userLocation]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const setManualLocation = async (address: string): Promise<boolean> => {
    if (!address) {
      setLocationError("Please enter an address");
      return false;
    }

    setIsLocating(true);
    setLocationError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results?.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        setUserLocation({ lat, lng });
        setIsLocating(false);
        return true;
      } else {
        setLocationError("Could not find location for the provided address");
        setIsLocating(false);
        return false;
      }
    } catch (error) {
      setLocationError("Error geocoding address");
      setIsLocating(false);
      return false;
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
    setLocationError(null);
  };

  if (!hasMounted) return null;

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationError,
        isLocating,
        requestUserLocation,
        setManualLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
