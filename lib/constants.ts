export const API_CONFIG = {
  ZILLOW_API_KEY: process.env.ZILLOW_API_KEY as string,
  ZILLOW_URL: process.env.ZILLOW_URL as string,
  ZILLOW_HOST: process.env.ZILLOW_HOST as string,
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
} as const;

export const CORS_CONFIG = {
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN as string,
  ALLOWED_HEADERS: process.env.ALLOWED_HEADERS as string,
  EXPOSED_HEADERS: process.env.EXPOSED_HEADERS as string,
  MAX_AGE: process.env.MAX_AGE as string,
  CREDENTIALS: process.env.CREDENTIALS as string,
  DOMAIN_URL: process.env.DOMAIN_URL as string,
} as const;

export const ZILLOW_ENDPOINTS = {
  PROPERTY_SEARCH: process.env.ZILLOW_ENDPOINT_PROPERTY_SEARCH as string,
  PROPERTY_DETAIL: process.env.ZILLOW_ENDPOINT_PROPERTY_DETAIL as string,
  LOCATION_SUGGESTION: process.env
    .ZILLOW_ENDPOINT_LOCATION_SUGGESTION as string,
} as const;

export const HTTP_HEADERS = {
  RAPIDAPI_KEY: process.env.HTTP_HEADER_RAPIDAPI_KEY as string,
  RAPIDAPI_HOST: process.env.HTTP_HEADER_RAPIDAPI_HOST as string,
  CONTENT_TYPE: process.env.HTTP_HEADER_CONTENT_TYPE as string,
  AUTHORIZATION: process.env.HTTP_HEADER_AUTHORIZATION as string,
} as const;

export const SEARCH_DEFAULTS = {
  LISTING_STATUS: process.env.SEARCH_DEFAULT_LISTING_STATUS as string,
  SEARCH_RADIUS: process.env.SEARCH_DEFAULT_RADIUS as string,
  MAX_RESULTS: parseInt(process.env.SEARCH_DEFAULT_MAX_RESULTS as string) || 41,
} as const;
