import express from 'express';
import dotenv from 'dotenv';
import boxRoutes from './routes/boxRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Register box routes
app.use('/api/boxes', boxRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
