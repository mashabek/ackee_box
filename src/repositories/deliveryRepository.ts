import { PrismaClient } from '@prisma/client';
import { IDeliveryRepository } from './interfaces/IDeliveryRepository';

const prisma = new PrismaClient();

export class DeliveryRepository implements IDeliveryRepository {
  /**
   * Create a new delivery record when a package is successfully delivered
   * @param data - Delivery creation data
   * @param data.reservationId - ID of the compartment reservation used for delivery
   * @param data.orderId - ID of the order being delivered
   * @param data.deliveredAt - Timestamp when delivery was completed
   * @param tx - Optional Prisma transaction context
   * @returns Promise<Delivery> Newly created delivery record
   */
  async create(data: {
    reservationId: number;
    orderId: number;
    deliveredAt: Date;
  }, tx?: any) {
    const client = tx || prisma;
    return await client.delivery.create({
      data
    });
  }
}

export const deliveryRepository = new DeliveryRepository(); 