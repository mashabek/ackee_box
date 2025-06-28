import { Router } from 'express';
import { 
  reserveCompartment, 
  startDelivery, 
  completeDelivery,
  testNotification
} from '../controllers/deliveryController';

const router = Router();

/**
 * @swagger
 * /deliveries/reserve:
 *   post:
 *     summary: Reserve a compartment for delivery
 *     description: Reserve a compartment in a specific box for package delivery (Driver only)
 *     security:
 *       - bearerAuth: []
 *     tags: [Deliveries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [boxCode, orderId]
 *             properties:
 *               boxCode: 
 *                 type: string
 *                 description: Code of the target box
 *                 example: "BOX123"
 *               orderId: 
 *                 type: number
 *                 description: Order ID to deliver (compartment size taken from order)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Compartment reserved successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - JWT token required
 *       403:
 *         description: Forbidden - Driver role required
 *       404:
 *         description: No available compartments or order not found
 *       409:
 *         description: Order has already been delivered
 */
router.post('/reserve', reserveCompartment);

/**
 * @swagger
 * /deliveries/start:
 *   post:
 *     summary: Start delivery process
 *     description: |
 *       Starts the delivery process by opening a compartment. Two scenarios:
 *       1. If active reservation exists for the order → opens that compartment
 *       2. If no reservation → finds appropriate compartment, reserves it, then opens it
 *     security:
 *       - bearerAuth: []
 *     tags: [Deliveries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: 
 *                 type: number
 *                 description: Order ID to deliver
 *                 example: 1
 *               boxCode:
 *                 type: string
 *                 description: Box code (required only if no existing reservation)
 *                 example: "BOX123"
 *     responses:
 *       200:
 *         description: Compartment opened successfully
 *       400:
 *         description: Invalid order or no available compartments
 *       401:
 *         description: Unauthorized - JWT token required
 *       403:
 *         description: Forbidden - Driver role required
 *       409:
 *         description: Order has already been delivered
 */
router.post('/start', startDelivery);

/**
 * @swagger
 * /deliveries/complete:
 *   post:
 *     summary: Complete delivery (package placed, compartment closed)
 *     description: Mark delivery as complete and generate customer pickup PIN (Driver only)
 *     security:
 *       - bearerAuth: []
 *     tags: [Deliveries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: 
 *                 type: number
 *                 description: Order ID being delivered
 *                 example: 1
 *     responses:
 *       200:
 *         description: Delivery completed successfully
 *       400:
 *         description: No active delivery found for this order
 *       401:
 *         description: Unauthorized - JWT token required
 *       403:
 *         description: Forbidden - Driver role required
 *       409:
 *         description: Order has already been delivered
 */
router.post('/complete', completeDelivery);

/**
 * @swagger
 * /deliveries/test-notification:
 *   post:
 *     summary: Test notification system
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, customerId]
 *             properties:
 *               orderId:
 *                 type: integer
 *               customerId:
 *                 type: string
 *               boxCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test notification queued
 */
router.post('/test-notification', testNotification);

export default router; 