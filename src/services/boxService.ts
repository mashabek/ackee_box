import { Box } from '../models/box';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service for box-related business logic and data access.
 */

/**
 * Finds all boxes within a given radius (in meters) from the specified latitude and longitude.
 * Returns an array of Box objects, each with a calculated distance property.
 * @param lat Latitude of the reference point
 * @param lng Longitude of the reference point
 * @param radius Search radius in meters
 * @returns Promise<Box[]> Array of nearby boxes with distance
 */
export async function findNearestBoxes(lat: number, lng: number, radius: number): Promise<Box[]> {
  // Use raw SQL to leverage PostGIS for geospatial queries within a radius
  const boxes = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, code, name, address, status,
      ST_X(location::geometry) as lng,
      ST_Y(location::geometry) as lat,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
    FROM "Box"
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
    ORDER BY distance`,
    lng, lat, radius
  );
  return boxes.map(box => ({
    id: box.id,
    code: box.code,
    name: box.name,
    address: box.address,
    location: { lat: box.lat, lng: box.lng },
    status: box.status,
    distance: box.distance,
  }));
} 