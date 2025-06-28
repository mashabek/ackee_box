import { Box } from '../models/box';
import { boxRepository, compartmentRepository } from '../repositories';
import { ValidationError, NotFoundError, InternalServerError } from '../common/errors';

/**
 * Box service functions for box-related business logic.
 * All functions are stateless and can be imported individually.
 */

/**
 * Finds all boxes within a given radius (in meters) from the specified latitude and longitude.
 * Optionally filters by available compartment size.
 * Returns an array of Box objects, each with a calculated distance property.
 * @param lat Latitude of the reference point
 * @param lng Longitude of the reference point
 * @param radius Search radius in meters
 * @param requiredSize Optional compartment size filter (S, M, L, XL, XXL)
 * @returns Promise<Box[]> Array of nearby boxes with distance
 */
export async function findNearestBoxes(
  lat: number, 
  lng: number, 
  radius: number, 
  requiredSize?: 'S' | 'M' | 'L' | 'XL' | 'XXL'
): Promise<Box[]> {
  // Validate required parameters
  if (lat === undefined || lng === undefined) {
    throw new ValidationError('Missing lat or lng parameters');
  }
  
  // Parse and validate coordinates
  if (isNaN(lat) || isNaN(lng)) {
    throw new ValidationError('Invalid lat or lng values');
  }
  
  // Validate coordinate ranges
  if (lat < -90 || lat > 90) {
    throw new ValidationError('Latitude must be between -90 and 90 degrees');
  }
  
  if (lng < -180 || lng > 180) {
    throw new ValidationError('Longitude must be between -180 and 180 degrees');
  }
  
  // Parse and validate radius
  if (radius === undefined || isNaN(radius) || radius <= 0) {
    throw new ValidationError('Invalid radius value');
  }
  
  if (radius > 50000) { // Max 50km radius
    throw new ValidationError('Radius must not exceed 50000 meters (50km)');
  }
  
  // Validate size parameter if provided
  if (requiredSize && !['S', 'M', 'L', 'XL', 'XXL'].includes(requiredSize)) {
    throw new ValidationError('Invalid size. Must be one of: S, M, L, XL, XXL');
  }

  try {
    const boxes = await boxRepository.findBoxesInRadius(lat, lng, radius, requiredSize);
    
    return boxes.map(box => ({
      id: box.id,
      code: box.code,
      name: box.name,
      address: box.address,
      location: { lat: box.lat, lng: box.lng },
      status: box.status,
      distance: box.distance,
    }));
  } catch (error) {
    console.error('Error finding nearest boxes:', error);
    throw new InternalServerError('Failed to fetch nearest boxes');
  }
}

/**
 * Get available compartments for a specific box by code
 * @param boxCode The box code to check
 * @returns Promise<{compartments: any[]}> Object with compartments array
 */
export async function getAvailableCompartmentsByCode(boxCode: string): Promise<{compartments: any[]}> {
  if (!boxCode) {
    throw new ValidationError('Missing boxCode parameter');
  }

  try {
    // First find the box by code
    const box = await boxRepository.findActiveByCode(boxCode);
    if (!box) {
      throw new NotFoundError('Box not found');
    }

    // Get available compartments for this box
    const compartments = await compartmentRepository.findAvailableByBoxId(box.id);
    return { compartments };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error fetching compartments by code:', error);
    throw new InternalServerError('Failed to fetch compartments');
  }
}

/**
 * Search for a box by its code (the identifier displayed on the physical box)
 * @param code The box code to search for
 * @returns Promise<Box> The box if found
 */
export async function searchBoxByCode(code: string): Promise<Box> {
  if (!code || typeof code !== 'string') {
    throw new ValidationError('Missing or invalid code parameter');
  }

  try {
    const result = await boxRepository.findByCode(code);
    
    if (!result) {
      throw new NotFoundError('Box not found with the specified code');
    }

    return {
      id: result.id,
      code: result.code,
      name: result.name,
      address: result.address,
      location: { lat: result.lat, lng: result.lng },
      status: result.status,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error searching box by code:', error);
    throw new InternalServerError('Failed to search box');
  }
}