import { Request, Response } from 'express';
import { getAllBoxes } from '../services/boxService';

export const getNearbyBoxes = (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    res.status(400).json({ error: 'Missing lat or lng query parameters' });
    return;
  }

  // Filtering by distance will be implemented later
  const boxes = getAllBoxes();
  res.json(boxes);
};
