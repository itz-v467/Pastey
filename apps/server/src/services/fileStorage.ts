import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure the uploads directory exists on startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const fileStorage = {
  /**
   * Save a base64-encoded file to disk.
   * Returns the public URL path for the file.
   */
  saveFile(roomToken: string, fileId: string, base64Data: string): string {
    const roomDir = path.join(UPLOADS_DIR, roomToken);
    if (!fs.existsSync(roomDir)) {
      fs.mkdirSync(roomDir, { recursive: true });
    }

    // Strip the data URI prefix if present (e.g., "data:image/png;base64,")
    const base64Content = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    const filePath = path.join(roomDir, fileId);
    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    
    return `/api/files/${roomToken}/${fileId}`;
  },

  /**
   * Get the public URL for a stored file.
   */
  getFileUrl(roomToken: string, fileId: string): string {
    return `/api/files/${roomToken}/${fileId}`;
  },

  /**
   * Delete a single file from disk.
   */
  deleteFile(roomToken: string, fileId: string): void {
    const filePath = path.join(UPLOADS_DIR, roomToken, fileId);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err);
    }
  },

  /**
   * Delete all files for a room.
   */
  deleteRoomFiles(roomToken: string): void {
    const roomDir = path.join(UPLOADS_DIR, roomToken);
    try {
      if (fs.existsSync(roomDir)) {
        fs.rmSync(roomDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Failed to delete room files ${roomDir}:`, err);
    }
  },

  /**
   * Get the absolute path to the uploads directory (for Express static serving).
   */
  getUploadsDir(): string {
    return UPLOADS_DIR;
  }
};
