"use client";

import { useEffect, useState, useCallback } from "react";
import { Dropdown } from "./DropDown";
import { FilterComponent } from "./FilterComponent";
import { IoIosSearch, IoMdClose } from "react-icons/io";
import { IoLocationOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import queryClient from "@/lib/queryclient";
import {
  bedrooms,
  price,
  size,
  listingStatus,
  searchLocation,
} from "@/lib/filterItems";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { useQueryState } from "@/store/queryState";
import { useLocation } from "@/context/LocationContext";

const Navbar = () => {
  const { getQueryString, updateQuery } = useQueryState();
  const { userLocation, clearLocation } = useLocation();
  const query = JSON.parse(decodeURIComponent(getQueryString()));

  const { searchedTerm, listingType, filterState } = query;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(searchedTerm || "");
  const [debouncedSearchInput] = useDebounce(searchInput, 300);

  const [draftYearBuilt, setDraftYearBuilt] = useState({
    buildYearMin: filterState?.buildYear?.min || "2000",
    buildYearMax: filterState?.buildYear?.max || "2025",
  });

  const router = useRouter();

  const handleSearch = useCallback(() => {
    router.push(`?query=${getQueryString()}`);
    queryClient.invalidateQueries({ queryKey: ["property-search"] });
  }, [router, getQueryString]);

  // Sync search input with query state
  useEffect(() => {
    setSearchInput(searchedTerm || "");
  }, [searchedTerm]);

  // Only trigger search when filters change if we already have a search term
  useEffect(() => {
    if (searchedTerm) {
      handleSearch();
    }
  }, [
    listingType,
    filterState?.beds?.min,
    filterState?.price?.min,
    filterState?.sqftMin?.min,
    filterState?.buildYear?.min,
    filterState?.buildYear?.max,
    filterState?.lotSize?.min,
    handleSearch,
    searchedTerm,
  ]);

  const { data: locationSuggestions, isLoading: isLoadingLocationSuggestions } =
    useQuery({
      queryFn: async () => {
        const res = await axios.get(
          `/api/get-location-suggestion?location=${debouncedSearchInput}`
        );
        return res.data;
      },
      queryKey: ["location-suggestions", debouncedSearchInput],
      enabled: !!debouncedSearchInput && debouncedSearchInput.length > 2 && dropdownOpen,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  const searchExamples = [
    { query: "26003", type: "ZIP Code", icon: "📍" },
    { query: "San Antonio, TX", type: "City, State", icon: "🏙️" },
    { query: "Johnson High School, San Antonio, TX", type: "School", icon: "🏫" },
    { query: "3+ bedroom homes in Longview TX", type: "Bedroom Query", icon: "🏠" },
    { query: "Zoo, Apple Valley, MN", type: "Landmark", icon: "🦁" },
    { query: "21232 Hetke Dr Farmington Hills, MI 48335", type: "Address", icon: "📍" }
  ];

  return (
    <div className="w-full bg-white sticky top-0 z-50 shadow-sm border-b border-gray-200">
      {/* Main Navbar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo/Brand and Location */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Zillow</h1>
            {userLocation && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <IoLocationOutline className="w-4 h-4 text-green-600" />
                <span>{searchedTerm ? 'Location Set' : 'Near You'}</span>
                <button
                  onClick={() => {
                    clearLocation();
                    if (!searchedTerm) {
                      window.location.reload();
                    }
                  }}
                  className="text-green-600 hover:text-green-800 ml-1"
                  title="Remove location and search manually"
                >
                  <IoMdClose className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Search Section */}
          <div className="flex-1 max-w-3xl mx-2 sm:mx-4 lg:mx-8">
            <div className="relative">
              {/* Search Input */}
              <div className="relative flex items-center bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 navbar-search-input">
                <div className="absolute left-3 text-gray-400 pointer-events-none">
                  <IoIosSearch className="text-lg sm:text-xl" />
                </div>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  type="text"
                  className="w-full h-10 sm:h-12 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-l-lg navbar-search-input"
                  placeholder={userLocation ? "Search specific address, city, ZIP..." : "Search by address, city, ZIP, school..."}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateQuery("searchedTerm", searchInput);
                      setTimeout(handleSearch, 50);
                      setDropdownOpen(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    updateQuery("searchedTerm", searchInput);
                    setTimeout(handleSearch, 50);
                    setDropdownOpen(false);
                  }}
                  className="h-10 sm:h-12 px-3 sm:px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-r-lg transition-colors duration-200 flex items-center gap-1 sm:gap-2"
                >
                  <IoIosSearch className="text-lg" />
                  <span className="hidden sm:inline text-sm">Search</span>
                </button>
              </div>

              {/* Search Suggestions Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto search-examples-grid">
                  <div className="p-2">
                    {/* Location Suggestions */}
                    {locationSuggestions?.results?.length > 0 && (
                      <>
                        <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-100 mb-1">
                          📍 Suggested locations:
                        </div>
                        {locationSuggestions.results.slice(0, 5).map((suggestion: any, index: number) => (
                          <div
                            key={suggestion.id || `suggestion-${index}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setSearchInput(suggestion.display);
                              updateQuery("searchedTerm", suggestion.display);
                              setDropdownOpen(false);
                              setTimeout(handleSearch, 100);
                            }}
                            className="flex items-center p-2 hover:bg-blue-50 cursor-pointer rounded-md"
                          >
                            <IoLocationOutline className="text-blue-500 mr-3 flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm truncate">{suggestion.display}</span>
                              {suggestion.metaData && (
                                <span className="text-xs text-gray-500 truncate">
                                  {suggestion.metaData.city}, {suggestion.metaData.state}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-gray-100 my-2"></div>
                      </>
                    )}
                    
                    {/* Loading State */}
                    {isLoadingLocationSuggestions && debouncedSearchInput.length > 2 && (
                      <>
                        <div className="text-xs text-gray-500 px-2 py-1 border-b border-gray-100 mb-1">
                          🔍 Searching locations...
                        </div>
                        <div className="flex items-center p-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
                          <span className="text-sm text-gray-500">Finding suggestions...</span>
                        </div>
                        <div className="border-t border-gray-100 my-2"></div>
                      </>
                    )}
                    
                    {/* Search Examples */}
                    <div className="text-xs text-gray-500 px-2 py-1 mb-1">
                      💡 Search examples:
                    </div>
                    {searchExamples.slice(0, 4).map((example, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSearchInput(example.query);
                          updateQuery("searchedTerm", example.query);
                          setDropdownOpen(false);
                          setTimeout(handleSearch, 100);
                        }}
                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-md"
                      >
                        <span className="text-sm mr-3 flex-shrink-0">{example.icon}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">{example.query}</span>
                          <span className="text-xs text-gray-500">{example.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Examples - Hidden on mobile */}
              <div className="hidden sm:flex items-center justify-between mt-2 text-xs text-gray-600">
                <span className="truncate">Smart search detects addresses, ZIP codes, schools, and landmarks automatically</span>

                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  {/* Examples Dropdown */}
                  <div className="relative group">
                    <button className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 whitespace-nowrap">
                      Examples
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <div className="absolute right-0 mt-1 w-80 bg-white shadow-lg rounded-lg border border-gray-200 p-3 z-50 hidden group-hover:block search-examples-grid">
                      <div className="text-xs font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-100">
                        Try these search examples:
                      </div>
                      <div className="space-y-1">
                        {searchExamples.map((example, i) => (
                          <button
                            key={i}
                            className="w-full text-left p-2 hover:bg-blue-50 rounded-md flex items-center justify-between group/item"
                            onClick={() => {
                              setSearchInput(example.query);
                              updateQuery("searchedTerm", example.query);
                              setTimeout(handleSearch, 100);
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm flex-shrink-0">{example.icon}</span>
                              <span className="font-medium text-sm text-gray-800 truncate">{example.query}</span>
                            </div>
                            <span className="text-xs text-gray-500 group-hover/item:text-blue-600 flex-shrink-0 ml-2">
                              {example.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Debug Link (Development Only) */}
                  {process.env.NODE_ENV === 'development' && (
                    <a
                      href={`/api/debug-search?query=${encodeURIComponent(searchedTerm || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 whitespace-nowrap"
                      title="Debug search query"
                    >
                      Debug
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 filter-dropdown-trigger"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              {showFilters && <IoMdClose className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="border-t border-gray-200 filter-section">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {/* Filter Header */}
            <div className="mb-4 text-center">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Refine Your Search</h3>
              <p className="text-xs text-gray-500">
                Initial search shows all property types. Apply filters below to narrow results.
              </p>
            </div>

            {/* Mobile: Stack filters vertically */}
            <div className="block sm:hidden space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Dropdown
                  title="Min Bedrooms"
                  items={bedrooms}
                  value={filterState?.beds?.min || ""}
                  onChange={(value) => updateQuery("filterState.beds.min", value)}
                />

                <Dropdown
                  title="Min Price"
                  items={price}
                  value={filterState?.price?.min || ""}
                  onChange={(value) => updateQuery("filterState.price.min", value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Dropdown
                  title="Square Feet"
                  items={size}
                  value={filterState?.sqftMin?.min || ""}
                  onChange={(value) => updateQuery("filterState.sqftMin.min", value)}
                />

                <Dropdown
                  title="Listing Status"
                  items={listingStatus}
                  value={listingType || ""}
                  onChange={(value) => updateQuery("listingType", value)}
                />
              </div>

              {/* Year Built Range - Mobile */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1 font-medium">Year Built</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={draftYearBuilt.buildYearMin}
                    placeholder="Min Year"
                    className="flex-1 h-9 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) =>
                      setDraftYearBuilt((prev) => ({
                        ...prev,
                        buildYearMin: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      updateQuery("filterState.buildYear.min", draftYearBuilt.buildYearMin)
                    }
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={draftYearBuilt.buildYearMax}
                    placeholder="Max Year"
                    className="flex-1 h-9 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) =>
                      setDraftYearBuilt((prev) => ({
                        ...prev,
                        buildYearMax: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      updateQuery("filterState.buildYear.max", draftYearBuilt.buildYearMax)
                    }
                  />
                </div>
              </div>

              {/* Search Area - Mobile */}
              <div className="grid grid-cols-1 gap-3">
                <Dropdown
                  title="Search Area"
                  items={searchLocation}
                  value={query.searchArea || ""}
                  onChange={(value) => {
                    updateQuery("searchArea", value);
                    if (value === "nearme" && userLocation) {
                      updateQuery("searchedTerm", "");
                      queryClient.invalidateQueries({ queryKey: ["property-search"] });
                      setTimeout(() => {
                        router.push(`?query=${getQueryString()}`);
                      }, 100);
                    }
                  }}
                />
              </div>

              {/* Display Options - Mobile */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-medium">Display Options</label>
                  <FilterComponent />
                </div>
              </div>
            </div>

            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex flex-wrap items-center gap-4">
              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                <Dropdown
                  title="Min Bedrooms"
                  items={bedrooms}
                  value={filterState?.beds?.min || ""}
                  onChange={(value) => updateQuery("filterState.beds.min", value)}
                />

                <Dropdown
                  title="Min Price"
                  items={price}
                  value={filterState?.price?.min || ""}
                  onChange={(value) => updateQuery("filterState.price.min", value)}
                />

                <Dropdown
                  title="Square Feet"
                  items={size}
                  value={filterState?.sqftMin?.min || ""}
                  onChange={(value) => updateQuery("filterState.sqftMin.min", value)}
                />

                <Dropdown
                  title="Listing Status"
                  items={listingStatus}
                  value={listingType || ""}
                  onChange={(value) => updateQuery("listingType", value)}
                />

                {/* Year Built Range */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-medium">Year Built</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={draftYearBuilt.buildYearMin}
                      placeholder="Min"
                      className="w-20 h-9 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) =>
                        setDraftYearBuilt((prev) => ({
                          ...prev,
                          buildYearMin: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        updateQuery("filterState.buildYear.min", draftYearBuilt.buildYearMin)
                      }
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={draftYearBuilt.buildYearMax}
                      placeholder="Max"
                      className="w-20 h-9 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) =>
                        setDraftYearBuilt((prev) => ({
                          ...prev,
                          buildYearMax: e.target.value,
                        }))
                      }
                      onBlur={() =>
                        updateQuery("filterState.buildYear.max", draftYearBuilt.buildYearMax)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Search Area - Desktop */}
              <Dropdown
                title="Search Area"
                items={searchLocation}
                value={query.searchArea || ""}
                onChange={(value) => {
                  updateQuery("searchArea", value);
                  if (value === "nearme" && userLocation) {
                    updateQuery("searchedTerm", "");
                    setTimeout(handleSearch, 100);
                  }
                }}
              />

              {/* Display Options */}
              <div className="ml-auto flex items-center gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-medium">Display</label>
                  <FilterComponent />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                💡 Tip: Initial search shows all property types. Use filters to refine results.
              </div>
              <button
                onClick={() => {
                  // Reset all filters to default values (empty)
                  updateQuery("filterState.beds.min", "");
                  updateQuery("filterState.price.min", "");
                  updateQuery("filterState.sqftMin.min", "");
                  updateQuery("filterState.buildYear.min", "");
                  updateQuery("filterState.buildYear.max", "");
                  updateQuery("filterState.lotSize.min", "");
                  updateQuery("listingType", "");
                  setDraftYearBuilt({ buildYearMin: "", buildYearMax: "" });
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Show all property types
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
