import axios from "axios";
import { NextResponse } from "next/server";
import {
  analyzeSearchQuery,
  buildSearchUrl,
  SearchAnalysis,
  generateFallbackStrategies,
  validateSearchAnalysis,
} from "@/lib/searchUtils";
import { API_CONFIG, HTTP_HEADERS } from "@/lib/constants";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryRequest(fn: () => Promise<any>, maxRetries = 3, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        await delay(delayMs * Math.pow(2, i));
        continue;
      }
      throw error;
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchedTerm = searchParams.get("searchedTerm");
  const listingStatus = searchParams.get("listingStatus");
  const bedsMin = searchParams.get("bedsMin");
  const priceMin = searchParams.get("priceMin");
  const sqftMin = searchParams.get("sqftMin");
  const buildYearMin = searchParams.get("buildYearMin");
  const buildYearMax = searchParams.get("buildYearMax");
  const lotSize = searchParams.get("lotSize");
  const applyFilters = searchParams.get("applyFilters") === "true";

  if (!searchedTerm) {
    return NextResponse.json(
      { error: "Search term is required" },
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
    const analysis = analyzeSearchQuery(searchedTerm);

    if (!validateSearchAnalysis(searchedTerm, analysis)) {
      // Analysis validation failed, continue with default
    }

    const additionalParams: Record<string, string> = {};

    // Only apply filters if explicitly requested
    if (applyFilters) {
      const finalBedsMin = analysis.extractedData.bedrooms || bedsMin;
      if (finalBedsMin) {
        additionalParams.bedsMin = finalBedsMin;
      }

      if (listingStatus) {
        if (!listingStatus.includes(",")) {
          additionalParams.status_type = listingStatus;
        }
      }
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
        const statusParams = { ...additionalParams, status_type: status };
        const apiUrl = buildSearchUrl(url, analysis, statusParams);

        try {
          await delay(500);
          const statusResponse = await retryRequest(() => 
            axios.get(apiUrl, {
              headers: {
                [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
                [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
              },
            })
          );

          if (statusResponse.data?.props) {
            // Add listing type to each property for identification
            const propertiesWithType = statusResponse.data.props.map((prop: any) => ({
              ...prop,
              listingType: status
            }));
            allProperties = [...allProperties, ...propertiesWithType];
          } else if (
            analysis.suggestedEndpoint === "property" &&
            statusResponse.data?.zpid
          ) {
            allProperties.push({
              ...statusResponse.data,
              listingType: status
            });
          }
        } catch (statusError) {
          console.warn(`Failed to fetch ${status} properties:`, statusError);
          // Continue with other statuses
        }
      }

      return NextResponse.json(
        {
          nearbyHomes: allProperties.map(formatProperty),
          searchType: analysis.searchType,
          confidence: analysis.confidence,
          originalQuery: searchedTerm,
          extractedData: analysis.extractedData,
          totalResults: allProperties.length,
          filtersApplied: false,
          availableListingTypes: allListingTypes,
        },
        { status: 200 }
      );
    }

    // Handle filtered search with specific listing status
    if (listingStatus && listingStatus.includes(",")) {
      const statuses = listingStatus.split(",");
      let allProperties: any[] = [];

      for (const status of statuses) {
        const statusParams = { ...additionalParams, status_type: status };
        const apiUrl = buildSearchUrl(url, analysis, statusParams);

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
              listingType: status
            }));
            allProperties = [...allProperties, ...propertiesWithType];
          } else if (
            analysis.suggestedEndpoint === "property" &&
            statusResponse.data?.zpid
          ) {
            allProperties.push({
              ...statusResponse.data,
              listingType: status
            });
          }
        } catch (statusError) {
          console.warn(`Failed to fetch ${status} properties:`, statusError);
          // Continue with other statuses
        }
      }

      return NextResponse.json(
        {
          nearbyHomes: allProperties.map(formatProperty),
          searchType: analysis.searchType,
          confidence: analysis.confidence,
          originalQuery: searchedTerm,
          extractedData: analysis.extractedData,
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
          }
        },
        { status: 200 }
      );
    }

    const apiUrl = buildSearchUrl(url, analysis, additionalParams);

    let response;
    let data;
    const searchAttempts = [];

    try {
      response = await axios.get(apiUrl, {
        headers: {
          [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
          [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
        },
      });
      data = response.data;
      searchAttempts.push({
        strategy: "primary",
        analysis: analysis,
        url: apiUrl,
        success: true,
        resultCount: data?.props?.length || (data?.zpid ? 1 : 0),
      });
    } catch (primaryError: any) {
      searchAttempts.push({
        strategy: "primary",
        analysis: analysis,
        url: apiUrl,
        success: false,
        error: primaryError.message,
      });
    }

    if (!data || !data.props || data.props.length === 0 || !response) {
      const fallbackStrategies = generateFallbackStrategies(
        searchedTerm,
        analysis
      );

      for (let i = 0; i < fallbackStrategies.length; i++) {
        const fallback = fallbackStrategies[i];

        try {
          const fallbackUrl = buildSearchUrl(url, fallback, additionalParams);

          const fallbackResponse = await axios.get(fallbackUrl, {
            headers: {
              [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
              [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
            },
          });

          if (
            fallbackResponse.data?.props &&
            fallbackResponse.data.props.length > 0
          ) {
            data = fallbackResponse.data;
            searchAttempts.push({
              strategy: `fallback-${i + 1}`,
              analysis: fallback,
              url: fallbackUrl,
              success: true,
              resultCount: data.props.length,
            });
            break;
          } else if (
            fallback.suggestedEndpoint === "property" &&
            fallbackResponse.data?.zpid
          ) {
            data = fallbackResponse.data;
            searchAttempts.push({
              strategy: `fallback-${i + 1}`,
              analysis: fallback,
              url: fallbackUrl,
              success: true,
              resultCount: 1,
            });
            break;
          } else {
            searchAttempts.push({
              strategy: `fallback-${i + 1}`,
              analysis: fallback,
              url: fallbackUrl,
              success: false,
              resultCount: 0,
            });
          }
        } catch (fallbackError: any) {
          searchAttempts.push({
            strategy: `fallback-${i + 1}`,
            analysis: fallback,
            url: "error",
            success: false,
            error: fallbackError.message,
          });
        }
      }
    }

    let properties = [];
    const finalSearchType = analysis.searchType;
    let finalConfidence = analysis.confidence;

    if (analysis.suggestedEndpoint === "property" && data?.zpid) {
      properties = [formatProperty(data)];
    } else if (data?.props) {
      properties = data.props.map(formatProperty);
    }

    const successfulAttempt = searchAttempts.find((attempt) => attempt.success);
    if (successfulAttempt && successfulAttempt.strategy !== "primary") {
      finalConfidence = Math.max(0.3, finalConfidence - 0.2);
    }

    const result = {
      nearbyHomes: properties,
      searchType: finalSearchType,
      confidence: finalConfidence,
      originalQuery: searchedTerm,
      extractedData: analysis.extractedData,
      totalResults: properties.length,
      searchAttempts:
        process.env.NODE_ENV === "development" ? searchAttempts : undefined,
      successfulStrategy: successfulAttempt?.strategy || "none",
      filtersApplied: applyFilters,
      appliedFilters: applyFilters ? {
        listingStatus,
        bedsMin,
        priceMin,
        sqftMin,
        buildYearMin,
        buildYearMax,
        lotSize
      } : null
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch data from Zillow API",
        details: error.message,
        searchTerm: searchedTerm,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
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
    Distance: 0,
    listingType: home.listingType || home.listingStatus, // Include listing type for filtering
  };
}
