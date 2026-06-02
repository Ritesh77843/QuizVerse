import { Router } from 'express';
import { joinGame } from '../controllers/player.controller';

const router = Router();

router.post('/', joinGame);

export default router;
