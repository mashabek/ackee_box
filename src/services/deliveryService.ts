import { PrismaClient } from '@prisma/client';
import { CompartmentReservation } from '../models/compartment';
import { Delivery } from "../models/delivery";
import { sendDeliveryNotification } from './messageService';
import { 
  boxRepository, 
  compartmentRepository, 
  orderRepository, 
  reservationRepository, 
  deliveryRepository 
} from '../repositories';
import { ValidationError, NotFoundError, ConflictError, BusinessLogicError, InternalServerError } from '../common/errors';

const prisma = new PrismaClient();

/**
 * Reserve a compartment for an order in a specific box
 * Gets the required compartment size from the order
 * Cancels any existing active reservations for the same order
 */
export const reserveCompartmentForOrder = async (
  boxCode: string,
  orderId: number,
  driverId: string,
  timeoutMinutes: number = 1
): Promise<CompartmentReservation> => {
  if (!boxCode || !orderId || !driverId) {
    throw new ValidationError('Missing required fields: boxCode, orderId, and driverId are required');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Get order to determine required package size
      const order = await orderRepository.findById(orderId, tx);

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Check if order is already delivered
      if (order.status === 'delivered') {
        throw new ConflictError('Order has already been delivered');
      }

      // Find box by code
      const box = await boxRepository.findActiveByCode(boxCode);
      if (!box) {
        throw new NotFoundError('Box not found');
      }

      // Cancel any existing active reservations for this order
      const existingReservations = await reservationRepository.findActiveByOrderId(orderId, tx);

      for (const reservation of existingReservations) {
        // Cancel the reservation
        await reservationRepository.updateStatus(reservation.id, 'expired', tx);

        // Free up the compartment
        await compartmentRepository.updateStatus(reservation.compartmentId, 'available', tx);

        console.log(`Cancelled existing reservation ${reservation.id} for order ${orderId}`);
      }

      // Now create the new reservation
      const newReservation = await reserveCompartment(
        box.id, 
        orderId, 
        driverId, 
        (order as any).packageSize as 'S' | 'M' | 'L' | 'XL' | 'XXL' || 'M',
        timeoutMinutes
      );

      return newReservation;
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || 
        error instanceof ConflictError || error instanceof BusinessLogicError) {
      throw error;
    }
    console.error('Error reserving compartment for order:', error);
    throw new InternalServerError('Failed to reserve compartment');
  }
};

// Reserve a compartment for delivery (with timeout)
export const reserveCompartment = async (
  boxId: string,
  orderId: number,
  driverId: string,
  compartmentSize: 'S' | 'M' | 'L' | 'XL' | 'XXL' = 'M',
  timeoutMinutes: number = 10
): Promise<CompartmentReservation> => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Find available compartment of required size
      const compartment = await compartmentRepository.findFirstAvailableBySize(boxId, compartmentSize);

      if (!compartment || compartment.reservations.length > 0) {
        throw new BusinessLogicError('No available compartments for this order size');
      }

      // Create reservation
      const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
      const reservation = await reservationRepository.create({
        compartmentId: compartment.id,
        orderId,
        driverId,
        expiresAt
      }, tx);

      // Update compartment status
      await compartmentRepository.updateStatus(compartment.id, 'reserved', tx);

      return reservation as CompartmentReservation;
    });
  } catch (error) {
    if (error instanceof BusinessLogicError) {
      throw error;
    }
    console.error('Error reserving compartment:', error);
    throw new InternalServerError('Failed to reserve compartment');
  }
};

/**
 * Start delivery process for an order
 * If reservation exists, opens that compartment
 * If no reservation, finds and reserves appropriate compartment then opens it
 */
export const startDeliveryForOrder = async (
  orderId: number, 
  preferredBoxCode?: string, 
  driverId?: string
): Promise<{
  boxCode: string;
  compartmentNumber: number;
  reservationId: number;
}> => {
  if (!orderId) {
    throw new ValidationError('Missing required field: orderId');
  }

  try {
    // First check if order is already delivered
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status === 'delivered') {
      throw new ConflictError('Order has already been delivered');
    }

    // Check for existing active reservation
    const existingReservation = await reservationRepository.findFirstActiveByOrderIdWithDetails(orderId);

    if (existingReservation) {
      // Use existing reservation
      const success = await openCompartment(
        existingReservation.compartment.boxId, 
        existingReservation.compartment.compartmentNumber
      );

      if (!success) {
        throw new InternalServerError('Failed to open compartment hardware');
      }

      return {
        boxCode: existingReservation.compartment.box.code,
        compartmentNumber: existingReservation.compartment.compartmentNumber,
        reservationId: existingReservation.id
      };
    }

    // No existing reservation - need to create one
    if (!preferredBoxCode || !driverId) {
      throw new BusinessLogicError('No active reservation found. Please reserve a compartment first or provide boxCode.');
    }

    // Create reservation and open compartment
    const newReservation = await reserveCompartmentForOrder(preferredBoxCode, orderId, driverId);

    // Get compartment details for the new reservation
    const reservationWithCompartment = await reservationRepository.findByIdWithDetails(newReservation.id);

    if (!reservationWithCompartment) {
      throw new InternalServerError('Failed to retrieve reservation details');
    }

    // Open the compartment
    const success = await openCompartment(
      reservationWithCompartment.compartment.boxId,
      reservationWithCompartment.compartment.compartmentNumber
    );

    if (!success) {
      throw new InternalServerError('Failed to open compartment hardware');
    }

    return {
      boxCode: reservationWithCompartment.compartment.box.code,
      compartmentNumber: reservationWithCompartment.compartment.compartmentNumber,
      reservationId: reservationWithCompartment.id
    };

  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || 
        error instanceof ConflictError || error instanceof BusinessLogicError || 
        error instanceof InternalServerError) {
      throw error;
    }
    console.error('Error starting delivery for order:', error);
    throw new InternalServerError('Failed to start delivery');
  }
};

// Complete delivery - package placed, compartment closed
export const completeDelivery = async (orderId: number): Promise<Delivery> => {
  if (!orderId) {
    throw new ValidationError('Missing orderId');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // First check if order is already delivered
      const order = await orderRepository.findById(orderId, tx);

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status === 'delivered') {
        throw new ConflictError('Order has already been delivered');
      }

      // Find active reservation for this order
      const reservation = await reservationRepository.findActiveByOrderIdWithOrder(orderId, tx);

      if (!reservation) {
        throw new BusinessLogicError('No active delivery found for this order, or delivery already completed');
      }

      // Create delivery record
      const delivery = await deliveryRepository.create({
        reservationId: reservation.id,
        orderId: reservation.orderId,
        deliveredAt: new Date()
      }, tx);

      // Update reservation status
      await reservationRepository.updateStatus(reservation.id, 'completed', tx);

      // Update compartment status
      await compartmentRepository.updateStatus(reservation.compartmentId, 'occupied', tx);

      // Update order status and generate pickup PIN
      const pickupPin = generatePickupPin();
      await orderRepository.updateWithPickupPin(reservation.orderId, 'delivered', pickupPin, tx);

      // Queue notification job to notify customer
      await sendDeliveryNotification(
          reservation.orderId,
          reservation.order.customerId,
          reservation.compartment.boxId, 
          pickupPin
        );
      
      return delivery as Delivery;
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || 
        error instanceof ConflictError || error instanceof BusinessLogicError) {
      throw error;
    }
    console.error('Error completing delivery:', error);
    throw new InternalServerError('Failed to complete delivery');
  }
};

// Test notification functionality
export const testNotification = async (orderId: number, customerId: string, boxCode?: string): Promise<void> => {
  if (!orderId || !customerId) {
    throw new ValidationError('orderId and customerId are required');
  }

  try {
    await sendDeliveryNotification(
      orderId,
      customerId,
      boxCode || 'TEST_BOX',
      '123456'
    );
  } catch (error) {
    console.error('Error queueing test notification:', error);
    throw new InternalServerError('Failed to queue test notification');
  }
};

// Clean up expired reservations (should run as background job)
export const cleanupExpiredReservations = async (): Promise<number> => {
    try {
      const expired = await reservationRepository.findExpired();

      let cleaned = 0;
      for (const reservation of expired) {
        await prisma.$transaction(async (tx) => {
          // Update reservation status
          await reservationRepository.updateStatus(reservation.id, 'expired', tx);

          // Free up compartment
          await compartmentRepository.updateStatus(reservation.compartmentId, 'available', tx);

          cleaned++;
        });
      }

      return cleaned;
    } catch (error) {
      console.error('Error cleaning expired reservations:', error);
      throw new InternalServerError('Failed to cleanup expired reservations');
    }
};

// Mock hardware integration
const openCompartment = async (boxId: string, compartmentNumber: number): Promise<boolean> => {
    // Mock: In production, this would call box hardware API
    console.log(`[HARDWARE MOCK] Opening compartment ${compartmentNumber} on box ${boxId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
};

// Generate 6-digit pickup PIN
const generatePickupPin = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}; 