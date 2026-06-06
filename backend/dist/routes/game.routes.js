"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const game_controller_1 = require("../controllers/game.controller");
const player_controller_1 = require("../controllers/player.controller");
const router = (0, express_1.Router)();
// Unauthenticated routes - players joining
router.get('/:pin', game_controller_1.getGameSessionByPin);
router.post('/:pin/join', player_controller_1.joinGame);
router.use(auth_middleware_1.authenticateToken);
router.post('/', game_controller_1.createGameSession);
exports.default = router;
