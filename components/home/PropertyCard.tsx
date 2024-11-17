import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { formatPropertyValue } from "./utils";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import PageLoader from "../ui/PageLoader";
import { usePropertyData } from "@/store/propertyData";
import Image from "next/image";
import { IoLocationOutline, IoBedOutline, IoCarOutline, IoCalendarOutline } from "react-icons/io5";
import { formatAddress } from "./utils";

interface PropertyCardProps {
  property: any;
  selectedState: string[];
  columns: readonly { readonly id: string; readonly label: string }[];
  onClick: () => void;
  isSelected: boolean;
  viewMode?: "list" | "grid";
}

const PropertyCard = ({
  property,
  selectedState,
  columns,
  onClick,
  isSelected,
  viewMode = "list",
}: PropertyCardProps) => {
  const { setHoveredPropertyId, hoveredPropertyId } = usePropertyData();
  const [selectedPropertyZipId, setSelectedPropertyZipId] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSelected]);

  const { data: propertyDetail, isLoading } = useQuery({
    queryFn: async () => {
      const res = await axios.get(
        `/api/get-property-detail?zpid=${selectedPropertyZipId}`
      );
      return res.data;
    },
    enabled: !!selectedPropertyZipId,
    queryKey: ["property-detail", selectedPropertyZipId],
  });

  const getStatusColor = (status: string) => {
    const normalizedStatus = status || property.listingType || "";
    switch (normalizedStatus) {
      case "RecentlySold":
      case "RECENTLY_SOLD":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ForSale":
      case "FOR_SALE":
        return "bg-green-100 text-green-800 border-green-200";
      case "ForRent":
      case "FOR_RENT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    const normalizedStatus = status || property.listingType || "";
    switch (normalizedStatus) {
      case "RecentlySold":
      case "RECENTLY_SOLD":
        return "Recently Sold";
      case "ForSale":
      case "FOR_SALE":
        return "For Sale";
      case "ForRent":
      case "FOR_RENT":
        return "For Rent";
      default:
        return normalizedStatus || "Unknown";
    }
  };

  if (viewMode === "grid") {
    return (
      <div
        ref={cardRef}
        className={`bg-white rounded-lg shadow-sm border transition-all duration-200 cursor-pointer hover:shadow-md ${isSelected
            ? "border-blue-500 shadow-md ring-2 ring-blue-100"
            : property.zpid === hoveredPropertyId
              ? "border-gray-400 shadow-md"
              : "border-gray-200"
          }`}
        onClick={onClick}
        onMouseEnter={() => setHoveredPropertyId(property.zpid)}
        onMouseLeave={() => setHoveredPropertyId(null)}
      >
        {/* Property Image */}
        {property.image && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={property.image}
              alt="Property"
              fill
              className="object-cover hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              unoptimized
            />
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.Status)}`}>
                {getStatusText(property.Status)}
              </span>
            </div>
            {property.Distance && (
              <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                {typeof property.Distance === 'number' ? property.Distance.toFixed(1) : property.Distance} mi
              </div>
            )}
          </div>
        )}

        {/* Property Details */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
              {formatPropertyValue(property, "Price")}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 line-clamp-1">
              <IoLocationOutline className="w-4 h-4 flex-shrink-0" />
              {formatAddress(property.Address)}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <IoBedOutline className="w-4 h-4" />
              <span>{property.Bedrooms || 0} bed</span>
            </div>
            <div className="flex items-center gap-1">
              <IoCarOutline className="w-4 h-4" />
              <span>{property.Bathrooms || 0} bath</span>
            </div>
            <div className="text-xs">
              {property.LivingArea ? `${property.LivingArea.toLocaleString()} sqft` : "N/A"}
            </div>
          </div>

          {property.Status === "RecentlySold" && property.dateSold && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <IoCalendarOutline className="w-3 h-3" />
              <span>Sold {new Date(property.dateSold).toLocaleDateString()}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-3 border-t border-gray-100">
            {propertyDetail?.data ? (
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium text-center">
                {propertyDetail?.data}
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-2">
                <PageLoader width="w-4" height="h-4" />
              </div>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPropertyZipId(property?.zpid);
                }}
                variant="outline"
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 text-sm"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div
      ref={cardRef}
      className={`bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer ${isSelected
          ? "bg-blue-50 border-l-4 border-l-blue-500"
          : property.zpid === hoveredPropertyId
            ? "bg-gray-50"
            : ""
        }`}
      onClick={onClick}
      onMouseEnter={() => setHoveredPropertyId(property.zpid)}
      onMouseLeave={() => setHoveredPropertyId(null)}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <tbody>
            <tr>
              {selectedState.map((columnId: string) => (
                <td key={columnId} className="px-4 py-4 text-sm border-r border-gray-200 last:border-r-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {formatPropertyValue(property, columnId)}
                    </span>
                    {columnId === "Status" &&
                      property.Status === "RECENTLY_SOLD" &&
                      property.dateSold && (
                        <span className="text-xs text-gray-500 mt-1">
                          Sold {new Date(property.dateSold).toLocaleDateString()}
                        </span>
                      )}
                    {columnId === "Address" && (
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.Status)}`}>
                        {getStatusText(property.Status)}
                      </span>
                    )}
                  </div>
                </td>
              ))}
              <td className="px-4 py-4 text-sm w-32">
                {propertyDetail?.data ? (
                  <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium text-center">
                    {propertyDetail?.data}
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center">
                    <PageLoader width="w-4" height="h-4" />
                  </div>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPropertyZipId(property?.zpid);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
                  >
                    Details
                  </Button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyCard;
