"use client";

import React from 'react';

interface PropertyTypeBreakdownProps {
  properties: any[];
  filtersApplied: boolean;
}

const PropertyTypeBreakdown: React.FC<PropertyTypeBreakdownProps> = ({ 
  properties, 
  filtersApplied 
}) => {
  // Count properties by type
  const typeCounts = properties.reduce((acc, property) => {
    const type = property.listingType || property.Status || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Define type display names and colors (matching map markers)
  const typeConfig = {
    'ForSale': { label: 'For Sale', color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-700' },
    'RecentlySold': { label: 'Recently Sold', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700' },
    'ForRent': { label: 'For Rent', color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700' },
    'Unknown': { label: 'Other', color: 'bg-gray-500', lightColor: 'bg-gray-100', textColor: 'text-gray-700' }
  };

  const totalProperties = properties.length;

  if (totalProperties === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Property Type Breakdown</h3>
        {!filtersApplied && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            All Types Shown
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {Object.entries(typeCounts).map(([type, count]) => {
          const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.Unknown;
          const percentage = Math.round(((count as number) / totalProperties) * 100);
          
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-3 h-3 rounded-sm ${config.color}`}></div>
                <span className="text-sm text-gray-700">{config.label}</span>
                <div className="flex-1 mx-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${config.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{count as number}</span>
                <span className="text-xs text-gray-500">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {!filtersApplied && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            💡 Use the filters above to show only specific property types
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyTypeBreakdown;
