import { Request, Response } from 'express';
import { findNearestBoxes } from '../services/boxService';

/**
 * @swagger
 * /boxes/nearest:
 *   get:
 *     summary: Find nearest boxes
 *     parameters:
 *       - name: lat
 *         in: query
 *         required: true
 *         schema: { type: number, example: 50.087 }
 *       - name: lng
 *         in: query
 *         required: true
 *         schema: { type: number, example: 14.421 }
 *       - name: radius
 *         in: query
 *         schema: { type: number, example: 1000 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Box' }
 */
export const getNearbyBoxes = async (req: Request, res: Response) => {
  const { lat, lng, radius } = req.query;
  
  // Validate required parameters
  if (!lat || !lng) {
    res.status(400).json({ error: 'Missing lat or lng query parameters' });
    return;
  }
  
  // Parse and validate coordinates
  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);
  
  if (isNaN(userLat) || isNaN(userLng)) {
    res.status(400).json({ error: 'Invalid lat or lng values' });
    return;
  }
  
  // Validate coordinate ranges
  if (userLat < -90 || userLat > 90) {
    res.status(400).json({ error: 'Latitude must be between -90 and 90 degrees' });
    return;
  }
  
  if (userLng < -180 || userLng > 180) {
    res.status(400).json({ error: 'Longitude must be between -180 and 180 degrees' });
    return;
  }
  
  // Parse and validate radius
  let searchRadius = 100; // Default search radius is 100 meters
  if (radius !== undefined) {
    searchRadius = parseFloat(radius as string);
    if (isNaN(searchRadius) || searchRadius <= 0) {
      res.status(400).json({ error: 'Invalid radius value' });
      return;
    }
    if (searchRadius > 50000) { // Max 50km radius
      res.status(400).json({ error: 'Radius must not exceed 50000 meters (50km)' });
      return;
    }
  }
  
  try {
    const nearest = await findNearestBoxes(userLat, userLng, searchRadius);
    res.json(nearest);
  } catch (err) {
    // All validation is done in controller, so any error here is a server error
    console.error('Service error:', err);
    res.status(500).json({ error: 'Failed to fetch nearest boxes' });
  }
};
