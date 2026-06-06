"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const analytics_controller_1 = require("../controllers/analytics.controller");
const router = (0, express_1.Router)();
router.get('/:pin', auth_middleware_1.authenticateToken, analytics_controller_1.getSessionAnalytics);
exports.default = router;
