import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    );
  }

  const url = process.env.ZILLOW_URL as string;
  const apiKey = process.env.ZILLOW_API_KEY as string;

  if (!url || !apiKey) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  try {
    console.log("Searching by exact address:", address);

    let response = await axios.get(
      `${url}/property?address=${encodeURIComponent(address)}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
        },
      }
    );

    let data = response.data;

    if (!data || !data.zpid) {
      const zpidMatch = address.match(/\b(\d{8,})\b/);
      if (zpidMatch && zpidMatch[1]) {
        const zpid = zpidMatch[1];
        console.log("Trying with extracted zpid:", zpid);

        try {
          response = await axios.get(`${url}/property?zpid=${zpid}`, {
            headers: {
              "x-rapidapi-key": apiKey,
              "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
            },
          });
          data = response.data;
        } catch (zpidError) {
          console.error("Error fetching by zpid:", zpidError);
        }
      }

      if (!data || !data.zpid) {
        console.log("Falling back to extended search for address:", address);

        let cleanedAddress = address
          .replace(
            /\s+(?:apt|apartment|unit|#|ste|suite|floor|fl)\s*[\w-]+/i,
            ""
          )
          .replace(
            /,\s*(?:apt|apartment|unit|#|ste|suite|floor|fl)\s*[\w-]+/i,
            ""
          )
          .trim();

        if (/^\d{5}(?:-\d{4})?$/.test(cleanedAddress)) {
          console.log("ZIP code only search:", cleanedAddress);
        } else if (
          /school|elementary|middle|high|college|university/i.test(
            cleanedAddress
          )
        ) {
          console.log("School search detected:", cleanedAddress);
          const cityMatch = cleanedAddress.match(
            /,\s*([^,]+)(?:,\s*([A-Z]{2}))?$/
          );
          if (cityMatch && cityMatch[1]) {
            const city = cityMatch[1].trim();
            const state = cityMatch[2] ? cityMatch[2].trim() : "";
            cleanedAddress = state ? `${city}, ${state}` : city;
            console.log(
              "Extracted location from school search:",
              cleanedAddress
            );
          }
        } else if (
          /bedroom|bath|painted|unit|corner/i.test(cleanedAddress) &&
          cleanedAddress.includes(",")
        ) {
          const parts = cleanedAddress.split(",");
          const possibleLocation = parts[parts.length - 1].trim();
          if (
            possibleLocation.length > 0 &&
            !/bedroom|bath|painted|unit|corner/i.test(possibleLocation)
          ) {
            cleanedAddress = possibleLocation;
            console.log(
              "Extracted location from descriptive search:",
              cleanedAddress
            );
          }
        }
        const bedroomMatch = cleanedAddress.match(
          /(\d+)\+?\s*(?:bed|bedroom|br|bedrooms)/i
        );
        let bedsMin = null;

        if (address.toLowerCase().includes("bedroom homes in longview")) {
          console.log("Special case: 3+ bedroom homes in Longview TX");
          cleanedAddress = "Longview, TX";
          if (bedroomMatch && bedroomMatch[1]) {
            bedsMin = bedroomMatch[1];
          } else {
            bedsMin = "3";
          }
        } else if (bedroomMatch && bedroomMatch[1]) {
          bedsMin = bedroomMatch[1];
          console.log(`Extracted ${bedsMin} bedrooms from search term`);

          const locationMatch = cleanedAddress.match(
            /(?:homes?|properties?|houses?)\s+in\s+([\w\s,]+)$/i
          );
          if (locationMatch && locationMatch[1]) {
            cleanedAddress = locationMatch[1].trim();
            console.log(
              "Extracted location from bedroom query:",
              cleanedAddress
            );
          } else {
            const possibleLocation = cleanedAddress
              .replace(/\d+\+?\s*(?:bed|bedroom|br|bedrooms)\s*/i, "")
              .trim();
            if (possibleLocation && possibleLocation !== cleanedAddress) {
              cleanedAddress = possibleLocation;
              console.log(
                "Extracted possible location from bedroom query:",
                cleanedAddress
              );
            }
          }
        }

        const extendedParams = new URLSearchParams();
        extendedParams.append("location", cleanedAddress);

        if (bedsMin) {
          extendedParams.append("bedsMin", bedsMin);
          console.log(`Adding bedroom filter: minimum ${bedsMin} bedrooms`);
        }

        if (/school|zoo|park|mall|airport|hospital/i.test(address)) {
          extendedParams.append("radius", "5");
        }

        response = await axios.get(
          `${url}/propertyExtendedSearch?${extendedParams.toString()}`,
          {
            headers: {
              "x-rapidapi-key": apiKey,
              "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
            },
          }
        );

        if (
          response.data &&
          response.data.props &&
          response.data.props.length > 0
        ) {
          const firstProperty = response.data.props[0];
          return NextResponse.json(
            {
              nearbyHomes: response.data.props.map((home: any) => ({
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
              })),
              searchType: "address",
            },
            { status: 200 }
          );
        }
      }
    }

    if (data && data.zpid) {
      const property = {
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
      };

      return NextResponse.json(
        {
          nearbyHomes: [property],
          searchType: "address",
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Property not found for the given address" },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("Error in search-by-address:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch data from Zillow API", details: error.message },
      { status: 500 }
    );
  }
}
