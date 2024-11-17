"use client";

import { useState } from "react";
import { formatAddress, formatPropertyValue } from "./utils";
import Image from "next/image";
import {
  IoLocationOutline,
  IoBedOutline,
  IoCarOutline,
  IoResizeOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoNavigateOutline,
  IoHeartOutline,
  IoShareOutline,
  IoExpandOutline
} from "react-icons/io5";

interface SelectedPropertyDetailsProps {
  selectedProperty: any;
  selectedState: string[];
  columns: readonly { readonly id: string; readonly label: string }[];
}

const SelectedPropertyDetails = ({
  selectedProperty,
  selectedState,
  columns,
}: SelectedPropertyDetailsProps) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RecentlySold":
      case "RECENTLY_SOLD":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ForSale":
      case "FOR_SALE":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "RecentlySold":
      case "RECENTLY_SOLD":
        return "Recently Sold";
      case "ForSale":
      case "FOR_SALE":
        return "For Sale";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Selected Property</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
              <IoHeartOutline className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
              <IoShareOutline className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Property Image */}
          <div className="lg:col-span-1">
            {selectedProperty.image && !imageError ? (
              <div className="relative group">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={selectedProperty.image}
                    alt="Property"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={() => setImageError(true)}
                    unoptimized
                  />
                </div>
                <button
                  onClick={() => setShowFullImage(true)}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-70 transition-all"
                >
                  <IoExpandOutline className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🏠</div>
                  <p className="text-sm">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Address and Status */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <IoLocationOutline className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  {formatAddress(selectedProperty.Address)}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedProperty.Status)}`}>
                  {getStatusText(selectedProperty.Status)}
                </span>
              </div>
            </div>

            {/* Price and Sale Date */}
            <div className="flex items-center gap-6">
              <div className="text-2xl font-bold text-blue-700">
                {formatPropertyValue(selectedProperty, "Price")}
              </div>
              {selectedProperty.Status === "RecentlySold" && selectedProperty.dateSold && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <IoCalendarOutline className="w-4 h-4" />
                  <span>Sold on {new Date(selectedProperty.dateSold).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Property Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <IoBedOutline className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                <div className="font-semibold text-gray-800">{selectedProperty.Bedrooms || 0}</div>
                <div className="text-xs text-gray-600">Bedrooms</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <IoCarOutline className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                <div className="font-semibold text-gray-800">{selectedProperty.Bathrooms || 0}</div>
                <div className="text-xs text-gray-600">Bathrooms</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <IoResizeOutline className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                <div className="font-semibold text-gray-800">
                  {selectedProperty.LivingArea ? selectedProperty.LivingArea.toLocaleString() : "N/A"}
                </div>
                <div className="text-xs text-gray-600">Sq Ft</div>
              </div>

              {selectedProperty.YearBuilt && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <IoTimeOutline className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <div className="font-semibold text-gray-800">{selectedProperty.YearBuilt}</div>
                  <div className="text-xs text-gray-600">Year Built</div>
                </div>
              )}
            </div>

            {/* Distance */}
            {selectedProperty.Distance && (
              <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                <IoNavigateOutline className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  {typeof selectedProperty.Distance === 'number'
                    ? selectedProperty.Distance.toFixed(2)
                    : selectedProperty.Distance} miles from your location
                </span>
              </div>
            )}

            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {selectedState
                .filter(columnId => !['Address', 'Price', 'Bedrooms', 'Bathrooms', 'LivingArea', 'YearBuilt', 'Status', 'Distance'].includes(columnId))
                .map((columnId: string) => (
                  <div key={columnId} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {columns.find((col) => col.id === columnId)?.label}:
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {formatPropertyValue(selectedProperty, columnId)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && selectedProperty.image && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={selectedProperty.image}
              alt="Property"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
              unoptimized
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedPropertyDetails;
