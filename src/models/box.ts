export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Box {
  id: string;
  code: string;
  name: string;
  address: string;
  location: Coordinates;
  status?: string;
} 