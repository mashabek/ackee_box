import express from 'express';
import dotenv from 'dotenv';
import boxRoutes from './routes/boxRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

// Register box routes
app.use('/boxes', boxRoutes);

// Only start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
