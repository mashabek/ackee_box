import { Router } from 'express';
import { getNearbyBoxes } from '../controllers/boxController';

const router = Router();

router.get('/nearest', getNearbyBoxes);

export default router;
