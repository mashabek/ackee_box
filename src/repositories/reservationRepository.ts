import { PrismaClient } from '@prisma/client';
import { IReservationRepository } from './interfaces/IReservationRepository';

const prisma = new PrismaClient();

export class ReservationRepository implements IReservationRepository {
  /**
   * Find all active reservations for a specific order
   * Includes compartment details for reservation management
   * @param orderId - The unique order ID
   * @param tx - Optional Prisma transaction context
   * @returns Promise<CompartmentReservation[]> Array of active reservations with compartment data
   */
  async findActiveByOrderId(orderId: number, tx?: any) {
    const client = tx || prisma;
    return await client.compartmentReservation.findMany({
      where: { 
        orderId, 
        status: 'active' 
      },
      include: { compartment: true }
    });
  }

  /**
   * Find the first active reservation for an order with full compartment and box details
   * Used when checking for existing reservations during delivery operations
   * @param orderId - The unique order ID
   * @param tx - Optional Prisma transaction context
   * @returns Promise<CompartmentReservation | null> Reservation with nested compartment and box data, or null
   */
  async findFirstActiveByOrderIdWithDetails(orderId: number, tx?: any) {
    const client = tx || prisma;
    return await client.compartmentReservation.findFirst({
      where: { 
        orderId, 
        status: 'active' 
      },
      include: { 
        compartment: {
          include: { box: true }
        }
      }
    });
  }

  /**
   * Find a specific reservation by ID with full compartment and box details
   * @param id - The unique reservation ID
   * @param tx - Optional Prisma transaction context
   * @returns Promise<CompartmentReservation | null> Reservation with nested compartment and box data, or null
   */
  async findByIdWithDetails(id: number, tx?: any) {
    const client = tx || prisma;
    return await client.compartmentReservation.findUnique({
      where: { id },
      include: { 
        compartment: {
          include: { box: true }
        }
      }
    });
  }

  /**
   * Create a new compartment reservation
   * Automatically sets status to 'active'
   * @param data - Reservation creation data
   * @param data.compartmentId - ID of the compartment being reserved
   * @param data.orderId - ID of the order this reservation is for
   * @param data.driverId - ID of the driver making the reservation
   * @param data.expiresAt - When this reservation expires
   * @param tx - Optional Prisma transaction context
   * @returns Promise<CompartmentReservation> Newly created reservation
   */
  async create(data: {
    compartmentId: number;
    orderId: number;
    driverId: string;
    expiresAt: Date;
  }, tx?: any) {
    const client = tx || prisma;
    return await client.compartmentReservation.create({
      data: {
        ...data,
        status: 'active'
      }
    });
  }

  /**
   * Update the status of a reservation
   * @param id - The unique reservation ID
   * @param status - New status ('active', 'expired', 'completed')
   * @param tx - Optional Prisma transaction context
   * @returns Promise<CompartmentReservation> Updated reservation entity
   */
  async updateStatus(id: number, status: string, tx?: any) {
    const client = tx || prisma;
    return await client.compartmentReservation.update({
      where: { id },
      data: { status }
    });
  }

  /**
   * Find all reservations that have expired but are still marked as active
   * Used by cleanup jobs to free up compartments
   * @returns Promise<CompartmentReservation[]> Array of expired reservations with compartment data
   */
  async findExpired() {
    return await prisma.compartmentReservation.findMany({
      where: {
        status: 'active',
        expiresAt: { lt: new Date() }
      },
      include: { compartment: true }
    });
  }

  /**
   * Find the first active reservation for an order with compartment and order details
   * Used during delivery completion to access customer information
   * @param orderId - The unique order ID
   * @param tx - Optional Prisma transaction context
   * @returns Promise<CompartmentReservation | null> Reservation with compartment and order data, or null
   */
  async findActiveByOrderIdWithOrder(orderId: number, tx?: any) {
    const client = tx || prisma;
    return await client.compartmentReservation.findFirst({
      where: { 
        orderId,
        status: 'active' 
      },
      include: { compartment: true, order: true }
    });
  }
}

export const reservationRepository = new ReservationRepository(); 