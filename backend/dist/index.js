"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const quiz_routes_1 = __importDefault(require("./routes/quiz.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const player_routes_1 = __importDefault(require("./routes/player.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    // High-traffic optimizations
    perMessageDeflate: {
        threshold: 1024, // only compress messages > 1KB
        zlibDeflateOptions: { chunkSize: 1024 * 16 },
        zlibInflateOptions: { windowBits: 15, chunkSize: 1024 * 16 }
    },
    pingTimeout: 60000, // accommodate slower networks
    pingInterval: 25000,
    maxHttpBufferSize: 1e6 // 1MB max buffer per connection to prevent memory bloat
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/quizzes', quiz_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/games', game_routes_1.default);
app.use('/api/players', player_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
// Simple health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP' });
});
const game_socket_1 = require("./socket/game.socket");
const prisma_1 = __importDefault(require("./prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Auto-seed admin user for testing
async function seedAdminUser() {
    const email = 'ritesh@prajapati.com';
    const hashedPassword = await bcryptjs_1.default.hash('a1@A2@a3@A4@', 10);
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (!existingUser) {
        await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                displayName: 'Ritesh',
                role: 'ADMIN'
            }
        });
        console.log('Seeded testing account: ritesh@prajapati.com');
    }
    else {
        // Force update password in case it was corrupted or different
        await prisma_1.default.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log('Updated password for testing account: ritesh@prajapati.com');
    }
}
// Initialize Socket.IO
(0, game_socket_1.setupSocketIO)(io);
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, async () => {
    await seedAdminUser();
    console.log(`Server is running on port ${PORT}`);
});
