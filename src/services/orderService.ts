import { Order } from '../models/order';
import { orderRepository } from '../repositories';
import { ValidationError, NotFoundError, InternalServerError } from '../common/errors';

// Get all orders with optional status filtering
export const getOrders = async (status?: string): Promise<Order[]> => {
  // Validate status if provided
  if (status && !['pending', 'in_transit', 'delivered', 'picked_up'].includes(status)) {
    throw new ValidationError('Invalid status. Must be one of: pending, in_transit, delivered, picked_up');
  }

  try {
    const orders = await orderRepository.findAll(status as Order['status']);
    
    return orders.map(order => ({
      id: order.id,
      externalOrderId: order.externalOrderId,
      customerId: order.customerId,
      status: order.status as Order['status'],
      pickupPin: order.pickupPin || undefined,
      packageSize: (order as any).packageSize as Order['packageSize'],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt || order.createdAt
    }));
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Error fetching orders:', error);
    throw new InternalServerError('Failed to fetch orders');
  }
};

// Update order status
export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
  if (isNaN(id)) {
    throw new ValidationError('Invalid order ID');
  }

  if (!status || !['pending', 'in_transit', 'delivered', 'picked_up'].includes(status)) {
    throw new ValidationError('Invalid status. Must be one of: pending, in_transit, delivered, picked_up');
  }

  try {
    const updatedOrder = await orderRepository.updateStatus(id, status as Order['status']);

    if (!updatedOrder) {
      throw new NotFoundError('Order not found');
    }

    return {
      id: updatedOrder.id,
      externalOrderId: updatedOrder.externalOrderId,
      customerId: updatedOrder.customerId,
      status: updatedOrder.status as Order['status'],
      pickupPin: updatedOrder.pickupPin || undefined,
      packageSize: (updatedOrder as any).packageSize as Order['packageSize'],
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt || updatedOrder.createdAt
    };
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    // Handle Prisma P2025 error (record not found for update)
    if (error.code === 'P2025') {
      throw new NotFoundError('Order not found');
    }
    
    console.error('Error updating order status:', error);
    throw new InternalServerError('Failed to update order status');
  }
};

 