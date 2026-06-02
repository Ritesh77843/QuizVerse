"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGameSessionByPin = exports.createGameSession = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createGameSession = async (req, res) => {
    try {
        const { quizId } = req.body;
        const userId = req.user.userId;
        const quiz = await prisma_1.default.quiz.findUnique({
            where: { id: quizId },
            include: { questions: true }
        });
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        if (quiz.hostId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        // Generate random 6 digit pin
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const game = await prisma_1.default.gameSession.create({
            data: {
                pin,
                quizId,
                hostId: userId,
                status: 'WAITING',
                currentQuestionIndex: 0,
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Game session created',
            data: {
                ...game,
                quizTitle: quiz.title,
                totalQuestions: quiz.questions.length,
                playerCount: 0
            }
        });
    }
    catch (error) {
        console.error('Error creating game session:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createGameSession = createGameSession;
const getGameSessionByPin = async (req, res) => {
    try {
        const pin = req.params.pin;
        const game = await prisma_1.default.gameSession.findUnique({
            where: { pin },
            include: {
                quiz: {
                    include: { questions: true }
                },
                players: true
            }
        });
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game session not found' });
        }
        return res.json({
            success: true,
            message: 'Game session retrieved',
            data: {
                ...game,
                quizTitle: game.quiz.title,
                totalQuestions: game.quiz.questions.length,
                playerCount: game.players.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching game session:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getGameSessionByPin = getGameSessionByPin;
