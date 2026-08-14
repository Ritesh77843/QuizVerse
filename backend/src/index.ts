import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import quizRoutes from './routes/quiz.routes';

import aiRoutes from './routes/ai.routes';

import gameRoutes from './routes/game.routes';

import playerRoutes from './routes/player.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000', 'http://localhost:8081']);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP' });
});



import { setupSocketIO } from './socket/game.socket';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

// Auto-seed admin user for testing
async function seedAdminUser() {
  const email = 'ritesh@prajapati.com';
  const hashedPassword = await bcrypt.hash('a1@A2@a3@A4@', 10);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: 'Ritesh',
        role: 'ADMIN'
      }
    });
    console.log('Seeded testing account: ritesh@prajapati.com');
  } else {
    // Force update password in case it was corrupted or different
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    console.log('Updated password for testing account: ritesh@prajapati.com');
  }
}

// Initialize Socket.IO
setupSocketIO(io);

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, async () => {
  await seedAdminUser();
  console.log(`Server is running on port ${PORT}`);
});
