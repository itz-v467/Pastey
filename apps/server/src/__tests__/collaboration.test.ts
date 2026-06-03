import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { setupRoomHandlers } from '../sockets/roomHandler';
import { roomService } from '../services/redis';

// Mock Redis Service
jest.mock('../services/redis', () => ({
  roomService: {
    getRoom: jest.fn().mockResolvedValue({ token: 'VALID1', content: 'initial', files: [] }),
    updateContent: jest.fn().mockResolvedValue(true),
    setPresence: jest.fn().mockResolvedValue(true)
  }
}));

describe('Collaboration - Socket.IO Real-time Testing', () => {
  let ioServer: Server;
  let httpServer: any;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer);
    setupRoomHandlers(ioServer);
    
    httpServer.listen(() => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close();
    done();
  });

  beforeEach((done) => {
    jest.clearAllMocks();
    let connected = 0;
    
    const checkDone = () => {
      connected++;
      if (connected === 2) done();
    };

    clientSocket1 = Client(`http://localhost:${port}`);
    clientSocket1.on('connect', checkDone);

    clientSocket2 = Client(`http://localhost:${port}`);
    clientSocket2.on('connect', checkDone);
  });

  afterEach(() => {
    if (clientSocket1.connected) clientSocket1.disconnect();
    if (clientSocket2.connected) clientSocket2.disconnect();
  });

  it('should allow two users to join a room, see presence, and sync content', (done) => {
    // Both clients join the room
    clientSocket1.emit('room:join', { token: 'VALID1' });
    
    // We expect Client 2 to receive presence update when Client 1 joins, and vice versa.
    let presenceUpdates = 0;
    
    clientSocket2.on('presence:update', (data) => {
      presenceUpdates++;
      if (data.activeUsers === 2) {
        // Now both are connected
        clientSocket1.emit('content:update', { content: 'hello from user 1' });
      }
    });

    clientSocket1.on('room:joined', () => {
      // Client 1 joined, now Client 2 joins
      clientSocket2.emit('room:join', { token: 'VALID1' });
    });

    // Client 2 should receive the update
    clientSocket2.on('content:updated', (data) => {
      try {
        expect(data.content).toBe('hello from user 1');
        expect(roomService.updateContent).toHaveBeenCalledWith('VALID1', 'hello from user 1');
        done();
      } catch(e) {
        done(e);
      }
    });
  });
  
  it('should block content size that exceeds limit', (done) => {
    clientSocket1.emit('room:join', { token: 'VALID1' });
    
    clientSocket1.on('room:joined', () => {
      const largeContent = 'a'.repeat(102 * 1024); // 102KB
      clientSocket1.emit('content:update', { content: largeContent });
    });

    clientSocket1.on('error', (data) => {
      try {
        expect(data.message).toBe('TEXT_LIMIT_EXCEEDED');
        expect(roomService.updateContent).not.toHaveBeenCalled();
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
