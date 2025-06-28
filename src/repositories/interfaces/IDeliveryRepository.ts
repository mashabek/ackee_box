export interface IDeliveryRepository {
  /**
   * Create a new delivery record
   * @param data - Delivery creation data
   * @param tx - Optional transaction context
   * @returns Promise<any> Newly created delivery record
   */
  create(data: {
    reservationId: number;
    orderId: number;
    deliveredAt: Date;
  }, tx?: any): Promise<any>;
} 