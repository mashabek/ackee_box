import { Box } from '../../models/box';

export interface IBoxRepository {
  /**
   * Find boxes within a specified radius using geospatial queries
   * @param lat - Latitude of the reference point
   * @param lng - Longitude of the reference point  
   * @param radius - Search radius in meters
   * @param requiredSize - Optional compartment size filter
   * @returns Promise<any[]> Array of boxes with distance calculations
   */
  findBoxesInRadius(
    lat: number, 
    lng: number, 
    radius: number, 
    requiredSize?: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  ): Promise<any[]>;
  
  /**
   * Find a single box by its unique code
   * @param code - The unique box code identifier
   * @returns Promise<any | null> Box data or null if not found
   */
  findByCode(code: string): Promise<any | null>;
  
  /**
   * Find an active box by its code
   * @param code - The unique box code identifier
   * @returns Promise<any> Box entity or null if not found
   */
  findActiveByCode(code: string): Promise<any>;
} 