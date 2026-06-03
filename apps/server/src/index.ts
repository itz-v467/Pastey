import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { roomRoutes } from './routes/rooms';
import { setupRoomHandlers } from './sockets/roomHandler';
import { apiRateLimiter } from './middleware/security';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Enable CORS for frontend
const corsOrigin = process.env.FRONTEND_URL || '*';

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PATCH'],
}));

// Basic Security Headers
app.use(helmet());

// JSON Parsing
app.use(express.json({ limit: '105kb' }));

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// API Routes
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 3e6 // 3 MB max buffer to support 2MB file uploads + overhead
});

// Initialize socket handlers
setupRoomHandlers(io);

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Pastey backend running on port ${PORT}`);
  });
}

export { app, httpServer, io };
