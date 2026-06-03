import { Server, Socket } from 'socket.io';
import { roomService } from '../services/redis';

const MAX_CONTENT_SIZE = 100 * 1024; // 100 KB

export function setupRoomHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a room
    socket.on('room:join', async ({ token }) => {
      // Basic validation
      const upperToken = typeof token === 'string' ? token.toUpperCase() : '';
      if (!upperToken || !/^([A-Z0-9]{6}|[A-Z0-9_-]{24,64})$/i.test(upperToken)) {
        return socket.emit('error', { message: 'Invalid Room ID' });
      }

      const room = await roomService.getRoom(upperToken);
      if (!room) {
        return socket.emit('room:expired');
      }

      // Join socket room
      await socket.join(upperToken);
      
      // We could broadcast to the previous room if we want to handle switching rooms, 
      // but assuming one socket per room for simplicity.
      socket.data.room = upperToken;
      
      // Update presence
      const clientsInRoom = io.sockets.adapter.rooms.get(upperToken)?.size || 0;
      await roomService.setPresence(upperToken, clientsInRoom);

      // Tell user they joined and current state
      socket.emit('room:joined', { 
        content: room.content, 
        files: room.files || [],
        expiresAt: room.expiresAt,
        updatedAt: room.updatedAt,
        inactivityTtl: room.inactivityTtl,
        serverNow: Date.now()
      });

      // Broadcast presence to everyone in room
      io.to(upperToken).emit('presence:update', { activeUsers: clientsInRoom });
    });

    // Handle content updates
    socket.on('content:update', async ({ content }) => {
      const token = socket.data.room;
      if (!token) return;

      if (typeof content !== 'string') return;
      
      if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_SIZE) {
        return socket.emit('error', { message: 'TEXT_LIMIT_EXCEEDED' });
      }

      // Update in Redis
      const success = await roomService.updateContent(token, content);
      
      if (!success) {
        return socket.emit('room:expired');
      }

      // Broadcast to others in the room
      socket.to(token).emit('content:updated', { content, updatedAt: Date.now() });
    });

    // Handle file uploads
    socket.on('file:upload', async ({ file }) => {
      const token = socket.data.room;
      if (!token || !file || !file.data) return;

      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB base64 size (approx)
      if (file.data.length > MAX_FILE_SIZE * 1.37) { // Base64 expansion allowance
        return socket.emit('error', { message: 'FILE_TOO_LARGE' });
      }

      const updatedFiles = await roomService.addFile(token, file);
      if (!updatedFiles) {
        return socket.emit('error', { message: 'MAX_FILES_REACHED' });
      }

      io.to(token).emit('files:updated', { files: updatedFiles, updatedAt: Date.now() });
    });

    // Handle file deletion
    socket.on('file:delete', async ({ fileId }) => {
      const token = socket.data.room;
      if (!token || !fileId) return;

      const updatedFiles = await roomService.deleteFile(token, fileId);
      if (updatedFiles) {
        io.to(token).emit('files:updated', { files: updatedFiles, updatedAt: Date.now() });
      }
    });

    // Handle room destruction
    socket.on('room:destroy', async () => {
      const token = socket.data.room;
      if (!token) return;

      await roomService.deleteRoom(token);
      io.to(token).emit('room:expired'); // This forces all clients to disconnect and redirect to /expired
    });

    // Handle TTL update
    socket.on('room:set_ttl', async ({ ttlHours }) => {
      const token = socket.data.room;
      if (!token) return;
      if (![1, 5, 15, 24].includes(ttlHours)) return;
      
      const ttlSeconds = ttlHours * 60 * 60;
      const success = await roomService.updateInactivityTtl(token, ttlSeconds);
      if (success) {
        const room = await roomService.getRoom(token);
        if (room) {
           io.to(token).emit('ttl:updated', { 
             expiresAt: room.expiresAt, 
             updatedAt: room.updatedAt,
             inactivityTtl: room.inactivityTtl,
             serverNow: Date.now()
           });
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      const token = socket.data.room;
      if (token) {
        const clientsInRoom = io.sockets.adapter.rooms.get(token)?.size || 0;
        await roomService.setPresence(token, clientsInRoom);
        io.to(token).emit('presence:update', { activeUsers: clientsInRoom });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
