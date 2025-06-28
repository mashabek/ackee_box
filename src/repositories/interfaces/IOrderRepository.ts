import { Order } from '../../models/order';

export interface IOrderRepository {
  /**
   * Retrieve all orders with optional status filtering
   * @param status - Optional status filter
   * @returns Promise<any[]> Array of orders
   */
  findAll(status?: Order['status']): Promise<any[]>;
  
  /**
   * Find a single order by its unique ID
   * @param id - The unique order ID
   * @param tx - Optional transaction context
   * @returns Promise<any> Order entity or null
   */
  findById(id: number, tx?: any): Promise<any>;
  
  /**
   * Update the status of an order
   * @param id - The unique order ID to update
   * @param status - New order status
   * @param tx - Optional transaction context
   * @returns Promise<any> Updated order entity
   */
  updateStatus(id: number, status: Order['status'], tx?: any): Promise<any>;
  
  /**
   * Update order status and assign a pickup PIN
   * @param id - The unique order ID to update
   * @param status - New order status
   * @param pickupPin - PIN code for customer pickup
   * @param tx - Optional transaction context
   * @returns Promise<any> Updated order entity
   */
  updateWithPickupPin(id: number, status: Order['status'], pickupPin: string, tx?: any): Promise<any>;
} 