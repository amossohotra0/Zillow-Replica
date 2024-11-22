import {
  API_CONFIG,
  HTTP_HEADERS,
  ZILLOW_ENDPOINTS,
  SEARCH_DEFAULTS,
} from "@/lib/constants";

export const useApiConfig = () => {
  return {
    apiConfig: API_CONFIG,
    headers: HTTP_HEADERS,
    endpoints: ZILLOW_ENDPOINTS,
    searchDefaults: SEARCH_DEFAULTS,

    getApiHeaders: () => ({
      [HTTP_HEADERS.RAPIDAPI_KEY]: API_CONFIG.ZILLOW_API_KEY,
      [HTTP_HEADERS.RAPIDAPI_HOST]: API_CONFIG.ZILLOW_HOST,
      [HTTP_HEADERS.CONTENT_TYPE]: "application/json",
    }),

    buildApiUrl: (endpoint: string) => `${API_CONFIG.ZILLOW_URL}${endpoint}`,

    getSearchUrl: (searchType: "property" | "search" = "search") => {
      const endpoint =
        searchType === "property"
          ? ZILLOW_ENDPOINTS.PROPERTY_DETAIL
          : ZILLOW_ENDPOINTS.PROPERTY_SEARCH;
      return `${API_CONFIG.ZILLOW_URL}${endpoint}`;
    },
  };
};
