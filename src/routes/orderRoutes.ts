import { Router } from 'express';
import { 
  listOrders, 
  updateOrderStatus
} from '../controllers/orderController';

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all orders
 *     description: Get a list of orders with optional status filtering (Authenticated users)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         schema: 
 *           type: string
 *           enum: [pending, in_transit, delivered, picked_up]
 *           example: "pending"
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of orders
 *       400:
 *         description: Invalid status parameter
 *       401:
 *         description: Unauthorized - JWT token required
 */
router.get('/', listOrders);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     description: Update the status of an existing order
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: 
 *           type: integer
 *           example: 1
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: 
 *                 type: string
 *                 enum: [pending, in_transit, delivered, picked_up]
 *                 description: New order status
 *                 example: "delivered"
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid order ID or status
 *       401:
 *         description: Unauthorized - JWT token required
 *       404:
 *         description: Order not found
 */

router.patch('/:id/status', updateOrderStatus);

export default router; 