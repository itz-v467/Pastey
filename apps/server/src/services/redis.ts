import { Redis } from 'ioredis';
import dotenv from 'dotenv';

export const ROOM_TTL = 24 * 60 * 60; // 24 hours in seconds
export const INACTIVITY_TTL = 60 * 60; // 1 hour in seconds

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64
}

export interface RoomData {
  token: string;
  content: string;
  files: AttachedFile[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

// In-Memory Fallback
const memoryStore = new Map<string, any>();

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: false,
  });
  redis.on('error', (error) => console.error('Redis error:', error));
  redis.on('connect', () => console.log('Connected to Redis'));
} else {
  console.log('No REDIS_URL provided. Using in-memory store for development.');
}

async function setKey(key: string, value: string, ttlSeconds: number) {
  if (redis) {
    await redis.set(key, value, 'EX', ttlSeconds);
  } else {
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

async function getKey(key: string): Promise<string | null> {
  if (redis) {
    return await redis.get(key);
  } else {
    const data = memoryStore.get(key);
    if (!data) return null;
    if (Date.now() > data.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return data.value;
  }
}

async function delKey(key: string) {
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

export const roomService = {
  getRoomKey: (token: string) => `room:${token}`,
  getPresenceKey: (token: string) => `presence:${token}`,

  async createRoom(token: string): Promise<RoomData> {
    const now = Date.now();
    const expiresAt = now + ROOM_TTL * 1000;
    
    const roomData: RoomData = {
      token,
      content: '',
      files: [],
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    await setKey(roomService.getRoomKey(token), JSON.stringify(roomData), ROOM_TTL);
    return roomData;
  },

  async getRoom(token: string): Promise<RoomData | null> {
    const data = await getKey(roomService.getRoomKey(token));
    if (!data) return null;
    const roomData = JSON.parse(data) as RoomData;
    if (!roomData.files) roomData.files = []; // backwards compatibility
    return roomData;
  },

  async deleteRoom(token: string): Promise<void> {
    await delKey(roomService.getRoomKey(token));
  },

  async updateContent(token: string, content: string): Promise<boolean> {
    const key = roomService.getRoomKey(token);
    const data = await getKey(key);
    if (!data) return false;

    const roomData: RoomData = JSON.parse(data);
    roomData.content = content;
    roomData.updatedAt = Date.now();

    const timeUntilAbsoluteExpiry = Math.max(0, Math.floor((roomData.expiresAt - Date.now()) / 1000));
    const newTtl = Math.min(timeUntilAbsoluteExpiry, INACTIVITY_TTL);
    
    if (newTtl <= 0) {
      await delKey(key);
      return false;
    }

    await setKey(key, JSON.stringify(roomData), newTtl);
    return true;
  },

  async addFile(token: string, file: AttachedFile): Promise<AttachedFile[] | null> {
    const key = roomService.getRoomKey(token);
    const data = await getKey(key);
    if (!data) return null;

    const roomData: RoomData = JSON.parse(data);
    if (!roomData.files) roomData.files = [];
    
    if (roomData.files.length >= 3) return null; // Max 3 files limit
    
    roomData.files.push(file);
    roomData.updatedAt = Date.now();
    
    const timeUntilAbsoluteExpiry = Math.max(0, Math.floor((roomData.expiresAt - Date.now()) / 1000));
    const newTtl = Math.min(timeUntilAbsoluteExpiry, INACTIVITY_TTL);
    if (newTtl > 0) {
      await setKey(key, JSON.stringify(roomData), newTtl);
    }
    
    return roomData.files;
  },

  async deleteFile(token: string, fileId: string): Promise<AttachedFile[] | null> {
    const key = roomService.getRoomKey(token);
    const data = await getKey(key);
    if (!data) return null;

    const roomData: RoomData = JSON.parse(data);
    if (!roomData.files) return [];
    
    roomData.files = roomData.files.filter(f => f.id !== fileId);
    roomData.updatedAt = Date.now();
    
    const timeUntilAbsoluteExpiry = Math.max(0, Math.floor((roomData.expiresAt - Date.now()) / 1000));
    const newTtl = Math.min(timeUntilAbsoluteExpiry, INACTIVITY_TTL);
    if (newTtl > 0) {
      await setKey(key, JSON.stringify(roomData), newTtl);
    }
    
    return roomData.files;
  },

  async getPresence(token: string): Promise<number> {
    const count = await getKey(roomService.getPresenceKey(token));
    return count ? parseInt(count, 10) : 0;
  },

  async setPresence(token: string, count: number): Promise<void> {
    const presenceKey = roomService.getPresenceKey(token);
    if (count <= 0) {
      await delKey(presenceKey);
    } else {
      await setKey(presenceKey, count.toString(), ROOM_TTL);
    }
  }
};
