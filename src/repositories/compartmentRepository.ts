import { PrismaClient } from '@prisma/client';
import { ICompartmentRepository } from './interfaces/ICompartmentRepository';

const prisma = new PrismaClient();

export class CompartmentRepository implements ICompartmentRepository {
  /**
   * Find all available compartments for a specific box
   * Includes reservation data to check availability status
   * @param boxId - The unique identifier of the box
   * @returns Promise<Compartment[]> Array of available compartments with reservation details
   */
  async findAvailableByBoxId(boxId: string) {
    return await prisma.compartment.findMany({
      where: {
        boxId: boxId,
        status: 'available'
      },
      include: {
        reservations: {
          where: { status: 'active' }
        }
      }
    });
  }

  /**
   * Find the first available compartment of a specific size in a box
   * Used for reservations when a specific compartment size is required
   * @param boxId - The unique identifier of the box
   * @param size - Required compartment size (S, M, L, XL, XXL)
   * @returns Promise<Compartment | null> First matching compartment with reservation details, or null if none available
   */
  async findFirstAvailableBySize(boxId: string, size: 'S' | 'M' | 'L' | 'XL' | 'XXL') {
    return await prisma.compartment.findFirst({
      where: {
        boxId,
        size: size,
        status: 'available'
      },
      include: {
        reservations: {
          where: { status: 'active' }
        }
      }
    });
  }

  /**
   * Update the status of a compartment (available, reserved, occupied)
   * Supports transaction context for atomic operations
   * @param id - The compartment ID to update
   * @param status - New status value ('available', 'reserved', 'occupied')
   * @param tx - Optional Prisma transaction context
   * @returns Promise<Compartment> Updated compartment entity
   */
  async updateStatus(id: number, status: string, tx?: any) {
    const client = tx || prisma;
    return await client.compartment.update({
      where: { id },
      data: { status }
    });
  }
}

export const compartmentRepository = new CompartmentRepository(); 