import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getSessionAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.get('/:pin', authenticateToken, getSessionAnalytics);

export default router;
