import { NextResponse } from "next/server";
import {
  analyzeSearchQuery,
  generateFallbackStrategies,
  validateSearchAnalysis,
  testSearchQueries,
} from "@/lib/searchUtils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const analysis = analyzeSearchQuery(query);
    const isValid = validateSearchAnalysis(query, analysis);
    const fallbackStrategies = generateFallbackStrategies(query, analysis);

    const patterns = {
      isZipCode: /^\d{5}(?:-\d{4})?$/.test(query),
      isExactAddress: /^\d+\s+[\w\s]+(?:,\s*[\w\s]+)*$/.test(query),
      containsZpid: query.match(/\b(\d{8,})\b/) ? true : false,
      containsBedrooms: query.match(/(\d+)\+?\s*(?:bed|bedroom|br|bedrooms)/i)
        ? true
        : false,
      isSchoolSearch: /school|elementary|middle|high|college|university/i.test(
        query
      ),
      isLandmarkSearch:
        /zoo|park|mall|airport|hospital|library|museum|stadium|arena|theater|centre|center/i.test(
          query
        ),
      isDescriptiveSearch:
        /bedroom|bathroom|kitchen|living|room|unit|corner|upper|lower|floor|painted|renovated/i.test(
          query
        ) && query.includes(","),
      isCityState: /^([^,]+),\s*([A-Z]{2}|[A-Za-z\s]+)$/.test(query),
    };

    const extractedInfo: any = {};

    const zpidMatch = query.match(/\b(\d{8,})\b/);
    if (zpidMatch) {
      extractedInfo.zpid = zpidMatch[1];
    }

    const bedroomMatch = query.match(/(\d+)\+?\s*(?:bed|bedroom|br|bedrooms)/i);
    if (bedroomMatch) {
      extractedInfo.bedroomCount = bedroomMatch[1];
    }

    const bedroomLocationMatch = query.match(
      /(?:homes?|properties?|houses?)\s+in\s+([\w\s,]+)$/i
    );
    if (bedroomLocationMatch) {
      extractedInfo.locationFromPattern = bedroomLocationMatch[1].trim();
    }

    const cityStateMatch = query.match(/,\s*([^,]+)(?:,\s*([A-Z]{2}))?$/);
    if (cityStateMatch) {
      extractedInfo.city = cityStateMatch[1]?.trim();
      if (cityStateMatch[2]) {
        extractedInfo.state = cityStateMatch[2].trim();
      }
    }

    if (patterns.isDescriptiveSearch) {
      const parts = query.split(",").map((part) => part.trim());
      const possibleLocation = parts[parts.length - 1];
      if (
        possibleLocation &&
        !/bedroom|bathroom|kitchen|living|room|unit|corner|upper|lower|floor|painted|renovated/i.test(
          possibleLocation
        )
      ) {
        extractedInfo.possibleLocationFromDescriptive = possibleLocation;
      }
    }

    const debugResponse = {
      query,
      timestamp: new Date().toISOString(),
      analysis: {
        searchType: analysis.searchType,
        confidence: analysis.confidence,
        suggestedEndpoint: analysis.suggestedEndpoint,
        extractedData: analysis.extractedData,
        queryParams: analysis.queryParams,
        isValid,
      },
      patterns,
      extractedInfo,
      fallbackStrategies: fallbackStrategies.map((strategy, index) => ({
        id: index + 1,
        searchType: strategy.searchType,
        confidence: strategy.confidence,
        extractedData: strategy.extractedData,
        queryParams: strategy.queryParams,
      })),
      recommendations: generateRecommendations(query, analysis, patterns),
      testQueries: testSearchQueries.map((testQuery) => ({
        query: testQuery,
        isExample: testQuery === query,
        analysis: testQuery === query ? null : analyzeSearchQuery(testQuery),
      })),
    };

    return NextResponse.json(debugResponse, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Debug analysis failed",
        details: error.message,
        query,
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  query: string,
  analysis: any,
  patterns: any
): string[] {
  const recommendations: string[] = [];

  if (analysis.confidence < 0.5) {
    recommendations.push(
      "Low confidence search - consider using more specific terms"
    );
  }

  if (patterns.isDescriptiveSearch && !analysis.extractedData.location) {
    recommendations.push(
      "Descriptive search detected but no clear location found - try adding city/state"
    );
  }

  if (
    patterns.containsBedrooms &&
    !patterns.isSchoolSearch &&
    !analysis.extractedData.location
  ) {
    recommendations.push(
      "Bedroom query detected but no location specified - try 'X bedroom homes in [City, State]'"
    );
  }

  if (query.length < 5) {
    recommendations.push(
      "Very short query - consider adding more details for better results"
    );
  }

  if (!patterns.isZipCode && !patterns.isExactAddress && !query.includes(",")) {
    recommendations.push(
      "Consider adding city and state for more accurate results"
    );
  }

  if (patterns.isSchoolSearch || patterns.isLandmarkSearch) {
    recommendations.push(
      "School/landmark search detected - results will include nearby properties within 5 miles"
    );
  }

  return recommendations;
}
