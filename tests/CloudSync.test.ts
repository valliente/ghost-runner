import { describe, it, expect } from 'vitest';
import { CloudGhostService } from '../src/services/CloudGhostService';
import type { GhostVector } from '../src/engine/GhostEngine';

describe('CloudGhostService Integration', () => {
  it('should fetch community ghosts with default seeded tracks', async () => {
    const list = await CloudGhostService.fetchCommunityGhosts();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('id');
    expect(list[0]).toHaveProperty('name');
    expect(list[0]).toHaveProperty('distanceMeters');
  });

  it('should publish a custom ghost track and return deep-link share URL', async () => {
    const mockVector: GhostVector = {
      totalDistance: 5000,
      totalDuration: 1200,
      points: [
        { timestamp: 0, latitude: 35.6895, longitude: 139.6917, speed: 4.16, distance: 0, pace: 4.0 },
        { timestamp: 1200, latitude: 35.7100, longitude: 139.7100, speed: 4.16, distance: 5000, pace: 4.0 }
      ]
    };

    const result = await CloudGhostService.publishGhost('Tokyo Hyper 5K', 'CyberRunner99', mockVector, ['5k', 'custom']);
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.shareUrl).toContain('ghostrunner://track/');

    const downloaded = await CloudGhostService.downloadGhost(result.id);
    expect(downloaded.totalDistance).toBe(5000);
    expect(downloaded.points.length).toBe(2);
  });

  it('should correctly upvote a ghost track', () => {
    const seededId = 'cloud_tokyo_cyber_5k';
    const newLikes = CloudGhostService.likeGhost(seededId);
    expect(newLikes).toBeGreaterThan(0);
  });
});
