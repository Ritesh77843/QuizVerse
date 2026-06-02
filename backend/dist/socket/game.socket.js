"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const setupSocketIO = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('join-game', async (data) => {
            const { pin, nickname, isHost } = data;
            socket.join(pin);
            console.log(`User ${nickname} joined room ${pin}`);
            if (!isHost) {
                // Broadcast to room that a player joined
                const game = await prisma_1.default.gameSession.findUnique({
                    where: { pin },
                    include: { players: true }
                });
                if (game) {
                    const player = game.players.find(p => p.nickname === nickname);
                    if (player) {
                        io.to(pin).emit('player-joined', {
                            nickname: player.nickname,
                            avatarSeed: player.avatarSeed,
                            totalPlayers: game.players.length
                        });
                    }
                }
            }
        });
        socket.on('start-game', async (data) => {
            const { pin } = data;
            const game = await prisma_1.default.gameSession.update({
                where: { pin },
                data: { status: 'ACTIVE', startedAt: new Date() },
                include: { quiz: { include: { questions: { include: { options: true }, orderBy: { position: 'asc' } } } }, players: true }
            });
            io.to(pin).emit('game-state-changed', {
                pin: game.pin,
                status: game.status,
                playerCount: game.players.length,
                currentQuestionIndex: game.currentQuestionIndex,
                totalQuestions: game.quiz.questions.length
            });
            // Emit first question
            if (game.quiz.questions.length > 0) {
                const question = game.quiz.questions[0];
                io.to(pin).emit('new-question', {
                    questionId: question.id,
                    index: 0,
                    total: game.quiz.questions.length,
                    questionText: question.questionText,
                    questionType: question.questionType,
                    timeLimitSeconds: question.timeLimitSeconds,
                    points: question.points,
                    mediaUrl: question.mediaUrl,
                    options: question.options.map(o => ({
                        id: o.id,
                        text: o.optionText,
                        colorCode: o.colorCode,
                        position: o.position
                    }))
                });
            }
        });
        socket.on('submit-answer', async (data) => {
            // Logic to handle answers and update scores would go here
            console.log('Answer submitted', data);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};
exports.setupSocketIO = setupSocketIO;
