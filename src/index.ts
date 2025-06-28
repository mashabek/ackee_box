import express from 'express';
import dotenv from 'dotenv';
import orderRoutes from './routes/orderRoutes';
import boxRoutes from './routes/boxRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import mockSsoRoutes from './routes/mockSsoRoutes';
import authRoutes from './routes/authRoutes';
import { authenticateJWT } from './middleware/auth';
import { swaggerUi, specs } from './swagger';
import { requireRole } from './middleware/roleMiddleware';
import { messageQueue } from './infrastructure/simpleQueue';
import { errorHandler } from './common/errorHandler';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ackee Box API Documentation'
}));

// Auth routes (unprotected)
app.use('/mock-sso', mockSsoRoutes);
app.use('/auth', authRoutes);

// Protected routes for drivers
app.use('/boxes', authenticateJWT, requireRole('driver'), boxRoutes);
app.use('/deliveries', authenticateJWT, requireRole('driver'), deliveryRoutes);

// Protected routes (general)
app.use('/orders', authenticateJWT, orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const queueStats = messageQueue.getStats();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    queue: queueStats
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ackee Box Delivery API',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  // Start message queue background processing
  messageQueue.start();
  
  // Schedule periodic cleanup (every 30 seconds)  
  setInterval(async () => {
    const { scheduleCleanup } = await import('./services/messageService');
    await scheduleCleanup();
  }, 30 * 1000);
  
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`Message queue started`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down gracefully');
    messageQueue.stop();
    server.close(() => process.exit(0));
  });
}

export default app;
