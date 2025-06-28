import { Request, Response } from 'express';
import { findNearestBoxes, searchBoxByCode, getAvailableCompartmentsByCode } from '../services/boxService';
import { asyncHandler } from '../common/errorHandler';

/**
 * @swagger
 * /boxes/nearest:
 *   get:
 *     summary: Find nearest boxes
 *     description: Find delivery boxes within specified radius (Driver only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Boxes
 *     parameters:
 *       - name: lat
 *         in: query
 *         required: true
 *         schema: { type: number, example: 50.087 }
 *         description: Latitude coordinate
 *       - name: lng
 *         in: query
 *         required: true
 *         schema: { type: number, example: 14.421 }
 *         description: Longitude coordinate
 *       - name: radius
 *         in: query
 *         schema: { type: number, example: 1000, default: 100 }
 *         description: Search radius in meters (max 50000m)
 *       - name: size
 *         in: query
 *         schema: { type: string, enum: [S, M, L, XL, XXL], example: M }
 *         description: Filter boxes by available compartment size
 *     responses:
 *       200:
 *         description: List of nearby boxes sorted by distance
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Box' }
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Unauthorized - JWT token required
 *       403:
 *         description: Forbidden - Driver role required
 */
export const getNearbyBoxes = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius = 100, size } = req.query;
  
  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);
  const searchRadius = parseFloat(radius as string);
  
  const boxes = await findNearestBoxes(
    userLat, 
    userLng, 
    searchRadius, 
    size as 'S' | 'M' | 'L' | 'XL' | 'XXL' | undefined
  );
  
  res.json(boxes);
});

/**
 * @swagger
 * /boxes/search:
 *   get:
 *     summary: Search for a box by code
 *     description: Find a specific box using its display code (Driver only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Boxes
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         schema: { type: string, example: 'BOX123' }
 *         description: Box code displayed on physical box
 *     responses:
 *       200:
 *         description: Box found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Box' }
 *       400:
 *         description: Missing or invalid code parameter
 *       401:
 *         description: Unauthorized - JWT token required
 *       403:
 *         description: Forbidden - Driver role required
 *       404:
 *         description: Box not found
 */
export const searchByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.query;
  
  const box = await searchBoxByCode(code as string);
  res.json(box);
});

/**
 * @swagger
 * /boxes/{boxCode}/compartments:
 *   get:
 *     summary: Get available compartments for a box
 *     description: Check compartment availability for a specific box (Driver only)
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Boxes
 *     parameters:
 *       - name: boxCode
 *         in: path
 *         required: true
 *         schema: 
 *           type: string
 *           example: "BOX123"
 *         description: Box code to check compartments for
 *     responses:
 *       200:
 *         description: List of available compartments
 *       400:
 *         description: Missing boxCode parameter
 *       401:
 *         description: Unauthorized - JWT token required
 *       403:
 *         description: Forbidden - Driver role required
 *       404:
 *         description: Box not found
 */
export const getBoxCompartments = asyncHandler(async (req: Request, res: Response) => {
  const { boxCode } = req.params;

  const result = await getAvailableCompartmentsByCode(boxCode);
  
  res.json({
    boxCode,
    availableCompartments: result.compartments.length,
    compartments: result.compartments.map(c => ({
      id: c.id,
      compartmentNumber: c.compartmentNumber,
      size: c.size,
      status: c.status
    }))
  });
});