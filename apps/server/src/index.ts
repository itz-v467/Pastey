import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { roomRoutes } from './routes/rooms';
import { setupRoomHandlers } from './sockets/roomHandler';
import { apiRateLimiter } from './middleware/security';
import { fileStorage } from './services/fileStorage';
import { redis } from './services/redis';

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

// Serve uploaded files as static content
app.use('/api/files', express.static(fileStorage.getUploadsDir(), {
  maxAge: '1h',
  immutable: true,
}));

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

// Setup Redis adapter for horizontal scaling (if Redis is available)
async function setupRedisAdapter() {
  if (redis) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pubClient = redis;
      const subClient = pubClient.duplicate();
      
      subClient.on('error', (err: Error) => console.error('Redis sub client error:', err));
      
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO Redis adapter configured for multi-server scaling');
    } catch (err: any) {
      // @socket.io/redis-adapter is optional — works fine without it on single server
      if (err.code === 'MODULE_NOT_FOUND') {
        console.log('ℹ️  @socket.io/redis-adapter not installed. Running in single-server mode.');
        console.log('   To enable multi-server scaling: npm install @socket.io/redis-adapter');
      } else {
        console.error('Failed to setup Redis adapter:', err);
      }
    }
  }
}

// Initialize socket handlers
setupRoomHandlers(io);

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  setupRedisAdapter().then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Pastey backend running on port ${PORT}`);
    });
  });
}

export { app, httpServer, io };
