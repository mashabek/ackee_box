import { Request, Response } from 'express';
import { getOrders, updateOrderStatus as updateOrderStatusService } from '../services/orderService';
import { asyncHandler } from '../common/errorHandler';

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  
  const orders = await getOrders(status as string);
  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const orderId = parseInt(id);
  
  const order = await updateOrderStatusService(orderId, status);
  res.json(order);
});
