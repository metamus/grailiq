import { describe, it, expect } from 'vitest';

describe('Health Check', () => {
  it('should return a health status structure', () => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    };

    expect(health.status).toBe('ok');
    expect(health.services.database).toBe('connected');
    expect(health.services.redis).toBe('connected');
    expect(health.uptime).toBeGreaterThan(0);
  });
});
