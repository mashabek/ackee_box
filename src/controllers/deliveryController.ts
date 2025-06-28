import { Request, Response } from 'express';
import { reserveCompartmentForOrder, startDeliveryForOrder, completeDelivery as completeDeliveryService, testNotification as testNotificationService } from '../services/deliveryService';
import { getQueueStats } from '../services/messageService';
import { asyncHandler } from '../common/errorHandler';
import { ValidationError } from '../common/errors';

// Reserve a compartment for an order (gets package size from order)
export const reserveCompartment = asyncHandler(async (req: Request, res: Response) => {
  const { boxCode, orderId } = req.body;
  const driverId = req.user?.id;

  // Validate required fields
  if (!boxCode || !orderId) {
    throw new ValidationError('Missing required fields: boxCode and orderId are required');
  }

  // Validate types
  if (typeof boxCode !== 'string') {
    throw new ValidationError('boxCode must be a string');
  }

  const orderIdNum = parseInt(orderId);
  if (isNaN(orderIdNum)) {
    throw new ValidationError('orderId must be a valid number');
  }

  if (!driverId) {
    throw new Error('Driver ID is required');
  }

  const reservation = await reserveCompartmentForOrder(boxCode, orderIdNum, driverId);

  res.status(201).json({
    message: 'Compartment reserved successfully',
    reservation: {
      id: reservation.id,
      compartmentId: reservation.compartmentId,
      expiresAt: reservation.expiresAt,
      status: reservation.status
    }
  });
});

// Start delivery process - opens compartment for package placement
export const startDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, boxCode } = req.body;
  const driverId = req.user?.id;

  // Validate required orderId
  if (!orderId) {
    throw new ValidationError('Missing required field: orderId');
  }

  const orderIdNum = parseInt(orderId);
  if (isNaN(orderIdNum)) {
    throw new ValidationError('orderId must be a valid number');
  }

  if (!driverId) {
    throw new Error('Driver ID is required');
  }

  const result = await startDeliveryForOrder(orderIdNum, boxCode, driverId);

  res.json({
    message: 'Delivery started successfully. Compartment is now open.',
    compartment: {
      boxCode: result.boxCode,
      compartmentNumber: result.compartmentNumber
    },
    orderId: orderId,
    instructions: 'Place the package in the compartment and close the door, then call /deliveries/complete with this orderId'
  });
});

// Complete delivery - package placed, compartment closed
export const completeDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;

  // Validate required orderId
  if (!orderId) {
    throw new ValidationError('Missing required field: orderId');
  }

  const orderIdNum = parseInt(orderId);
  if (isNaN(orderIdNum)) {
    throw new ValidationError('orderId must be a valid number');
  }

  const delivery = await completeDeliveryService(orderIdNum);

  res.json({
    message: 'Delivery completed successfully',
    delivery: {
      id: delivery.id,
      orderId: delivery.orderId,
      deliveredAt: delivery.deliveredAt
    },
    nextSteps: 'Customer will receive SMS/email notification with pickup PIN'
  });
});

export const testNotification = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, customerId, boxCode } = req.body;
  
  // Validate required fields
  if (!orderId || !customerId) {
    throw new ValidationError('Missing required fields: orderId and customerId are required');
  }

  const orderIdNum = parseInt(orderId);
  if (isNaN(orderIdNum)) {
    throw new ValidationError('orderId must be a valid number');
  }

  await testNotificationService(orderIdNum, customerId, boxCode);

  res.json({
    message: 'Test notification queued successfully',
    queueStats: getQueueStats()
  });
});

 