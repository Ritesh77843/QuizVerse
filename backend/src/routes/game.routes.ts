import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createGameSession, getGameSessionByPin } from '../controllers/game.controller';
import { joinGame } from '../controllers/player.controller';

const router = Router();

// Unauthenticated routes - players joining
router.get('/:pin', getGameSessionByPin);
router.post('/:pin/join', joinGame);

router.use(authenticateToken);
router.post('/', createGameSession);

export default router;
