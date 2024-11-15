import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchedTerm = searchParams.get("searchedTerm") || "197832";

  const url = process.env.ZILLOW_URL as string;
  const apiKey = process.env.ZILLOW_API_KEY as string;

  if (!url || !apiKey) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  try {
    const response = await axios.get(
      url + "/property" + "?zpid=" + searchedTerm,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
        },
      }
    );

    const data = response.data;

    const refinedData = {
      nearbyHomes: (data.nearbyHomes || []).map((home: any) => ({
        zpid: home.zpid,
        address: home.address,
        price: home.price,
        livingArea: home.livingArea,
        image: home?.miniCardPhotos?.[0]?.url || null,
        bedrooms: home.bedrooms,
        bathrooms: home.bathrooms,
        description: home.description,
      })),
    };

    return NextResponse.json(refinedData);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch data from Zillow API",
        details: error?.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
