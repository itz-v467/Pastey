import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64
}

interface SocketState {
  isConnected: boolean;
  activeUsers: number;
  content: string;
  files: AttachedFile[];
  isExpired: boolean;
  expiresAt: number | null;
  updatedAt: number | null;
  inactivityTtl: number; // in seconds
  error: string | null;
  connect: (token: string) => void;
  disconnect: () => void;
  updateContent: (newContent: string) => void;
  uploadFile: (file: Omit<AttachedFile, 'id'>) => void;
  deleteFile: (fileId: string) => void;
  destroyRoom: () => void;
  setTtl: (ttlHours: number) => void;
  setExpired: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  activeUsers: 0,
  content: '',
  files: [],
  isExpired: false,
  expiresAt: null,
  updatedAt: null,
  inactivityTtl: 3600,
  error: null,

  connect: (token: string) => {
    // Clear previous listeners to avoid duplicates on re-renders
    socket.off('connect');
    socket.off('room:joined');
    socket.off('content:updated');
    socket.off('presence:update');
    socket.off('files:updated');
    socket.off('room:expired');
    socket.off('error');
    socket.off('disconnect');

    socket.on('connect', () => {
      set({ isConnected: true, error: null });
      socket.emit('room:join', { token });
    });

    if (socket.connected) {
      set({ isConnected: true, error: null });
      socket.emit('room:join', { token });
    } else {
      socket.connect();
    }

    socket.on('room:joined', ({ content, files, expiresAt, updatedAt, inactivityTtl, serverNow }) => {
      const skew = Date.now() - (serverNow || Date.now());
      set({ 
        content, 
        files: files || [], 
        isExpired: false, 
        expiresAt: expiresAt ? expiresAt + skew : null, 
        updatedAt: updatedAt ? updatedAt + skew : null, 
        inactivityTtl: inactivityTtl || 3600 
      });
    });

    socket.on('content:updated', ({ content }) => {
      set({ content, updatedAt: Date.now() });
    });

    socket.on('files:updated', ({ files }) => {
      set({ files, updatedAt: Date.now() });
    });

    socket.on('presence:update', ({ activeUsers }) => {
      set({ activeUsers });
    });

    socket.on('ttl:updated', ({ expiresAt, updatedAt, inactivityTtl, serverNow }) => {
      const skew = Date.now() - (serverNow || Date.now());
      set({ 
        expiresAt: expiresAt ? expiresAt + skew : null, 
        updatedAt: updatedAt ? updatedAt + skew : null, 
        inactivityTtl 
      });
    });

    socket.on('room:expired', () => {
      set({ isExpired: true });
    });

    socket.on('error', (err: { message: string }) => {
      if (err.message === 'FILE_TOO_LARGE') {
        import('sonner').then((m) => m.toast.error('File exceeds 2MB limit.'));
        return;
      }
      if (err.message === 'MAX_FILES_REACHED') {
        import('sonner').then((m) => m.toast.error('Maximum of 3 files allowed.'));
        return;
      }
      set({ error: err.message });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });
  },

  disconnect: () => {
    socket.disconnect();
    set({ isConnected: false, content: '', files: [], activeUsers: 0, isExpired: false, expiresAt: null, updatedAt: null, inactivityTtl: 3600, error: null });
  },

  updateContent: (newContent: string) => {
    set({ content: newContent, updatedAt: Date.now() });
    socket.emit('content:update', { content: newContent });
  },

  uploadFile: (file) => {
    const fileWithId = { ...file, id: crypto.randomUUID() };
    socket.emit('file:upload', { file: fileWithId });
  },

  deleteFile: (fileId) => {
    socket.emit('file:delete', { fileId });
  },

  destroyRoom: () => {
    socket.emit('room:destroy');
  },

  setTtl: (ttlHours: number) => {
    socket.emit('room:set_ttl', { ttlHours });
  },

  setExpired: () => {
    set({ isExpired: true });
    socket.disconnect();
  }
}));
