// Coordinates represent a geographical point with latitude and longitude
export interface Coordinates {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lng: number;
}

// Box represents a parcel delivery box (pickup/dropoff point)
export interface Box {
  /** Unique identifier for the box */
  id: string;
  /** Short code or identifier displayed on the box */
  code: string;
  /** Human-readable name of the box */
  name: string;
  /** Physical address of the box */
  address: string;
  /** Geographical location of the box */
  location: Coordinates;
  /** Current status of the box (e.g., 'active', 'inactive') */
  status?: string;
  /** Distance from a reference point, used in API responses (meters) */
  distance?: number;
} 