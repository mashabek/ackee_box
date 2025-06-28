export interface Order {
  id: number;
  externalOrderId: string;
  customerId: string;
  status: 'pending' | 'delivered' | 'picked_up';
  pickupPin?: string;
  packageSize: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  createdAt: Date;
  updatedAt: Date;
} 