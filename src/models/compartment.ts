export interface Compartment {
  id: number;
  boxId: string;
  compartmentNumber: number;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  status: 'available' | 'reserved' | 'occupied';
  createdAt: Date;
  updatedAt: Date;
}

export interface CompartmentReservation {
  id: number;
  compartmentId: number;
  orderId: number;
  driverId: string;
  status: 'active' | 'expired' | 'completed';
  expiresAt: Date;
  createdAt: Date;
}

