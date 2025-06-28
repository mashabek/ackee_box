import { Router } from 'express';
import { getNearbyBoxes, searchByCode, getBoxCompartments } from '../controllers/boxController';

const router = Router();

router.get('/nearest', getNearbyBoxes);
router.get('/search', searchByCode);
router.get('/:boxCode/compartments', getBoxCompartments);

export default router;
