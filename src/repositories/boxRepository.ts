import { PrismaClient } from '@prisma/client';
import { Box } from '../models/box';
import { IBoxRepository } from './interfaces/IBoxRepository';

const prisma = new PrismaClient();

export class BoxRepository implements IBoxRepository {
  /**
   * Find boxes within a specified radius using PostGIS geospatial queries
   * Optionally filters by compartment size availability
   * @param lat - Latitude of the reference point
   * @param lng - Longitude of the reference point  
   * @param radius - Search radius in meters
   * @param requiredSize - Optional compartment size filter (S, M, L, XL, XXL)
   * @returns Promise<any[]> Array of boxes with distance calculations
   */
  async findBoxesInRadius(
    lat: number, 
    lng: number, 
    radius: number, 
    requiredSize?: 'S' | 'M' | 'L' | 'XL' | 'XXL'
  ): Promise<any[]> {
    let query: string;
    let params: any[];

    if (requiredSize) {
      query = `SELECT DISTINCT b.id, b.code, b.name, b.address, b.status,
        ST_X(b.location::geometry) as lng,
        ST_Y(b.location::geometry) as lat,
        ST_Distance(b.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM "Box" b
      JOIN compartments c ON b.id = c.box_id
      WHERE ST_DWithin(b.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        AND b.status = 'active'
        AND c.size = $4
        AND c.status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM compartment_reservations cr 
          WHERE cr.compartment_id = c.id 
          AND cr.status = 'active' 
          AND cr.expires_at > NOW()
        )
      ORDER BY distance`;
      params = [lng, lat, radius, requiredSize];
    } else {
      query = `SELECT id, code, name, address, status,
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM "Box"
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        AND status = 'active'
      ORDER BY distance`;
      params = [lng, lat, radius];
    }

    return await prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  /**
   * Find a single box by its unique code using raw SQL with geospatial data
   * @param code - The unique box code identifier
   * @returns Promise<any | null> Box data with location coordinates, or null if not found
   */
  async findByCode(code: string): Promise<any | null> {
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, code, name, address, status,
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat
      FROM "Box"
      WHERE code = $1 AND status = 'active'`,
      code
    );

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find an active box by its code using standard Prisma query
   * @param code - The unique box code identifier
   * @returns Promise<Box | null> Box entity from Prisma, or null if not found
   */
  async findActiveByCode(code: string) {
    return await prisma.box.findUnique({
      where: { code: code, status: 'active' }
    });
  }
}

export const boxRepository = new BoxRepository(); 