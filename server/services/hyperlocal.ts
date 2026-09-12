export interface GeoLocation {
  lat: number;
  lng: number;
}

// Haversine formula to compute great-circle distance between two coordinates in kilometers
export function calculateDistanceKm(from: GeoLocation, to: GeoLocation): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function isShopOpen(openingTime = '06:00', closingTime = '23:00', now = new Date()): boolean {
  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }
  // Handles overnight operations e.g. 20:00 to 04:00
  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
}

export function calculateDeliveryEta(
  distanceKm: number,
  prepTimeMinutes: number = 10,
  averageSpeedKmh: number = 20
): { minMinutes: number; maxMinutes: number; displayText: string } {
  // Travel time in minutes based on urban quick commerce speed
  const transitMinutes = Math.ceil((distanceKm / averageSpeedKmh) * 60);
  const baseMinutes = prepTimeMinutes + transitMinutes;
  const minMinutes = Math.max(10, Math.round(baseMinutes * 0.9));
  const maxMinutes = Math.max(minMinutes + 5, Math.round(baseMinutes * 1.3));

  return {
    minMinutes,
    maxMinutes,
    displayText: `${minMinutes}-${maxMinutes} mins`
  };
}
