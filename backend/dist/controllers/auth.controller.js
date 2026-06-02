"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken: token,
                refreshToken: token, // placeholder
                tokenType: 'Bearer',
                expiresIn: 86400,
                userId: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                displayName,
                role: 'HOST'
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                accessToken: token,
                refreshToken: token, // placeholder
                tokenType: 'Bearer',
                expiresIn: 86400,
                userId: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.register = register;
const getCurrentUser = async (req, res) => {
    try {
        // Note: User ID injected by authMiddleware
        const userId = req.user.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({
            success: true,
            message: 'User retrieved successfully',
            data: user
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getCurrentUser = getCurrentUser;
