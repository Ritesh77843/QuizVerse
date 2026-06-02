"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinGame = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const joinGame = async (req, res) => {
    try {
        const { sessionPin, nickname, avatarSeed } = req.body;
        const game = await prisma_1.default.gameSession.findUnique({
            where: { pin: sessionPin }
        });
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game session not found' });
        }
        if (game.status !== 'WAITING') {
            return res.status(400).json({ success: false, message: 'Game has already started or ended' });
        }
        // Check for duplicate nickname in this session
        const existingPlayer = await prisma_1.default.player.findFirst({
            where: { sessionPin, nickname }
        });
        if (existingPlayer) {
            return res.status(400).json({ success: false, message: 'Nickname already taken in this game' });
        }
        const player = await prisma_1.default.player.create({
            data: {
                nickname,
                avatarSeed,
                sessionPin,
                score: 0
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Joined successfully',
            data: player
        });
    }
    catch (error) {
        console.error('Error joining game:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.joinGame = joinGame;
