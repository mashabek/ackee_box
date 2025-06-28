// Coordinates represent a geographical point with latitude and longitude
export interface Coordinates {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lng: number;
}

// Box represents a parcel delivery box (pickup/dropoff point)
export interface Box {
  id: string;
  code: string;
  name: string;
  address: string;
  location: Coordinates;
  /** Current status of the box (e.g., 'active', 'inactive') */
  status?: string;
  /** Distance from a reference point (meters) */
  distance?: number;
} 