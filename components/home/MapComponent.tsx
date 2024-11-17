import { usePropertyData } from "@/store/propertyData";
import {
  GoogleMap,
  Marker,
  Polygon,
  OverlayView,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useLocation } from "@/context/LocationContext";
import { calculateRoadDistance } from "@/utils/distance";
import MapLocationControl from "./MapLocationControl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import "../../styles/map-animations.css";

interface Property {
  zpid: string;
  Address: string;
  Price: number;
  LivingArea: number;
  image: string;
  Bedrooms: number;
  Bathrooms: number;
  YearBuilt: number;
  Status: string;
  latitude: number;
  longitude: number;
  dateSold?: string;
  [key: string]: any;
}

export default function GoogleMapComponent() {
  const { propertyData, hoveredPropertyId, selectedPropertyId, setPropertyData } = usePropertyData();
  const { userLocation, requestUserLocation, locationError, isLocating, setManualLocation, clearLocation } = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Find the first property with valid coordinates
  const firstValidProperty = useMemo(() => {
    if (!propertyData?.nearbyHomes) return null;
    return propertyData.nearbyHomes.find(
      (home: any) => home.latitude && home.longitude
    );
  }, [propertyData?.nearbyHomes]);

  const center = {
    lat: firstValidProperty?.latitude || 0,
    lng: firstValidProperty?.longitude || 0,
  };

  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(13);
  const [distanceMatrixService, setDistanceMatrixService] = useState<google.maps.DistanceMatrixService | null>(null);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);

  // Function to get marker color and styling based on property type/status
  const getMarkerStyling = (property: Property) => {
    const status = property.listingType || property.Status;
    switch (status) {
      case "ForSale":
      case "FOR_SALE":
        return {
          bgColor: "bg-gradient-to-br from-red-500 to-red-600",
          shadowColor: "shadow-red-500/30",
          borderColor: "border-red-400",
          hoverBg: "hover:from-red-400 hover:to-red-500"
        };
      case "RecentlySold":
      case "RECENTLY_SOLD":
        return {
          bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
          shadowColor: "shadow-blue-500/30",
          borderColor: "border-blue-400",
          hoverBg: "hover:from-blue-400 hover:to-blue-500"
        };
      case "ForRent":
      case "FOR_RENT":
        return {
          bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
          shadowColor: "shadow-purple-500/30",
          borderColor: "border-purple-400",
          hoverBg: "hover:from-purple-400 hover:to-purple-500"
        };
      default:
        return {
          bgColor: "bg-gradient-to-br from-gray-500 to-gray-600",
          shadowColor: "shadow-gray-500/30",
          borderColor: "border-gray-400",
          hoverBg: "hover:from-gray-400 hover:to-gray-500"
        };
    }
  };
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  // Function to calculate road distances for all properties
  const calculateDistancesForProperties = useCallback(async () => {
    if (!userLocation || !distanceMatrixService || !propertyData?.nearbyHomes) {
      setIsCalculatingDistances(false);
      return;
    }

    try {
      // Process properties in batches to avoid rate limits
      const batchSize = 10;
      const updatedProperties = [...propertyData.nearbyHomes];
      
      for (let i = 0; i < updatedProperties.length; i += batchSize) {
        const batch = updatedProperties.slice(i, i + batchSize);
        const promises = batch.map(async (property: any) => {
          if (property.latitude && property.longitude) {
            const result = await calculateRoadDistance(
              userLocation,
              { lat: property.latitude, lng: property.longitude },
              distanceMatrixService
            );
            property.Distance = result.distance;
            property.DistanceType = result.type;
          }
          return property;
        });
        
        await Promise.all(promises);
      }
      
      // Update property data with calculated distances
      setPropertyData({ ...propertyData, nearbyHomes: updatedProperties });
    } catch (error) {
      console.error('Error calculating distances:', error);
    } finally {
      setIsCalculatingDistances(false);
    }
  }, [userLocation, distanceMatrixService, propertyData, setPropertyData, setIsCalculatingDistances]);

  // Calculate distances when user location changes
  useEffect(() => {
    if (userLocation && distanceMatrixService && propertyData?.nearbyHomes && !isCalculatingDistances) {
      setIsCalculatingDistances(true);
      calculateDistancesForProperties();
    }
  }, [userLocation, distanceMatrixService, calculateDistancesForProperties, isCalculatingDistances, propertyData?.nearbyHomes]);

  // Find the selected property
  const selectedProperty = useMemo(() => {
    if (!propertyData?.nearbyHomes || !selectedPropertyId) return null;
    return propertyData.nearbyHomes.find((home: any) => home.zpid === selectedPropertyId);
  }, [propertyData?.nearbyHomes, selectedPropertyId]);

  // Update map center when propertyData changes or when a property is selected
  useEffect(() => {
    // If there's a selected property with valid coordinates, center on it
    if (selectedProperty?.latitude && selectedProperty?.longitude) {
      const newCenter = {
        lat: selectedProperty.latitude,
        lng: selectedProperty.longitude,
      };
      setMapCenter(newCenter);
      setMapZoom(16); // Zoom in when a property is selected
    }
    // Otherwise use the first valid property or URL parameters
    else if (firstValidProperty) {
      const newCenter = {
        lat: searchParams.get("lat")
          ? parseFloat(searchParams.get("lat") || "0")
          : firstValidProperty.latitude,
        lng: searchParams.get("lng")
          ? parseFloat(searchParams.get("lng") || "0")
          : firstValidProperty.longitude,
      };
      
      // Only update if we have valid coordinates
      if (newCenter.lat && newCenter.lng) {
        setMapCenter(newCenter);
      }
    }
  }, [firstValidProperty, searchParams, selectedProperty]);

  useEffect(() => {
    // Only update URL if we have valid coordinates
    if (mapCenter.lat && mapCenter.lng) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("lat", mapCenter.lat.toString());
      params.set("lng", mapCenter.lng.toString());
      
      // Don't update URL if we're already on the same page (prevents unnecessary history entries)
      const currentParams = new URLSearchParams(window.location.search);
      const currentLat = currentParams.get("lat");
      const currentLng = currentParams.get("lng");
      
      if (currentLat !== params.get("lat") || currentLng !== params.get("lng")) {
        router.push(`?${params.toString()}`);
      }
    }
  }, [mapCenter, router, searchParams]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ["geometry", "places"],
  });

  const polygonCoords = useMemo(() => {
    if (!mapCenter.lat || !mapCenter.lng) return [];

    return Array.from({ length: 36 }, (_, i) => {
      const angle = (i / 36) * 2 * Math.PI;
      const latOffset = 0.02 * Math.sin(angle) * (1 + 0.3 * Math.cos(angle));
      const lngOffset = 0.015 * Math.cos(angle);
      return {
        lat: mapCenter.lat + latOffset,
        lng: mapCenter.lng + lngOffset,
      };
    });
  }, [mapCenter]);

  const polygon = useMemo(() => {
    if (!isLoaded) return null;
    return new window.google.maps.Polygon({ paths: polygonCoords });
  }, [polygonCoords, isLoaded]);

  const filteredProperties = useMemo(() => {
    if (!polygon || !propertyData?.nearbyHomes)
      return propertyData?.nearbyHomes || [];

    return propertyData.nearbyHomes.filter((property: Property) => {
      if (!property.latitude || !property.longitude) return false;

      return window.google.maps.geometry.poly.containsLocation(
        new window.google.maps.LatLng(property.latitude, property.longitude),
        polygon
      );
    });
  }, [polygon, propertyData?.nearbyHomes]);

  // Mark the searched property (first property in the list)
  const propertiesToShow = useMemo(() => {
    const properties = filteredProperties.length > 0
      ? filteredProperties
      : propertyData?.nearbyHomes || [];
    
    // Mark the first property as the searched property
    if (properties.length > 0) {
      return properties.map((prop: Property, index: number) => ({
        ...prop,
        isSearchedProperty: index === 0
      }));
    }
    return properties;
  }, [filteredProperties, propertyData?.nearbyHomes]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="bg-white p-4 rounded-md shadow-md max-w-md text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Google Maps</h3>
          <p className="text-gray-600 mb-4">
            There was an error loading Google Maps. This could be due to an invalid API key or network issues.
          </p>
          <p className="text-sm text-gray-500">
            Error details: {loadError.message}
          </p>
        </div>
      </div>
    );
  }
  
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden relative">
      {/* Scroll overlay to prevent map from capturing scroll events */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        onWheel={(e) => {
          // Allow page scrolling when not holding Ctrl
          if (!e.ctrlKey) {
            e.stopPropagation();
          }
        }}
      />
      
      {/* Map interaction hint */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/70 text-white px-3 py-2 rounded-lg text-xs">
        Hold Ctrl + scroll to zoom
      </div>
      
      <GoogleMap
        center={mapCenter}
        zoom={mapZoom}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        options={{
          disableDefaultUI: true,
          gestureHandling: 'cooperative', // Requires Ctrl+scroll to zoom
          scrollwheel: false, // Disable scroll wheel zoom
          styles: [
            {
              featureType: "all",
              elementType: "all",
              stylers: [{ visibility: "on" }, { saturation: 0 }, { lightness: 0 }]
            }
          ]
        }}
        onLoad={(map) => {
          mapRef.current = map;
          setDistanceMatrixService(new window.google.maps.DistanceMatrixService());
        }}
        onDragEnd={() => {
          if (mapRef.current) {
            const newCenter = mapRef.current.getCenter();
            if (newCenter) {
              setMapCenter({
                lat: newCenter.lat(),
                lng: newCenter.lng(),
              });
            }
          }
        }}
      >
        {/* Reset zoom button */}
        {mapZoom > 13 && (
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={() => {
                setMapZoom(13);
                if (firstValidProperty) {
                  setMapCenter({
                    lat: firstValidProperty.latitude,
                    lng: firstValidProperty.longitude,
                  });
                }
              }}
              className="bg-white p-2 rounded-md shadow-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Reset View
            </button>
          </div>
        )}
        
        {/* Location controls */}
        <MapLocationControl 
          onCalculateDistances={() => {
            if (userLocation && distanceMatrixService && propertyData?.nearbyHomes) {
              setIsCalculatingDistances(true);
              calculateDistancesForProperties();
            }
          }}
          isCalculatingDistances={isCalculatingDistances}
        />
        
        <Polygon
          paths={polygonCoords}
          options={{
            fillColor: "#3B82F6",
            fillOpacity: 0.1,
            strokeColor: "#3B82F6",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            clickable: false,
            zIndex: 100,
          }}
        />

        {/* Smaller, beautiful user location marker */}
        {userLocation && (
          <OverlayView
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="relative transform -translate-x-1/2 -translate-y-1/2">
              {/* Smaller pulsing rings */}
              <div className="absolute inset-0 w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-1 w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-40" 
                   style={{animationDelay: '0.5s'}}></div>
              
              {/* Smaller main location marker */}
              <div className="relative w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 
                            rounded-full border-2 border-white shadow-md z-10
                            flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              
              {/* Smaller location label */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 
                            bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium
                            shadow-md border border-blue-500 whitespace-nowrap">
                You
              </div>
            </div>
          </OverlayView>
        )}
        
        {/* Property markers */}
        {propertiesToShow.map((property: Property) => {
          // Skip properties without valid coordinates
          if (!property.latitude || !property.longitude) return null;
          
          return (
            <div key={property.zpid}>
              <Marker
                position={{ lat: property.latitude, lng: property.longitude }}
                icon={{
                  url: "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png",
                  scaledSize: new window.google.maps.Size(0, 0),
                }}
              />

              <OverlayView
                position={{ lat: property.latitude, lng: property.longitude }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  className="relative cursor-pointer transform -translate-x-1/2 -translate-y-full"
                >
                  <div className="flex flex-col items-center">
                    {/* Smaller, beautiful marker with enhanced styling */}
                    <div className={`
                      relative px-2 py-1 min-w-[60px] max-w-[80px]
                      ${getMarkerStyling(property).bgColor}
                      ${getMarkerStyling(property).hoverBg}
                      ${getMarkerStyling(property).shadowColor}
                      border ${getMarkerStyling(property).borderColor}
                      rounded-lg shadow-md
                      ${property.isSearchedProperty ? "ring-1 ring-yellow-400 ring-offset-1" : ""} 
                      ${hoveredPropertyId === property.zpid ? 
                        "ring-1 ring-white ring-offset-1 scale-105 shadow-lg z-40" : ""} 
                      ${selectedPropertyId === property.zpid ? 
                        "ring-2 ring-yellow-300 ring-offset-1 scale-110 z-50 shadow-xl" : ""} 
                      text-white font-semibold text-center 
                      transition-all duration-200 ease-out
                      hover:shadow-lg hover:scale-105
                      group
                    `}>
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                    transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                                    transition-transform duration-700 ease-out"></div>
                      
                      {/* Price text - smaller and cleaner */}
                      <div className="relative z-10">
                        <span className="text-xs font-bold tracking-wide drop-shadow-sm">
                          {property.Price
                            ? property.Price >= 1000000 
                              ? `$${(property.Price / 1000000).toFixed(1)}M`
                              : `$${(property.Price / 1000).toFixed(0)}K`
                            : "N/A"}
                        </span>
                      </div>
                      
                      {/* Floating badge for special properties - smaller */}
                      {property.isSearchedProperty && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full 
                                      border border-white shadow-sm"></div>
                      )}
                    </div>
                    
                    {/* Smaller arrow pointer */}
                    <div className={`
                      w-0 h-0 mt-0.5
                      border-l-[4px] border-l-transparent 
                      border-r-[4px] border-r-transparent 
                      border-t-[6px] ${getMarkerStyling(property).borderColor}
                      filter drop-shadow-sm
                      ${hoveredPropertyId === property.zpid ? "scale-105" : ""}
                      ${selectedPropertyId === property.zpid ? "scale-110" : ""}
                      transition-transform duration-200
                    `} />
                    
                    {/* Smaller pulsing ring effect for selected property */}
                    {selectedPropertyId === property.zpid && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                                    w-20 h-20 border border-yellow-300 rounded-full 
                                    animate-ping opacity-30 pointer-events-none"></div>
                    )}
                  </div>
                </div>
              </OverlayView>
            </div>
          );
        })}

      </GoogleMap>
    </div>
  );
}
