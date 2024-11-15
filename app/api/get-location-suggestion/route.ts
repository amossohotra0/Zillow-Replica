import axios from "axios";
import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryRequest(fn: () => Promise<any>, maxRetries = 3, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        await delay(delayMs * Math.pow(2, i)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");

  const url = process.env.ZILLOW_URL as string;
  const apiKey = process.env.ZILLOW_API_KEY as string;

  if (!url || !apiKey) {
    return NextResponse.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  try {
    const response = await retryRequest(() => 
      axios.get(
        `${url}/locationSuggestions?q=${location}`,
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "zillow-com1.p.rapidapi.com",
          },
        }
      )
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching location suggestions:", error);
    
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    
    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: "API key invalid or subscription expired." },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch location suggestions" },
      { status: 500 }
    );
  }
}
