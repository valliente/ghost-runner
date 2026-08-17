import { describe, it, expect } from 'vitest';
import { ProgressionSystem } from '../src/engine/ProgressionSystem';
import { AchievementEngine } from '../src/engine/AchievementEngine';

describe('Progression & Achievement Engine', () => {
  it('should award XP and trigger level up when thresholds are passed', () => {
    // 5km run + beat ghost + 50m climb
    const reward = ProgressionSystem.awardRunRewards(5000, 1200, true, 50, 0.95);

    expect(reward.baseXp).toBe(500);
    expect(reward.ghostBonusXp).toBe(150);
    expect(reward.elevationBonusXp).toBe(100);
    expect(reward.consistencyBonusXp).toBe(50);
    expect(reward.totalXpAwarded).toBe(800);

    const profile = ProgressionSystem.getProfile();
    expect(profile.totalDistanceMeters).toBeGreaterThanOrEqual(5000);
  });

  it('should unlock achievements when performance criteria are satisfied', () => {
    const unlocked = AchievementEngine.evaluateRun({
      distanceMeters: 5000,
      durationSeconds: 1140, // 19 mins (sub-20)
      avgPaceMinKm: 3.8,
      elevationGainMeters: 120, // >100m
      maxSpeedMs: 5.8, // >5.5 m/s
      avgCadenceSpm: 185, // >180 spm
      beatGhost: true,
      isNight: true,
      isRain: false
    });

    expect(unlocked.length).toBeGreaterThanOrEqual(4);
    const titles = unlocked.map((a) => a.id);
    expect(titles).toContain('sub20_5k');
    expect(titles).toContain('elevation_conqueror');
    expect(titles).toContain('cadence_master');
  });
});
