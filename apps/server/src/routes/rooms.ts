import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { roomService } from '../services/redis';

export const roomRoutes = Router();

// Validation Schemas
const updateContentSchema = z.object({
  content: z.string().max(100 * 1024, 'Content exceeds 100KB limit'), // 100KB limit
});

const tokenSchema = z.string().regex(/^([A-Z0-9]{6}|[a-zA-Z0-9_-]{24,64})$/i, 'Invalid Room ID format');

// Generate 6-character alphanumeric Room ID
function generateRoomId(): string {
  // Use crypto for randomness, convert to hex, uppercase, and take first 6 characters
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

// POST /api/rooms
roomRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = generateRoomId();
    const room = await roomService.createRoom(token);

    // Provide the URL format that the frontend uses
    const url = `/r/${token}`;
    
    res.status(201).json({
      token: room.token,
      url,
      expiresAt: room.expiresAt
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

// GET /api/rooms/:token
roomRoutes.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    
    // Validate token
    const parseResult = tokenSchema.safeParse(token);
    if (!parseResult.success) {
      res.status(400).json({ error: 'INVALID_TOKEN' });
      return;
    }

    const room = await roomService.getRoom(token);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }

    res.status(200).json({
      token: room.token,
      content: room.content,
      expiresAt: room.expiresAt
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

// PATCH /api/rooms/:token/content
roomRoutes.patch('/:token/content', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    
    // Validate token
    if (!tokenSchema.safeParse(token).success) {
      res.status(400).json({ error: 'INVALID_TOKEN' });
      return;
    }

    // Validate body
    const parseResult = updateContentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(413).json({ error: 'TEXT_LIMIT_EXCEEDED' });
      return;
    }

    const success = await roomService.updateContent(token, parseResult.data.content);
    
    if (!success) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND_OR_EXPIRED' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});
