"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const player_controller_1 = require("../controllers/player.controller");
const router = (0, express_1.Router)();
router.post('/', player_controller_1.joinGame);
exports.default = router;
