import { PrismaClient } from '@prisma/client';
import { Order } from '../models/order';
import { IOrderRepository } from './interfaces/IOrderRepository';

const prisma = new PrismaClient();

export class OrderRepository implements IOrderRepository {
  /**
   * Retrieve all orders from the database with optional status filtering
   * Orders are sorted by creation date in descending order (newest first)
   * @param status - Optional status filter ('pending', 'delivered', 'picked_up')
   * @returns Promise<Order[]> Array of orders matching the criteria
   */
  async findAll(status?: Order['status']) {
    return await prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find a single order by its unique ID
   * Supports transaction context for consistent reads within transactions
   * @param id - The unique order ID
   * @param tx - Optional Prisma transaction context
   * @returns Promise<Order | null> Order entity or null if not found
   */
  async findById(id: number, tx?: any) {
    const client = tx || prisma;
    return await client.order.findUnique({
      where: { id }
    });
  }

  /**
   * Update the status of an order and set the updated timestamp
   * @param id - The unique order ID to update
   * @param status - New order status ('pending', 'delivered', 'picked_up')
   * @param tx - Optional Prisma transaction context
   * @returns Promise<Order> Updated order entity
   */
  async updateStatus(id: number, status: Order['status'], tx?: any) {
    const client = tx || prisma;
    return await client.order.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });
  }

  /**
   * Update order status and assign a pickup PIN (typically when delivered)
   * @param id - The unique order ID to update
   * @param status - New order status ('pending', 'delivered', 'picked_up')
   * @param pickupPin - 6-digit PIN code for customer pickup
   * @param tx - Optional Prisma transaction context
   * @returns Promise<Order> Updated order entity with pickup PIN
   */
  async updateWithPickupPin(id: number, status: Order['status'], pickupPin: string, tx?: any) {
    const client = tx || prisma;
    return await client.order.update({
      where: { id },
      data: { 
        status,
        pickupPin,
        updatedAt: new Date()
      }
    });
  }
}

export const orderRepository = new OrderRepository(); 