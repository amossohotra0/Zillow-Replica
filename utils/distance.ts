/**
 * Calculate the straight-line distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = (Math.PI * lat1) / 180;
  const radLng1 = (Math.PI * lng1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const radLng2 = (Math.PI * lng2) / 180;

  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLng = radLng2 - radLng1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Earth's radius in miles
  const radius = 3958.8;
  
  // Calculate the distance
  const distance = radius * c;
  
  // Return distance with 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Calculate the straight-line distance between two coordinates using the Haversine formula
 * @param origin Origin coordinates {lat, lng}
 * @param destination Destination coordinates {lat, lng}
 * @returns Distance in miles
 */
export async function calculateRoadDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  distanceMatrixService: google.maps.DistanceMatrixService
): Promise<{ distance: number; type: string }> {
  try {
    const response = await distanceMatrixService.getDistanceMatrix({
      origins: [new google.maps.LatLng(origin.lat, origin.lng)],
      destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL, // Miles
    });

    if (
      response.rows[0] &&
      response.rows[0].elements[0] &&
      response.rows[0].elements[0].status === 'OK'
    ) {
      // Extract distance in miles (convert from meters if needed)
      const distanceInMiles = response.rows[0].elements[0].distance.value / 1609.34;
      return { 
        distance: Math.round(distanceInMiles * 100) / 100, // Round to 2 decimal places
        type: 'road'
      };
    }
    
    // Fall back to straight-line distance
    return calculateStraightLineDistance(origin, destination);
  } catch (error) {
    console.error('Error calculating road distance:', error);
    // Fall back to straight-line distance
    return calculateStraightLineDistance(origin, destination);
  }
}

/**
 * Calculate the straight-line distance between two coordinates using the Haversine formula
 */
function calculateStraightLineDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): { distance: number; type: string } {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = (Math.PI * origin.lat) / 180;
  const radLng1 = (Math.PI * origin.lng) / 180;
  const radLat2 = (Math.PI * destination.lat) / 180;
  const radLng2 = (Math.PI * destination.lng) / 180;

  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLng = radLng2 - radLng1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Earth's radius in miles
  const radius = 3958.8;
  
  // Calculate the distance
  const distance = radius * c;
  
  // Return distance with 2 decimal places
  return {
    distance: Math.round(distance * 100) / 100,
    type: 'straight'
  };
}