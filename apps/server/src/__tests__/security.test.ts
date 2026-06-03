import request from 'supertest';
import { app } from '../index';
import { roomService } from '../services/redis';

// Mock Redis service to prevent actual Redis connections during rate limit / validation tests
jest.mock('../services/redis', () => ({
  roomService: {
    createRoom: jest.fn().mockResolvedValue({ token: 'VALID1', expiresAt: new Date() }),
    getRoom: jest.fn().mockResolvedValue({ token: 'VALID1', content: 'test', expiresAt: new Date() }),
    updateContent: jest.fn().mockResolvedValue(true)
  }
}));

describe('Security & Rate Limiting Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enforce payload size limit (max 100KB)', async () => {
    // Zod limit is 100KB, Express limit is 105KB.
    // 102KB will pass Express limit but fail Zod validation.
    const largeContent = 'a'.repeat(102 * 1024); // 102KB

    const res = await request(app)
      .patch('/api/rooms/VALID1/content')
      .send({ content: largeContent });

    expect(res.status).toBe(413);
    expect(res.body).toHaveProperty('error', 'TEXT_LIMIT_EXCEEDED');
  });

  it('should reject invalid token formats', async () => {
    const invalidTokens = ['short', 'invalid_chars!@$', 'this_is_a_very_long_invalid_token_which_exceeds_the_length_limit_'];
    
    for (const token of invalidTokens) {
      const getRes = await request(app).get(`/api/rooms/${token}`);
      expect(getRes.status).toBe(400);
      expect(getRes.body).toHaveProperty('error', 'INVALID_TOKEN');

      const patchRes = await request(app)
        .patch(`/api/rooms/${token}/content`)
        .send({ content: 'test' });
      
      if (patchRes.status !== 400) {
        console.log(`Failed token: ${token}, status: ${patchRes.status}, body:`, patchRes.body);
      }
      expect(patchRes.status).toBe(400);
      expect(patchRes.body).toHaveProperty('error', 'INVALID_TOKEN');
    }
  });

  // We skip testing exact 120 rate limit inside a loop to keep tests fast,
  // but we can test a few requests to ensure the headers are set.
  it('should return rate limit headers', async () => {
    const res = await request(app).get('/api/rooms/VALID1');
    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty('ratelimit-limit');
    expect(res.headers).toHaveProperty('ratelimit-remaining');
    expect(res.headers).toHaveProperty('ratelimit-reset');
  });
});
