import { Request, Response } from 'express';
import { reserveCompartmentForOrder, startDeliveryForOrder, completeDelivery as completeDeliveryService, testNotification as testNotificationService } from '../services/deliveryService';
import { getQueueStats } from '../services/messageService';
import { asyncHandler } from '../common/errorHandler';

// Reserve a compartment for an order (gets package size from order)
export const reserveCompartment = asyncHandler(async (req: Request, res: Response) => {
  const { boxCode, orderId } = req.body;
  const driverId = req.user?.id;

  if (!driverId) {
    throw new Error('Driver ID is required');
  }

  const reservation = await reserveCompartmentForOrder(boxCode, orderId, driverId);

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

  if (!driverId) {
    throw new Error('Driver ID is required');
  }

  const result = await startDeliveryForOrder(orderId, boxCode, driverId);

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

  const delivery = await completeDeliveryService(orderId);

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
  
  await testNotificationService(orderId, customerId, boxCode);

  res.json({
    message: 'Test notification queued successfully',
    queueStats: getQueueStats()
  });
});

 