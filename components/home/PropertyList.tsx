"use client";

import { useState } from "react";
import PropertyCard from "./PropertyCard";
import { columns } from "./utils";
import { FaCaretDown, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { IoGridOutline, IoListOutline } from "react-icons/io5";
import { useLocation } from "@/context/LocationContext";

interface PropertyListProps {
  properties: any[];
  selectedState: string[];
  onPropertySelect: (property: any) => void;
  selectedPropertyId: string | null;
}

const PropertyList = ({
  properties,
  selectedState,
  onPropertySelect,
  selectedPropertyId,
}: PropertyListProps) => {
  const { userLocation } = useLocation();
  const [sortField, setSortField] = useState("Distance");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const sortedData = [...properties]?.sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (sortField === "Status") {
      const rank = (status: string) => (status === "Sold" ? 0 : 1);

      const rankA = rank(String(aVal));
      const rankB = rank(String(bVal));

      // First sort by status rank (Sold vs On Sale)
      if (rankA !== rankB) {
        return sortDirection === "asc" ? rankA - rankB : rankB - rankA;
      }

      if (rankA === 0 && rankB === 0) {
        const dateA = a.dateSold ? new Date(a.dateSold).getTime() : 0;
        const dateB = b.dateSold ? new Date(b.dateSold).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      return 0;
    }

    const parseValue = (val: string | number) => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const num = parseFloat(val.replace(/[^\d.]/g, ""));
        return isNaN(num) ? val.toLowerCase() : num;
      }
      return val;
    };

    const valA = parseValue(aVal);
    const valB = parseValue(bVal);

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (columnId: string) => {
    if (sortField === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(columnId);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (columnId: string) => {
    if (sortField !== columnId) {
      return <FaSort className="text-gray-400" />;
    }
    return sortDirection === "asc" ?
      <FaSortUp className="text-blue-500" /> :
      <FaSortDown className="text-blue-500" />;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Property Results
            </h3>
            <p className="text-sm text-gray-600">
              {sortedData?.length || 0} properties • Click headers to sort
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
                title="List View"
              >
                <IoListOutline className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
                title="Grid View"
              >
                <IoGridOutline className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortField}
              onChange={(e) => handleSort(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Distance">Sort by Distance</option>
              <option value="Price">Sort by Price</option>
              <option value="Bedrooms">Sort by Bedrooms</option>
              <option value="LivingArea">Sort by Size</option>
              <option value="YearBuilt">Sort by Year Built</option>
              <option value="Status">Sort by Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Header - Only show in list view */}
      {viewMode === "list" && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50">
                  {selectedState?.map((columnId: string) => (
                    <th
                      key={columnId}
                      className="text-left px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
                      <button
                        className="flex items-center gap-2 hover:text-gray-900 transition-colors w-full"
                        onClick={() => handleSort(columnId)}
                      >
                        <span>{columns.find((col) => col.id === columnId)?.label}</span>
                        {getSortIcon(columnId)}
                      </button>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-32">
                    Actions
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        </div>
      )}

      {/* Property List */}
      <div className={`${viewMode === "list" ? "max-h-[600px]" : "max-h-[800px]"} overflow-y-auto`}>
        {viewMode === "list" ? (
          // List View
          <div className="divide-y divide-gray-200">
            {sortedData?.map((property: any, index: number) => (
              <PropertyCard
                key={`${property.zpid}-${property.listingType || 'default'}-${index}`}
                property={property}
                selectedState={selectedState}
                columns={columns}
                onClick={() => onPropertySelect(property)}
                isSelected={property.zpid === selectedPropertyId}
                viewMode="list"
              />
            ))}
          </div>
        ) : (
          // Grid View
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedData?.map((property: any, index: number) => (
              <PropertyCard
                key={`${property.zpid}-${property.listingType || 'default'}-${index}`}
                property={property}
                selectedState={selectedState}
                columns={columns}
                onClick={() => onPropertySelect(property)}
                isSelected={property.zpid === selectedPropertyId}
                viewMode="grid"
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {(!sortedData || sortedData.length === 0) && (
        <div className="text-center py-12 bg-white">
          <div className="text-gray-400 text-4xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Properties Found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Load More Button (if needed) */}
      {sortedData && sortedData.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="text-center text-sm text-gray-600">
            Showing {sortedData.length} properties
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
