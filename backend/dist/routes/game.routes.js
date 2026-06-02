"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const game_controller_1 = require("../controllers/game.controller");
const router = (0, express_1.Router)();
// Allow unauthenticated access for joining games by pin
router.get('/:pin', game_controller_1.getGameSessionByPin);
router.use(auth_middleware_1.authenticateToken);
router.post('/', game_controller_1.createGameSession);
exports.default = router;
