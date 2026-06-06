"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const quiz_controller_1 = require("../controllers/quiz.controller");
const router = (0, express_1.Router)();
router.get('/public', quiz_controller_1.getPublicQuizzes); // Must be before /:id
router.use(auth_middleware_1.authenticateToken);
router.get('/', quiz_controller_1.getQuizzes);
router.get('/:id', quiz_controller_1.getQuizById);
router.post('/', quiz_controller_1.createQuiz);
router.put('/:id', quiz_controller_1.updateQuiz);
router.delete('/:id', quiz_controller_1.deleteQuiz);
router.post('/:id/questions', quiz_controller_1.addQuestionToQuiz);
router.patch('/:id/publish', quiz_controller_1.publishQuiz);
router.patch('/:id/unpublish', quiz_controller_1.unpublishQuiz);
exports.default = router;
