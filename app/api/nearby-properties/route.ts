import axios from "axios";
import { NextResponse } from "next/server";
import { API_CONFIG, HTTP_HEADERS } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "5"; // Default 5 miles
  const applyFilters = searchParams.get("applyFilters") === "true";
  
  // Filter parameters
  const listingStatus = searchParams.get("listingStatus");
  const bedsMin = searchParams.get("bedsMin");
  const priceMin = searchParams.get("priceMin");
  const sqftMin = searchParams.get("sqftMin");
  const buildYearMin = searchParams.get("buildYearMin");
  const buildYearMax = searchParams.get("buildYearMax");
  const lotSize = searchParams.get("lotSize");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  const url = API_CONFIG.ZILLOW_URL;
  const apiKey = API_CONFIG.ZILLOW_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  try {
    const additionalParams: Record<string, string> = {};

    // Only apply filters if explicitly requested
    if (applyFilters) {
      if (listingStatus) {
        if (!listingStatus.includes(",")) {
          additionalParams.status_type = listingStatus;
        }
      }
      if (bedsMin) additionalParams.bedsMin = bedsMin;
      if (priceMin) additionalParams.minPrice = priceMin;
      if (sqftMin) additionalParams.sqftMin = sqftMin;
      if (buildYearMin) additionalParams.buildYearMin = buildYearMin;
      if (buildYearMax) additionalParams.buildYearMax = buildYearMax;
      if (lotSize) additionalParams.lotSize = lotSize;
    }

    // For initial search without filters, fetch all listing types
    if (!applyFilters) {
      const allListingTypes = ["ForSale", "RecentlySold", "ForRent"];
      let allProperties: any[] = [];

      for (const status of allListingTypes) {
        const statusParams = { 
          ...additionalParams, 
          status_type: status,
          lat: lat,
          lng: lng,
          radius: radius
        };

        // Build URL with location-based search
        const queryParams = new URLSearchParams(statusParams);
        const apiUrl = `${url}?${queryParams.toString()}`;

        try {
          const statusResponse = await axios.get(apiUrl, {
            headers: {
              [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
              [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
            },
          });

          if (statusResponse.data?.props) {
            // Add listing type to each property for identification
            const propertiesWithType = statusResponse.data.props.map((prop: any) => ({
              ...prop,
              listingType: status,
              // Calculate distance from user location
              Distance: calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                prop.latitude,
                prop.longitude
              )
            }));
            allProperties = [...allProperties, ...propertiesWithType];
          }
        } catch (statusError) {
          console.warn(`Failed to fetch ${status} properties:`, statusError);
          // Continue with other statuses
        }
      }

      // Sort by distance
      allProperties.sort((a: any, b: any) => (a.Distance || 0) - (b.Distance || 0));

      return NextResponse.json(
        {
          nearbyHomes: allProperties.map(formatProperty),
          searchType: "location-based",
          confidence: 1.0,
          originalQuery: `${lat}, ${lng}`,
          extractedData: {
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            radius: parseFloat(radius)
          },
          totalResults: allProperties.length,
          filtersApplied: false,
          availableListingTypes: allListingTypes,
          searchRadius: parseFloat(radius),
          userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) }
        },
        { status: 200 }
      );
    }

    // Handle filtered search with specific listing status
    if (listingStatus && listingStatus.includes(",")) {
      const statuses = listingStatus.split(",");
      let allProperties: any[] = [];

      for (const status of statuses) {
        const statusParams = { 
          ...additionalParams, 
          status_type: status,
          lat: lat,
          lng: lng,
          radius: radius
        };

        const queryParams = new URLSearchParams(statusParams);
        const apiUrl = `${url}?${queryParams.toString()}`;

        try {
          const statusResponse = await axios.get(apiUrl, {
            headers: {
              [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
              [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
            },
          });

          if (statusResponse.data?.props) {
            const propertiesWithType = statusResponse.data.props.map((prop: any) => ({
              ...prop,
              listingType: status,
              Distance: calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                prop.latitude,
                prop.longitude
              )
            }));
            allProperties = [...allProperties, ...propertiesWithType];
          }
        } catch (statusError) {
          console.warn(`Failed to fetch ${status} properties:`, statusError);
        }
      }

      // Sort by distance
      allProperties.sort((a: any, b: any) => (a.Distance || 0) - (b.Distance || 0));

      return NextResponse.json(
        {
          nearbyHomes: allProperties.map(formatProperty),
          searchType: "location-based-filtered",
          confidence: 1.0,
          originalQuery: `${lat}, ${lng}`,
          extractedData: {
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            radius: parseFloat(radius)
          },
          totalResults: allProperties.length,
          filtersApplied: true,
          appliedFilters: {
            listingStatus: statuses,
            bedsMin,
            priceMin,
            sqftMin,
            buildYearMin,
            buildYearMax,
            lotSize
          },
          searchRadius: parseFloat(radius),
          userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) }
        },
        { status: 200 }
      );
    }

    // Single listing type or no specific type
    const statusParams = { 
      ...additionalParams,
      lat: lat,
      lng: lng,
      radius: radius
    };

    const queryParams = new URLSearchParams(statusParams);
    const apiUrl = `${url}?${queryParams.toString()}`;

    const response = await axios.get(apiUrl, {
      headers: {
        [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
        [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
      },
    });

    let properties = [];
    if (response.data?.props) {
      properties = response.data.props.map((prop: any) => ({
        ...prop,
        Distance: calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          prop.latitude,
          prop.longitude
        )
      }));
      
      // Sort by distance
      properties.sort((a: any, b: any) => (a.Distance || 0) - (b.Distance || 0));
    }

    const result = {
      nearbyHomes: properties.map(formatProperty),
      searchType: "location-based-filtered",
      confidence: 1.0,
      originalQuery: `${lat}, ${lng}`,
      extractedData: {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseFloat(radius)
      },
      totalResults: properties.length,
      filtersApplied: applyFilters,
      appliedFilters: applyFilters ? {
        listingStatus,
        bedsMin,
        priceMin,
        sqftMin,
        buildYearMin,
        buildYearMax,
        lotSize
      } : null,
      searchRadius: parseFloat(radius),
      userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) }
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch nearby properties",
        details: error.message,
        location: `${lat}, ${lng}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function formatProperty(home: any) {
  return {
    zpid: home.zpid,
    Address: home.address,
    Price: home.price,
    LivingArea: home.livingArea,
    image: home.imgSrc,
    Bedrooms: home.bedrooms,
    Bathrooms: home.bathrooms,
    YearBuilt: home.yearBuilt,
    Status: home.listingStatus,
    latitude: home.latitude,
    longitude: home.longitude,
    dateSold: home.dateSold,
    Distance: home.Distance || 0,
    listingType: home.listingType || home.listingStatus,
  };
}
