import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zpid = searchParams.get("zpid");

  const url = process.env.ZILLOW_URL as string;
  const apiKey = process.env.ZILLOW_API_KEY as string;

  if (!url || !apiKey) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  const response = await axios.get(url + "/property" + "?zpid=" + zpid, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
    },
  });

  const data = response.data;

  return NextResponse.json(
    {
      data: data.yearBuilt,
    },
    { status: 200 }
  );
}
