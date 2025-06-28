export interface IReservationRepository {
  /**
   * Find all active reservations for a specific order
   * @param orderId - The unique order ID
   * @param tx - Optional transaction context
   * @returns Promise<any[]> Array of active reservations
   */
  findActiveByOrderId(orderId: number, tx?: any): Promise<any[]>;
  
  /**
   * Find the first active reservation with compartment and box details
   * @param orderId - The unique order ID
   * @param tx - Optional transaction context
   * @returns Promise<any> Reservation with details or null
   */
  findFirstActiveByOrderIdWithDetails(orderId: number, tx?: any): Promise<any>;
  
  /**
   * Find a specific reservation by ID with details
   * @param id - The unique reservation ID
   * @param tx - Optional transaction context
   * @returns Promise<any> Reservation with details or null
   */
  findByIdWithDetails(id: number, tx?: any): Promise<any>;
  
  /**
   * Create a new compartment reservation
   * @param data - Reservation creation data
   * @param tx - Optional transaction context
   * @returns Promise<any> Newly created reservation
   */
  create(data: {
    compartmentId: number;
    orderId: number;
    driverId: string;
    expiresAt: Date;
  }, tx?: any): Promise<any>;
  
  /**
   * Update the status of a reservation
   * @param id - The unique reservation ID
   * @param status - New status value
   * @param tx - Optional transaction context
   * @returns Promise<any> Updated reservation entity
   */
  updateStatus(id: number, status: string, tx?: any): Promise<any>;
  
  /**
   * Find all expired reservations
   * @returns Promise<any[]> Array of expired reservations
   */
  findExpired(): Promise<any[]>;
  
  /**
   * Find active reservation with order details
   * @param orderId - The unique order ID
   * @param tx - Optional transaction context
   * @returns Promise<any> Reservation with order data or null
   */
  findActiveByOrderIdWithOrder(orderId: number, tx?: any): Promise<any>;
} 