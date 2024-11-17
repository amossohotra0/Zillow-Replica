"use client";

import { useFilterStore } from "@/store/filterStates";
import { Suspense, useEffect, useState, useMemo } from "react";
import GoogleMapComponent from "./MapComponent";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React from "react";
import SelectedPropertyDetails from "./SelectedPropertyDetails";
import PropertyList from "./PropertyList";
import { columns } from "./utils";
import { useRouter, useSearchParams } from "next/navigation";
import PageLoader from "../ui/PageLoader";
import { usePropertyData } from "@/store/propertyData";
import { useLocation } from "@/context/LocationContext";
import { calculateDistance } from "@/utils/distance";
import { IoSearchOutline, IoHomeOutline, IoLocationOutline } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import PropertyTypeBreakdown from "./PropertyTypeBreakdown";
import LocationPrompt from "../LocationPrompt";

const PropertiesListComponent = () => {
  const { propertyData, setPropertyData, selectedPropertyId, setSelectedPropertyId } = usePropertyData();
  const { userLocation, clearLocation } = useLocation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = JSON.parse(
    decodeURIComponent(searchParams.get("query") || "{}")
  );

  const { searchedTerm, listingType, filterState } = query;

  const selectedState = useFilterStore((state) => state.selectedState);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Check if we should show location prompt - prioritize location on first load
  useEffect(() => {
    const hasSearchQuery = searchedTerm && searchedTerm.trim() !== '';
    const hasUserLocation = userLocation !== null;
    
    // Show location prompt if:
    // 1. No user location AND no search query
    // 2. This is the first visit (no previous location stored)
    if (!hasUserLocation && !hasSearchQuery) {
      setShowLocationPrompt(true);
    } else {
      setShowLocationPrompt(false);
    }
  }, [userLocation, searchedTerm]);

  const {
    data: propertyDataByLocation,
    isLoading,
    error,
  } = useQuery({
    queryFn: async () => {
      // Check if we have a search term or user location
      if (searchedTerm && searchedTerm.trim()) {
        // Use the unified search endpoint for text-based searches
        const params = new URLSearchParams();
        params.append("searchedTerm", searchedTerm);

        // Check if any filters are applied
        const hasFilters = !!(
          filterState?.beds?.min ||
          filterState?.price?.min ||
          filterState?.sqftMin?.min ||
          filterState?.buildYear?.min ||
          filterState?.buildYear?.max ||
          filterState?.lotSize?.min ||
          (listingType && listingType !== "")
        );

        if (hasFilters) {
          params.append("applyFilters", "true");
          params.append("listingStatus", listingType || "");
          params.append("bedsMin", filterState?.beds?.min || "");
          params.append("priceMin", filterState?.price?.min || "");
          params.append("sqftMin", filterState?.sqftMin?.min || "");
          params.append("buildYearMin", filterState?.buildYear?.min || "");
          params.append("buildYearMax", filterState?.buildYear?.max || "");
          params.append("lotSize", filterState?.lotSize?.min || "");
        } else {
          params.append("applyFilters", "false");
        }

        console.log("Unified search with params:", Object.fromEntries(params));
        const res = await axios.get(`/api/unified-search?${params.toString()}`);
        return res.data;
      } else if (userLocation) {
        // Use the nearby properties endpoint for location-based searches
        const params = new URLSearchParams();
        params.append("lat", userLocation.lat.toString());
        params.append("lng", userLocation.lng.toString());
        params.append("radius", "5"); // 5 miles radius

        // Check if any filters are applied
        const hasFilters = !!(
          filterState?.beds?.min ||
          filterState?.price?.min ||
          filterState?.sqftMin?.min ||
          filterState?.buildYear?.min ||
          filterState?.buildYear?.max ||
          filterState?.lotSize?.min ||
          (listingType && listingType !== "")
        );

        if (hasFilters) {
          params.append("applyFilters", "true");
          params.append("listingStatus", listingType || "");
          params.append("bedsMin", filterState?.beds?.min || "");
          params.append("priceMin", filterState?.price?.min || "");
          params.append("sqftMin", filterState?.sqftMin?.min || "");
          params.append("buildYearMin", filterState?.buildYear?.min || "");
          params.append("buildYearMax", filterState?.buildYear?.max || "");
          params.append("lotSize", filterState?.lotSize?.min || "");
        } else {
          params.append("applyFilters", "false");
        }

        console.log("Nearby search with params:", Object.fromEntries(params));
        const res = await axios.get(`/api/nearby-properties?${params.toString()}`);
        return res.data;
      } else {
        // No search term or location available
        throw new Error("No search criteria provided");
      }
    },
    enabled: !!(searchedTerm?.trim() || userLocation) && !showLocationPrompt,
    queryKey: ["property-search", searchedTerm, userLocation, listingType, filterState],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Calculate distances when user location changes or properties change
  const propertiesWithDistance = useMemo(() => {
    if (!propertyDataByLocation?.nearbyHomes) return [];

    return propertyDataByLocation.nearbyHomes.map((property: any) => {
      // Calculate distance if we have user location and property coordinates
      if (userLocation && property.latitude && property.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          property.latitude,
          property.longitude
        );
        return { ...property, Distance: distance, DistanceType: 'straight' };
      }
      return property;
    });
  }, [propertyDataByLocation?.nearbyHomes, userLocation]);

  // Get selected property from the list based on selectedPropertyId
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId || !propertiesWithDistance?.length) return propertiesWithDistance?.[0] || null;
    return propertiesWithDistance.find((prop: any) => prop.zpid === selectedPropertyId) || propertiesWithDistance[0];
  }, [selectedPropertyId, propertiesWithDistance]);

  useEffect(() => {
    if (propertiesWithDistance.length > 0) {
      // Update property data in store
      setPropertyData({ ...propertyDataByLocation, nearbyHomes: propertiesWithDistance });
      
      // Set first property as selected if none is selected
      if (!selectedPropertyId) {
        setSelectedPropertyId(propertiesWithDistance[0].zpid);
      }
    }
  }, [propertiesWithDistance, propertyDataByLocation, selectedPropertyId, setPropertyData, setSelectedPropertyId]);

  // Show location prompt if no location and no search term
  if (showLocationPrompt) {
    return (
      <LocationPrompt 
        onLocationSet={() => {
          setShowLocationPrompt(false);
          // Auto-trigger nearby properties search after location is set
          setTimeout(() => {
            if (userLocation) {
              console.log('Location set, auto-fetching nearby properties...');
            }
          }, 500);
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-red-200 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Properties</h3>
          <p className="text-gray-600 mb-4">
            We encountered an issue while searching for properties. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Search
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-gray-600">Searching for properties...</p>
        </div>
      </div>
    );
  }

  // If no search has been performed yet but we have location, show nearby properties
  if (!searchedTerm && userLocation && (!propertyDataByLocation || isLoading)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-gray-600">Finding properties near you...</p>
          <p className="mt-2 text-sm text-gray-500">
            Searching within 5 miles of your location
          </p>
        </div>
      </div>
    );
  }

  // If no search has been performed and no location
  if (!searchedTerm && !userLocation) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Find Your Perfect Home
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Search millions of properties with our advanced property finder
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-blue-600 text-3xl mb-4">
                <IoLocationOutline className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Search by Location</h3>
              <p className="text-gray-600 text-sm">
                Find properties by city, neighborhood, ZIP code, or landmark
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-green-600 text-3xl mb-4">
                <IoHomeOutline className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Exact Address</h3>
              <p className="text-gray-600 text-sm">
                Enter a complete address for specific property details
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-purple-600 text-3xl mb-4">
                <IoSearchOutline className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
              <p className="text-gray-600 text-sm">
                Try "3+ bedroom homes in Dallas TX" or school searches
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Search Examples:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                { text: "26003", desc: "ZIP Code" },
                { text: "San Antonio, TX", desc: "City, State" },
                { text: "Johnson High School, San Antonio, TX", desc: "School Search" },
                { text: "3+ bedroom homes in Longview TX", desc: "Bedroom Query" },
                { text: "Zoo, Apple Valley, MN", desc: "Landmark Search" },
                { text: "123 Main St, Portland, OR", desc: "Exact Address" }
              ].map((example, i) => (
                <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">{example.text}</span>
                  <span className="text-gray-500 text-xs">{example.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-blue-600 text-white p-4 rounded-xl max-w-md mx-auto">
            <h4 className="font-semibold mb-2">Property Types on Map</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span>For Sale</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span>Recently Sold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                <span>For Rent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span>Your Location</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If search performed but no results
  if (!propertyDataByLocation?.nearbyHomes || propertyDataByLocation.nearbyHomes.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200 max-w-md">
          <div className="text-gray-400 text-5xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Properties Found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any properties matching your search criteria.
          </p>
          <div className="text-sm text-gray-500 space-y-2">
            <p>Try:</p>
            <ul className="list-disc text-left ml-6 space-y-1">
              <li>Checking your spelling</li>
              <li>Using a broader search term</li>
              <li>Searching by ZIP code instead</li>
              <li>Adjusting your filters</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedProperty) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Results Summary */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {searchedTerm ? `Properties in ${searchedTerm}` : (
                  userLocation ? 'Properties Near You' : 'Property Search Results'
                )}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-gray-600">
                  {propertiesWithDistance.length} properties found
                  {!searchedTerm && userLocation && (
                    <span className="ml-1">within 5 miles of your location</span>
                  )}
                  {propertyDataByLocation?.searchRadius && searchedTerm && (
                    <span className="ml-1">within {propertyDataByLocation.searchRadius} miles</span>
                  )}
                </p>
                {propertyDataByLocation?.searchType && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {propertyDataByLocation.searchType === 'location-based' ? '📍 Nearby Properties' : propertyDataByLocation.searchType} search
                  </span>
                )}
                {!searchedTerm && userLocation && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    🏠 Auto-discovered
                  </span>
                )}
                {propertyDataByLocation?.filtersApplied ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Filters Applied
                  </span>
                ) : (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    All Property Types
                  </span>
                )}
              </div>
              {!propertyDataByLocation?.filtersApplied && !searchedTerm && userLocation && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
                  <p className="text-sm text-gray-500">
                    💡 Showing all nearby properties. Use search above to explore other areas or apply filters to refine results.
                  </p>
                  <button
                    onClick={() => {
                      clearLocation();
                      window.location.reload();
                    }}
                    className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1 self-start sm:self-auto"
                    title="Remove location and search manually"
                  >
                    <IoMdClose className="w-3 h-3" />
                    Remove Near Me
                  </button>
                </div>
              )}
              {!propertyDataByLocation?.filtersApplied && searchedTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  💡 Showing all property types (For Sale, Recently Sold, For Rent). Use filters above to refine results.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Confidence:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < Math.round((propertyDataByLocation?.confidence || 0.6) * 5)
                        ? "bg-green-500"
                        : "bg-gray-300"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Property Type Breakdown */}
        <PropertyTypeBreakdown 
          properties={propertiesWithDistance}
          filtersApplied={propertyDataByLocation?.filtersApplied || false}
        />

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[500px] lg:h-[calc(100vh-200px)] sticky top-6">
              <div className="h-full">
                <GoogleMapComponent />
              </div>
            </div>
          </div>

          {/* Property Details Section */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
            {/* Selected Property Details */}
            <SelectedPropertyDetails
              key={selectedPropertyId} // Force re-render when selection changes
              selectedProperty={selectedProperty}
              selectedState={selectedState}
              columns={columns}
            />

            {/* Property List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <PropertyList
                properties={propertyData.nearbyHomes}
                selectedState={selectedState}
                onPropertySelect={(property) => {
                  setSelectedPropertyId(property.zpid);
                }}
                selectedPropertyId={selectedPropertyId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PropertiesList() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    }>
      <PropertiesListComponent />
    </Suspense>
  );
}
