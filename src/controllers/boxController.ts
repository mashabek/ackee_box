import { Request, Response } from 'express';

export const getAllBoxes = (_req: Request, res: Response) => {
    const boxes = [
        { id: 1, location: 'Prague', status: 'available' },
        { id: 2, location: 'Brno', status: 'full' },
    ];
    res.json(boxes);
};
