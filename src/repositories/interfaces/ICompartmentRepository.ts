export interface ICompartmentRepository {
  /**
   * Find all available compartments for a specific box
   * @param boxId - The unique identifier of the box
   * @returns Promise<any[]> Array of available compartments
   */
  findAvailableByBoxId(boxId: string): Promise<any[]>;
  
  /**
   * Find the first available compartment of a specific size
   * @param boxId - The unique identifier of the box
   * @param size - Required compartment size
   * @returns Promise<any> First matching compartment or null
   */
  findFirstAvailableBySize(boxId: string, size: 'S' | 'M' | 'L' | 'XL' | 'XXL'): Promise<any>;
  
  /**
   * Update the status of a compartment
   * @param id - The compartment ID to update
   * @param status - New status value
   * @param tx - Optional transaction context
   * @returns Promise<any> Updated compartment entity
   */
  updateStatus(id: number, status: string, tx?: any): Promise<any>;
} 