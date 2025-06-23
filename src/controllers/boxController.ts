import { Request, Response } from 'express';
import { findNearestBoxes } from '../services/boxService';

/**
 * GET /boxes/nearby?lat=...&lng=...&radius=...
 *
 * Returns a list of the nearest boxes to the given latitude and longitude.
 *
 * Query Parameters:
 *   - lat (required): Latitude of the user
 *   - lng (required): Longitude of the user
 *   - radius (optional, meters): Search radius in meters (default: 100)
 */
export const getNearbyBoxes = async (req: Request, res: Response) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) {
    res.status(400).json({ error: 'Missing lat or lng query parameters' });
    return;
  }
  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);
  if (isNaN(userLat) || isNaN(userLng)) {
    res.status(400).json({ error: 'Invalid lat or lng values' });
    return;
  }
  // Default search radius is 100 meters if not provided
  let searchRadius = 100;
  if (radius !== undefined) {
    searchRadius = parseFloat(radius as string);
    if (isNaN(searchRadius) || searchRadius <= 0) {
      res.status(400).json({ error: 'Invalid radius value' });
      return;
    }
  }
  try {
    const nearest = await findNearestBoxes(userLat, userLng, searchRadius);
    res.json(nearest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nearest boxes', details: (err as Error).message });
  }
};
