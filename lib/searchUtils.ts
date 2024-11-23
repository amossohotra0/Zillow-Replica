import { ZILLOW_ENDPOINTS } from "./constants";

export interface SearchAnalysis {
  searchType: string;
  confidence: number;
  suggestedEndpoint: string;
  extractedData: {
    location?: string;
    zipcode?: string;
    address?: string;
    bedrooms?: string;
    school?: string;
    landmark?: string;
    city?: string;
    state?: string;
  };
  queryParams?: Record<string, string>;
}

export function analyzeSearchQuery(query: string): SearchAnalysis {
  const cleanQuery = query.trim().toLowerCase();

  const zipPattern = /^\d{5}(-\d{4})?$/;
  if (zipPattern.test(cleanQuery)) {
    return {
      searchType: "zipcode",
      confidence: 0.9,
      suggestedEndpoint: "search",
      extractedData: {
        zipcode: query.trim(),
      },
      queryParams: {
        location: query.trim(),
      },
    };
  }

  const addressPattern =
    /^\d+\s+[\w\s]+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|ct|court|pl|place|pi|way|blvd|boulevard|cir|circle)\s*,?\s*[\w\s]+,\s*[a-z]{2}(?:\s+\d{5})?$/i;
  if (addressPattern.test(cleanQuery)) {
    const parts = query.split(",").map((p) => p.trim());
    return {
      searchType: "address",
      confidence: 0.85,
      suggestedEndpoint: "property",
      extractedData: {
        address: query.trim(),
        city: parts.length > 1 ? parts[parts.length - 2] : undefined,
        state:
          parts.length > 0 ? parts[parts.length - 1].split(" ")[0] : undefined,
      },
      queryParams: {
        address: query.trim(),
      },
    };
  }

  const cityStatePattern = /^[\w\s]+,\s*[a-z]{2}$/i;
  if (cityStatePattern.test(cleanQuery)) {
    const [city, state] = query.split(",").map((s) => s.trim());
    return {
      searchType: "location",
      confidence: 0.8,
      suggestedEndpoint: "search",
      extractedData: {
        location: query.trim(),
        city: city,
        state: state,
      },
      queryParams: {
        location: query.trim(),
      },
    };
  }

  const bedroomPattern = /(\d+)\+?\s*(?:bed|bedroom|br|bedrooms)/i;
  const bedroomMatch = cleanQuery.match(bedroomPattern);
  if (bedroomMatch) {
    const locationMatch = query.match(
      /(?:homes?|properties?|houses?)\s+(?:in|near)\s+([\w\s,]+)$/i
    );
    const locationPart = locationMatch
      ? locationMatch[1].trim()
      : query
          .replace(bedroomPattern, "")
          .replace(/homes?\s*(in|near)?/i, "")
          .trim();

    return {
      searchType: "bedroom_query",
      confidence: 0.8,
      suggestedEndpoint: "search",
      extractedData: {
        bedrooms: bedroomMatch[1],
        location: locationPart || undefined,
      },
      queryParams: {
        location: locationPart || query.trim(),
        bedsMin: bedroomMatch[1],
      },
    };
  }

  const schoolPattern = /(high\s+school|elementary|middle\s+school|school)/i;
  if (schoolPattern.test(cleanQuery)) {
    const locationPart = query.split(",").slice(1).join(",").trim();
    return {
      searchType: "school",
      confidence: 0.75,
      suggestedEndpoint: "search",
      extractedData: {
        school: query.split(",")[0].trim(),
        location: locationPart || undefined,
      },
      queryParams: {
        location: locationPart || query.trim(),
      },
    };
  }

  const landmarkPattern =
    /(zoo|park|mall|hospital|airport|university|college|beach|lake|mountain)/i;
  if (landmarkPattern.test(cleanQuery)) {
    const locationPart = query.split(",").slice(1).join(",").trim();
    return {
      searchType: "landmark",
      confidence: 0.7,
      suggestedEndpoint: "search",
      extractedData: {
        landmark: query.split(",")[0].trim(),
        location: locationPart || undefined,
      },
      queryParams: {
        location: locationPart || query.trim(),
      },
    };
  }

  return {
    searchType: "descriptive",
    confidence: 0.4,
    suggestedEndpoint: "search",
    extractedData: {
      location: query.trim(),
    },
    queryParams: {
      location: query.trim(),
    },
  };
}

export function buildSearchUrl(
  baseUrl: string,
  analysis: SearchAnalysis,
  additionalParams: Record<string, string> = {}
): string {
  let endpoint: string = ZILLOW_ENDPOINTS.PROPERTY_SEARCH;
  if (analysis.suggestedEndpoint === "property") {
    endpoint = ZILLOW_ENDPOINTS.PROPERTY_DETAIL;
  }

  const url = new URL(baseUrl + endpoint);

  switch (analysis.searchType) {
    case "zipcode":
      url.searchParams.set("location", analysis.extractedData.zipcode || "");
      break;

    case "address":
      if (analysis.suggestedEndpoint === "property") {
        url.searchParams.set("address", analysis.extractedData.address || "");
      } else {
        url.searchParams.set("location", analysis.extractedData.address || "");
      }
      break;

    case "location":
      url.searchParams.set("location", analysis.extractedData.location || "");
      break;

    case "bedroom_query":
      if (analysis.extractedData.location) {
        url.searchParams.set("location", analysis.extractedData.location);
      }
      if (analysis.extractedData.bedrooms && !additionalParams.bedsMin) {
        url.searchParams.set("bedsMin", analysis.extractedData.bedrooms);
      }
      break;

    case "school":
      if (analysis.extractedData.location) {
        url.searchParams.set("location", analysis.extractedData.location);
      } else if (analysis.extractedData.school) {
        url.searchParams.set("location", analysis.extractedData.school);
      }
      break;

    case "landmark":
      if (analysis.extractedData.location) {
        url.searchParams.set("location", analysis.extractedData.location);
      } else if (analysis.extractedData.landmark) {
        url.searchParams.set("location", analysis.extractedData.landmark);
      }
      break;

    default:
      url.searchParams.set("location", analysis.extractedData.location || "");
  }

  Object.entries(additionalParams).forEach(([key, value]) => {
    if (value && value.trim() !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export function generateFallbackStrategies(
  originalQuery: string,
  originalAnalysis: SearchAnalysis
): SearchAnalysis[] {
  const fallbacks: SearchAnalysis[] = [];

  if (originalAnalysis.searchType !== "location") {
    fallbacks.push({
      searchType: "location",
      confidence: Math.max(0.3, originalAnalysis.confidence - 0.2),
      suggestedEndpoint: "search",
      extractedData: {
        location: originalQuery.trim(),
      },
      queryParams: {
        location: originalQuery.trim(),
      },
    });
  }

  if (
    originalAnalysis.extractedData.location &&
    originalAnalysis.extractedData.location !== originalQuery.trim()
  ) {
    fallbacks.push({
      searchType: "location",
      confidence: Math.max(0.3, originalAnalysis.confidence - 0.1),
      suggestedEndpoint: "search",
      extractedData: {
        location: originalAnalysis.extractedData.location,
      },
      queryParams: {
        location: originalAnalysis.extractedData.location,
      },
    });
  }

  if (originalAnalysis.searchType === "address") {
    fallbacks.push({
      searchType: "location",
      confidence: Math.max(0.4, originalAnalysis.confidence - 0.3),
      suggestedEndpoint: "search",
      extractedData: {
        location:
          originalAnalysis.extractedData.address || originalQuery.trim(),
      },
      queryParams: {
        location:
          originalAnalysis.extractedData.address || originalQuery.trim(),
      },
    });
  }

  if (
    originalAnalysis.extractedData.city &&
    originalAnalysis.extractedData.state
  ) {
    const cityState = `${originalAnalysis.extractedData.city}, ${originalAnalysis.extractedData.state}`;
    fallbacks.push({
      searchType: "location",
      confidence: Math.max(0.5, originalAnalysis.confidence - 0.2),
      suggestedEndpoint: "search",
      extractedData: {
        location: cityState,
        city: originalAnalysis.extractedData.city,
        state: originalAnalysis.extractedData.state,
      },
      queryParams: {
        location: cityState,
      },
    });
  }

  if (originalAnalysis.extractedData.state && fallbacks.length < 3) {
    fallbacks.push({
      searchType: "location",
      confidence: 0.3,
      suggestedEndpoint: "search",
      extractedData: {
        location: originalAnalysis.extractedData.state,
        state: originalAnalysis.extractedData.state,
      },
      queryParams: {
        location: originalAnalysis.extractedData.state,
      },
    });
  }

  const uniqueFallbacks = fallbacks.filter(
    (fallback, index, self) =>
      index ===
      self.findIndex(
        (f) => f.extractedData.location === fallback.extractedData.location
      )
  );

  return uniqueFallbacks.slice(0, 3);
}

export function validateSearchAnalysis(
  originalQuery: string,
  analysis: SearchAnalysis
): boolean {
  if (
    !analysis ||
    !analysis.searchType ||
    analysis.confidence < 0 ||
    analysis.confidence > 1
  ) {
    return false;
  }

  if (
    !analysis.extractedData ||
    Object.keys(analysis.extractedData).length === 0
  ) {
    return false;
  }

  switch (analysis.searchType) {
    case "zipcode":
      return (
        !!analysis.extractedData.zipcode &&
        /^\d{5}(-\d{4})?$/.test(analysis.extractedData.zipcode)
      );

    case "address":
      return (
        !!analysis.extractedData.address &&
        analysis.extractedData.address.length > 5
      );

    case "location":
      return (
        !!analysis.extractedData.location &&
        analysis.extractedData.location.length > 1
      );

    case "bedroom_query":
      return (
        !!analysis.extractedData.bedrooms &&
        /^\d+$/.test(analysis.extractedData.bedrooms)
      );

    case "school":
      return (
        !!analysis.extractedData.school &&
        analysis.extractedData.school.length > 2
      );

    case "landmark":
      return (
        !!analysis.extractedData.landmark &&
        analysis.extractedData.landmark.length > 2
      );

    default:
      return analysis.confidence >= 0.3;
  }
}

export function normalizeLocation(location: string): string {
  return location
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,\s*,/g, ",")
    .replace(/^,|,$/g, "");
}

export function extractStateAbbreviation(text: string): string | null {
  const statePattern = /\b([A-Z]{2})\b/g;
  const matches = text.match(statePattern);
  return matches ? matches[matches.length - 1] : null;
}

export const testSearchQueries = [
  "26003",
  "San Antonio, TX",
  "Johnson High School, San Antonio, TX",
  "3+ bedroom homes in Longview TX",
  "Zoo, Apple Valley, MN",
  "Bedroom, Upper Corner Unit, Freshly Painted",
  "21232 Hetke Dr Farmington Hills, MI 48335",
  "3508 Hamilton PI Schertz, TX 78154",
  "Dallas, TX",
  "90210",
  "4 bedroom house in Austin, TX",
  "University of Texas, Austin, TX",
  "Central Park, New York, NY",
];
