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
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/quizzes', quiz_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/games', game_routes_1.default);
app.use('/api/players', player_routes_1.default);
// Simple health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP' });
});
const game_socket_1 = require("./socket/game.socket");
// Initialize Socket.IO
(0, game_socket_1.setupSocketIO)(io);
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
