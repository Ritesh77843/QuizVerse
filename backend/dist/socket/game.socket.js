"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Track active player socket connections: pin -> nickname -> socketId
const activeConnections = new Map();
// Track question timers: pin -> { interval, remaining, timeout? }
const questionTimers = new Map();
// Track per-player answer streaks: pin -> nickname -> consecutiveCorrect
const playerStreaks = new Map();
function clearQuestionTimer(pin) {
    const t = questionTimers.get(pin);
    if (t) {
        clearInterval(t.interval);
        if (t.timeout)
            clearTimeout(t.timeout);
        questionTimers.delete(pin);
    }
}
const setupSocketIO = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('join-game', async (data) => {
            const { pin, nickname, isHost } = data;
            socket.join(pin);
            console.log(`User ${nickname ?? 'host'} joined room ${pin}`);
            if (!isHost && nickname) {
                // ── DUPLICATE DEVICE DETECTION ────────────────────────────────
                if (!activeConnections.has(pin)) {
                    activeConnections.set(pin, new Map());
                }
                const roomConnections = activeConnections.get(pin);
                const existingSocketId = roomConnections.get(nickname);
                if (existingSocketId && existingSocketId !== socket.id) {
                    // Another socket already holds this nickname — kick it
                    const oldSocket = io.sockets.sockets.get(existingSocketId);
                    if (oldSocket) {
                        oldSocket.emit('force-disconnect', {
                            reason: 'duplicate_device',
                            message: 'You have been disconnected because someone joined with your nickname on another device.'
                        });
                        oldSocket.leave(pin);
                        console.log(`Kicked duplicate session for "${nickname}" in room ${pin} (old socket: ${existingSocketId})`);
                    }
                }
                // Register this socket as the owner of this nickname in this room
                roomConnections.set(nickname, socket.id);
                // ──────────────────────────────────────────────────────────────
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
        // ── START GAME ─────────────────────────────────────────────────
        socket.on('start-game', async (data) => {
            const { pin } = data;
            const game = await prisma_1.default.gameSession.update({
                where: { pin },
                data: { status: 'ACTIVE', startedAt: new Date(), currentQuestionIndex: 0 },
                include: { quiz: { include: { questions: { include: { options: true }, orderBy: { position: 'asc' } } } }, players: true }
            });
            io.to(pin).emit('game-state-changed', {
                pin: game.pin, status: game.status,
                playerCount: game.players.length,
                currentQuestionIndex: 0, totalQuestions: game.quiz.questions.length
            });
            emitQuestion(io, pin, game.quiz.questions, 0);
            startQuestionTimer(io, pin, game.quiz.questions, 0);
        });
        // ── NEXT QUESTION ──────────────────────────────────────────────
        socket.on('next-question', async (data) => {
            const { pin } = data;
            const game = await prisma_1.default.gameSession.findUnique({
                where: { pin },
                include: { quiz: { include: { questions: { include: { options: true }, orderBy: { position: 'asc' } } } }, players: true }
            });
            if (!game)
                return;
            const nextIdx = game.currentQuestionIndex + 1;
            if (nextIdx >= game.quiz.questions.length) {
                // No more questions — end the game
                await prisma_1.default.gameSession.update({ where: { pin }, data: { status: 'ENDED', endedAt: new Date() } });
                const players = await prisma_1.default.player.findMany({ where: { sessionPin: pin }, orderBy: { score: 'desc' } });
                const leaderboard = players.map((p, i) => ({ nickname: p.nickname, score: p.score, avatarSeed: p.avatarSeed, rank: i + 1 }));
                io.to(pin).emit('game-ended', { leaderboard });
                io.to(pin).emit('game-state-changed', { pin, status: 'ENDED' });
                activeConnections.delete(pin); // cleanup room tracking
                return;
            }
            await prisma_1.default.gameSession.update({ where: { pin }, data: { currentQuestionIndex: nextIdx } });
            io.to(pin).emit('game-state-changed', {
                pin, status: 'ACTIVE', currentQuestionIndex: nextIdx,
                totalQuestions: game.quiz.questions.length, playerCount: game.players.length
            });
            emitQuestion(io, pin, game.quiz.questions, nextIdx);
            startQuestionTimer(io, pin, game.quiz.questions, nextIdx);
        });
        // ── END QUESTION TIMER EARLY ─────────────────────────────────────
        socket.on('end-question-timer', (data) => {
            const { pin } = data;
            const entry = questionTimers.get(pin);
            if (entry) {
                // Set remaining to 1 so the interval catches it on the next tick and handles the proper reveal flow
                entry.remaining = 1;
            }
        });
        // ── PAUSE / RESUME ─────────────────────────────────────────────
        socket.on('pause-game', async (data) => {
            const { pin } = data;
            clearQuestionTimer(pin); // stop auto-advance while paused
            const game = await prisma_1.default.gameSession.update({
                where: { pin }, data: { status: 'PAUSED' }, include: { players: true }
            });
            io.to(pin).emit('game-state-changed', { pin, status: 'PAUSED', playerCount: game.players.length });
        });
        socket.on('resume-game', async (data) => {
            const { pin } = data;
            const game = await prisma_1.default.gameSession.update({
                where: { pin }, data: { status: 'ACTIVE' },
                include: { quiz: { include: { questions: { include: { options: true }, orderBy: { position: 'asc' } } } }, players: true }
            });
            io.to(pin).emit('game-state-changed', { pin, status: 'ACTIVE', playerCount: game.players.length });
            // Resume timer from current question with remaining time (or full time if not tracked)
            const existing = questionTimers.get(pin);
            const remaining = existing?.remaining ?? game.quiz.questions[game.currentQuestionIndex]?.timeLimitSeconds ?? 30;
            startQuestionTimer(io, pin, game.quiz.questions, game.currentQuestionIndex, remaining);
        });
        // ── LOCK / UNLOCK LOBBY ────────────────────────────────────────
        socket.on('lock-game', async (data) => {
            const { pin } = data;
            const game = await prisma_1.default.gameSession.update({
                where: { pin }, data: { isLocked: true }, include: { players: true }
            });
            io.to(pin).emit('game-state-changed', { pin, status: game.status, isLocked: true, playerCount: game.players.length });
            console.log(`Game ${pin} locked by host`);
        });
        socket.on('unlock-game', async (data) => {
            const { pin } = data;
            const game = await prisma_1.default.gameSession.update({
                where: { pin }, data: { isLocked: false }, include: { players: true }
            });
            io.to(pin).emit('game-state-changed', { pin, status: game.status, isLocked: false, playerCount: game.players.length });
            console.log(`Game ${pin} unlocked by host`);
        });
        // ── END GAME ───────────────────────────────────────────────────
        socket.on('end-game', async (data) => {
            const { pin } = data;
            clearQuestionTimer(pin);
            await prisma_1.default.gameSession.update({ where: { pin }, data: { status: 'ENDED', endedAt: new Date() } });
            const players = await prisma_1.default.player.findMany({ where: { sessionPin: pin }, orderBy: { score: 'desc' } });
            const leaderboard = players.map((p, i) => ({ nickname: p.nickname, score: p.score, avatarSeed: p.avatarSeed, rank: i + 1 }));
            io.to(pin).emit('game-ended', { leaderboard });
            io.to(pin).emit('game-state-changed', { pin, status: 'ENDED' });
            activeConnections.delete(pin);
        });
        // ── SUBMIT ANSWER ──────────────────────────────────────────────
        socket.on('submit-answer', async (data) => {
            const { pin, nickname, playerId, questionId, optionId, timeToAnswerMs = 5000 } = data;
            try {
                const option = await prisma_1.default.option.findUnique({ where: { id: optionId } });
                if (!option)
                    return;
                const question = await prisma_1.default.question.findUnique({ where: { id: questionId } });
                if (!question)
                    return;
                const isCorrect = option.isCorrect;
                let pointsEarned = 0;
                if (isCorrect) {
                    const timeLimitMs = question.timeLimitSeconds * 1000;
                    const timeFraction = Math.max(0, 1 - (timeToAnswerMs / timeLimitMs));
                    pointsEarned = Math.round(question.points * (0.5 + 0.5 * timeFraction));
                }
                const player = playerId
                    ? await prisma_1.default.player.findUnique({ where: { id: playerId } })
                    : await prisma_1.default.player.findFirst({ where: { sessionPin: pin, nickname } });
                // ── STREAK TRACKING ─────────────────────────────────────────
                const playerKey = player?.nickname ?? nickname ?? '';
                if (!playerStreaks.has(pin))
                    playerStreaks.set(pin, new Map());
                const roomStreaks = playerStreaks.get(pin);
                const currentStreak = roomStreaks.get(playerKey) ?? 0;
                let newStreak = 0;
                let streakBonus = 0;
                if (isCorrect) {
                    newStreak = currentStreak + 1;
                    // Bonus at 3 consecutive, 5 consecutive, and every 5 after
                    if (newStreak === 3)
                        streakBonus = 200;
                    else if (newStreak === 5)
                        streakBonus = 500;
                    else if (newStreak > 5 && newStreak % 5 === 0)
                        streakBonus = 500;
                }
                roomStreaks.set(playerKey, newStreak);
                pointsEarned += streakBonus;
                // ────────────────────────────────────────────────────────────
                let newScore = player?.score ?? 0;
                if (player) {
                    const updated = await prisma_1.default.player.update({
                        where: { id: player.id },
                        data: { score: { increment: pointsEarned } }
                    });
                    newScore = updated.score;
                }
                socket.emit('answer-result', { isCorrect, pointsEarned, newScore, streak: newStreak, streakBonus });
                const players = await prisma_1.default.player.findMany({ where: { sessionPin: pin }, orderBy: { score: 'desc' } });
                io.to(pin).emit('leaderboard-updated', {
                    entries: players.map((p, i) => ({
                        nickname: p.nickname,
                        score: p.score,
                        avatarSeed: p.avatarSeed,
                        rank: i + 1,
                        pointsLastRound: p.nickname === (player?.nickname ?? '') ? pointsEarned : 0
                    }))
                });
            }
            catch (e) {
                console.error('Error handling submit-answer:', e);
            }
        });
        // ── DISCONNECT ─────────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Clean up the connection tracking so the slot is freed on disconnect
            for (const [pin, roomMap] of activeConnections.entries()) {
                for (const [nickname, socketId] of roomMap.entries()) {
                    if (socketId === socket.id) {
                        roomMap.delete(nickname);
                        console.log(`Cleaned up connection for "${nickname}" in room ${pin}`);
                        if (roomMap.size === 0) {
                            activeConnections.delete(pin);
                        }
                    }
                }
            }
        });
    });
};
exports.setupSocketIO = setupSocketIO;
// Clean up streak data when game ends
function cleanupGameData(pin) {
    playerStreaks.delete(pin);
    activeConnections.delete(pin);
}
// Helper to emit a question to the room
function emitQuestion(io, pin, questions, idx) {
    const question = questions[idx];
    if (!question)
        return;
    io.to(pin).emit('new-question', {
        questionId: question.id,
        index: idx,
        total: questions.length,
        questionText: question.questionText,
        questionType: question.questionType,
        timeLimitSeconds: question.timeLimitSeconds,
        points: question.points,
        mediaUrl: question.mediaUrl,
        options: question.options.map((o) => ({
            id: o.id,
            text: o.optionText,
            isCorrect: o.isCorrect,
            colorCode: o.colorCode,
            position: o.position
        }))
    });
}
// Server-side countdown that auto-advances to the next question
function startQuestionTimer(io, pin, questions, idx, initialSeconds) {
    clearQuestionTimer(pin); // clear any existing timer first
    const question = questions[idx];
    if (!question)
        return;
    let remaining = initialSeconds ?? question.timeLimitSeconds;
    // Emit initial tick immediately so clients sync
    io.to(pin).emit('timer-tick', { remaining, total: question.timeLimitSeconds });
    const interval = setInterval(async () => {
        const entry = questionTimers.get(pin);
        if (entry) {
            remaining = entry.remaining - 1;
            entry.remaining = remaining;
        }
        else {
            remaining -= 1;
        }
        io.to(pin).emit('timer-tick', { remaining, total: question.timeLimitSeconds });
        if (remaining <= 0) {
            // Clear interval but keep entry for timeout
            clearInterval(interval);
            // Reveal the correct answer to all players
            const correctOption = question.options.find((o) => o.isCorrect);
            io.to(pin).emit('question-ended', {
                correctOptionId: correctOption?.id ?? null,
            });
            // Auto-show the scoreboard after 4 seconds of revealing the correct answer
            const timeout = setTimeout(() => {
                io.to(pin).emit('show-scoreboard');
            }, 4000);
            const e = questionTimers.get(pin);
            if (e)
                e.timeout = timeout;
        }
    }, 1000);
    questionTimers.set(pin, { interval, remaining });
}
