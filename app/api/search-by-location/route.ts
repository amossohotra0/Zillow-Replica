import axios from "axios";
import { NextResponse } from "next/server";
import { API_CONFIG, HTTP_HEADERS, ZILLOW_ENDPOINTS } from "@/lib/constants";

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

  console.log("Search params:", { searchedTerm, listingStatus });

  const url = API_CONFIG.ZILLOW_URL;
  const apiKey = API_CONFIG.ZILLOW_API_KEY;

  if (!url || !apiKey) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  try {
    const isExactAddress = /^\d+\s+[\w\s]+(?:,\s*[\w\s]+)*$/.test(
      searchedTerm || ""
    );
    const isZipCode = /^\d{5}(?:-\d{4})?$/.test(searchedTerm || "");
    const zpidMatch = searchedTerm ? searchedTerm.match(/\b(\d{8,})\b/) : null;
    const bedroomMatch = searchedTerm
      ? searchedTerm.match(/(\d+)\+?\s*(?:bed|bedroom|br|bedrooms)/i)
      : null;
    const locationMatch = searchedTerm
      ? searchedTerm.match(/(?:homes?|properties?|houses?)\s+in\s+([\w\s,]+)$/i)
      : null;
    const isSchoolSearch = searchedTerm
      ? /school|elementary|middle|high|college|university/i.test(searchedTerm)
      : false;
    const isLandmarkSearch = searchedTerm
      ? /zoo|park|mall|airport|hospital|library|museum|stadium|arena|theater|centre|center/i.test(
          searchedTerm
        )
      : false;

    let endpoint: string = ZILLOW_ENDPOINTS.PROPERTY_SEARCH;
    const queryParams = new URLSearchParams();

    if (listingStatus) {
      if (listingStatus.includes(",")) {
      } else {
        queryParams.append("status_type", listingStatus);
      }
    }
    if (bedsMin) queryParams.append("bedsMin", bedsMin);
    if (priceMin) queryParams.append("minPrice", priceMin);
    if (sqftMin) queryParams.append("sqftMin", sqftMin);
    if (buildYearMin) queryParams.append("buildYearMin", buildYearMin);
    if (buildYearMax) queryParams.append("buildYearMax", buildYearMax);
    if (lotSize) queryParams.append("lotSize", lotSize);
    if (bedroomMatch && bedroomMatch[1] && !bedsMin) {
      const extractedBeds = bedroomMatch[1];
      console.log(`Extracted ${extractedBeds} bedrooms from search term`);
      queryParams.append("bedsMin", extractedBeds);
      console.log(
        "Search parameters after bedroom extraction:",
        Object.fromEntries(queryParams)
      );
    }

    if (zpidMatch && zpidMatch[1]) {
      console.log("Searching by zpid:", zpidMatch[1]);
      endpoint = ZILLOW_ENDPOINTS.PROPERTY_DETAIL;
      queryParams.append("zpid", zpidMatch[1]);
    } else if (isZipCode && searchedTerm) {
      console.log("Searching by ZIP code:", searchedTerm);
      queryParams.append("location", searchedTerm);
    } else if (isExactAddress && searchedTerm) {
      console.log("Searching by address:", searchedTerm);
      queryParams.append("address", searchedTerm);
      endpoint = ZILLOW_ENDPOINTS.PROPERTY_DETAIL;
    } else if (locationMatch && locationMatch[1]) {
      const extractedLocation = locationMatch[1].trim();
      console.log("Extracted location from bedroom query:", extractedLocation);
      queryParams.append("location", extractedLocation);

      if (!listingStatus) {
        console.log("No listing status specified, defaulting to ForSale");
        queryParams.append("status_type", "ForSale");
      }
    } else if ((isSchoolSearch || isLandmarkSearch) && searchedTerm) {
      console.log(
        `Searching by ${isSchoolSearch ? "school" : "landmark"}:`,
        searchedTerm
      );
      queryParams.append("location", searchedTerm);
      queryParams.append("radius", "5");
    } else if (searchedTerm) {
      if (searchedTerm.toLowerCase().includes("bedroom homes in longview")) {
        queryParams.append("location", "Longview, TX");
        if (bedroomMatch && bedroomMatch[1]) {
          queryParams.append("bedsMin", bedroomMatch[1]);
        } else {
          queryParams.append("bedsMin", "3");
        }
        if (!listingStatus) {
          queryParams.append("status_type", "ForSale");
        }
      } else if (bedroomMatch) {
        const possibleLocation = searchedTerm
          .replace(/\d+\+?\s*(?:bed|bedroom|br|bedrooms)\s*/i, "")
          .trim();
        if (possibleLocation) {
          queryParams.append("location", possibleLocation);
        } else {
          queryParams.append("location", searchedTerm);
        }
      } else {
        queryParams.append("location", searchedTerm);
      }
    }
    let data: any = {};
    if (listingStatus && listingStatus.includes(",")) {
      const statuses = listingStatus.split(",");
      let allProperties: any[] = [];
      for (const status of statuses) {
        const statusParams = new URLSearchParams(queryParams.toString());
        statusParams.append("status_type", status);

        const statusApiUrl = `${url}${endpoint}?${statusParams.toString()}`;
        console.log(`API URL for ${status}:`, statusApiUrl);

        try {
          const statusResponse = await axios.get(statusApiUrl, {
            headers: {
              [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
              [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
            },
          });

          if (statusResponse.data?.props) {
            allProperties = [...allProperties, ...statusResponse.data.props];
          } else if (
            endpoint === ZILLOW_ENDPOINTS.PROPERTY_DETAIL &&
            statusResponse.data?.zpid
          ) {
            allProperties.push(statusResponse.data);
          }
        } catch (statusError) {
          console.error(`Error fetching ${status} properties:`, statusError);
        }
      }
      data = { props: allProperties };
    } else {
      const apiUrl = `${url}${endpoint}?${queryParams.toString()}`;
      console.log("API URL:", apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
          [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
        },
      });

      data = response.data;
    }

    if (!data || !data.props || data.props.length === 0) {
      console.log("No results from initial search, trying fallback strategies");

      if (isExactAddress) {
        console.log("Falling back from address to location search");
        queryParams.delete("address");
        queryParams.append("location", searchedTerm || "");
      } else if (
        (isSchoolSearch || isLandmarkSearch) &&
        searchedTerm &&
        searchedTerm.includes(",")
      ) {
        console.log("Extracting city from school/landmark search");
        const cityMatch = searchedTerm.match(/,\s*([^,]+)(?:,\s*([A-Z]{2}))?$/);
        if (cityMatch && cityMatch[1]) {
          const city = cityMatch[1].trim();
          const state = cityMatch[2] ? cityMatch[2].trim() : "";
          const locationQuery = state ? `${city}, ${state}` : city;

          console.log("Searching by extracted city:", locationQuery);
          queryParams.delete("location");
          queryParams.append("location", locationQuery);
        }
      } else if (searchedTerm && searchedTerm.includes(",")) {
        const parts = searchedTerm.split(",");
        const possibleLocation = parts[parts.length - 1].trim();
        if (
          possibleLocation.length > 0 &&
          !/bedroom|bath|painted|unit|corner/i.test(possibleLocation)
        ) {
          console.log("Trying with possible location:", possibleLocation);
          queryParams.delete("location");
          queryParams.append("location", possibleLocation);
        }
      }
      const fallbackUrl = `${url}${
        ZILLOW_ENDPOINTS.PROPERTY_SEARCH
      }?${queryParams.toString()}`;
      console.log("Fallback URL:", fallbackUrl);

      try {
        const fallbackResponse = await axios.get(fallbackUrl, {
          headers: {
            [HTTP_HEADERS.RAPIDAPI_KEY]: apiKey,
            [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
          },
        });

        if (fallbackResponse.data && fallbackResponse.data.props) {
          data = { props: fallbackResponse.data.props };
        }
      } catch (fallbackError) {
        console.error("Error in fallback search:", fallbackError);
      }
    }

    let properties = [];

    if (
      (endpoint === ZILLOW_ENDPOINTS.PROPERTY_DETAIL ||
        endpoint === ZILLOW_ENDPOINTS.PROPERTY_DETAIL) &&
      data &&
      data.zpid
    ) {
      properties = [
        {
          zpid: data.zpid,
          Address: data.address,
          Price: data.price,
          LivingArea: data.livingArea,
          image: data.imgSrc,
          Bedrooms: data.bedrooms,
          Bathrooms: data.bathrooms,
          YearBuilt: data.yearBuilt,
          Status: data.listingStatus,
          latitude: data.latitude,
          longitude: data.longitude,
          dateSold: data.dateSold,
          Distance: 0,
        },
      ];
    } else if (data?.props) {
      properties = data.props.map((home: any) => ({
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
      }));
    }

    const refinedData = {
      nearbyHomes: properties,
      searchType: isExactAddress ? "address" : "location",
    };

    return NextResponse.json(refinedData, { status: 200 });
  } catch (error: any) {
    console.error("Error in search-by-location:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch data from Zillow API", details: error.message },
      { status: 500 }
    );
  }
}
