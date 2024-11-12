import { NextRequest, NextResponse } from "next/server";

const corsOptions: {
  allowedMethods: string[];
  allowedOrigins: string[];
  allowedHeaders: string;
  exposedHeaders: string;
  maxAge?: number;
  credentials: boolean;
} = {
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedOrigins: process.env?.ALLOWED_ORIGIN?.split(",") || [],
  allowedHeaders: process.env?.ALLOWED_HEADERS || "",
  exposedHeaders: process.env?.EXPOSED_HEADERS || "",
  maxAge: (process.env?.MAX_AGE && parseInt(process.env?.MAX_AGE)) || undefined,
  credentials: process.env?.CREDENTIALS == "true",
};

export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  const origin = req.headers.get("origin") ?? "";

  if (corsOptions.allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    return response;
  }

  response.headers.set(
    "Access-Control-Allow-Credentials",
    corsOptions.credentials.toString()
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    corsOptions.allowedMethods.join(",")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    corsOptions.allowedHeaders
  );
  response.headers.set(
    "Access-Control-Expose-Headers",
    corsOptions.exposedHeaders
  );
  response.headers.set(
    "Access-Control-Max-Age",
    corsOptions.maxAge?.toString() ?? ""
  );

  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  if (token && pathname.startsWith("/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (!token && pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/:path*", "/api/:path*"],
};
