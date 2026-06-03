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
  error: string | null;
  connect: (token: string) => void;
  disconnect: () => void;
  updateContent: (newContent: string) => void;
  uploadFile: (file: Omit<AttachedFile, 'id'>) => void;
  deleteFile: (fileId: string) => void;
  destroyRoom: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  activeUsers: 0,
  content: '',
  files: [],
  isExpired: false,
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

    socket.on('room:joined', ({ content, files }) => {
      set({ content, files: files || [], isExpired: false });
    });

    socket.on('content:updated', ({ content }) => {
      set({ content });
    });

    socket.on('files:updated', ({ files }) => {
      set({ files });
    });

    socket.on('presence:update', ({ activeUsers }) => {
      set({ activeUsers });
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
    set({ isConnected: false, content: '', files: [], activeUsers: 0, isExpired: false, error: null });
  },

  updateContent: (newContent: string) => {
    set({ content: newContent });
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
  }
}));
