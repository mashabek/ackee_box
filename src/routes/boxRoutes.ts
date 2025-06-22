import { Router } from 'express';
import { getAllBoxes } from '../controllers/boxController';

const router = Router();

router.get('/', getAllBoxes);

export default router;
