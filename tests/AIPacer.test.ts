import { describe, it, expect } from 'vitest';
import { AIPacer } from '../src/engine/AIPacer';

describe('AIPacer', () => {
  it('should generate a negative split vector with faster finish pace', () => {
    const vector = AIPacer.generatePacerVector({
      name: 'Test Pacer Negative',
      strategy: 'negative_split',
      targetPaceMinKm: 4.0,
      totalDistanceMeters: 5000
    });

    expect(vector.points.length).toBeGreaterThan(10);
    const startPoint = vector.points[0];
    const endPoint = vector.points[vector.points.length - 1];

    // End speed should be faster than start speed in negative split
    expect(endPoint.speed).toBeGreaterThan(startPoint.speed);
  });

  it('should generate surge interval attacks in surge_recover strategy', () => {
    const vector = AIPacer.generatePacerVector({
      name: 'Test Pacer Surge',
      strategy: 'surge_recover',
      targetPaceMinKm: 4.0,
      totalDistanceMeters: 5000
    });

    const speeds = vector.points.map((p) => p.speed);
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);

    expect(maxSpeed).toBeGreaterThan(minSpeed * 1.15);
  });

  it('should maintain constant speed in constant_cadence strategy', () => {
    const vector = AIPacer.generatePacerVector({
      name: 'Test Pacer Steady',
      strategy: 'constant_cadence',
      targetPaceMinKm: 4.0,
      totalDistanceMeters: 3000
    });

    const firstSpeed = vector.points[0].speed;
    const midSpeed = vector.points[Math.floor(vector.points.length / 2)].speed;
    expect(midSpeed).toBeCloseTo(firstSpeed, 1);
  });
});
