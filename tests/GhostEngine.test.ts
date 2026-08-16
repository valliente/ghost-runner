import { describe, it, expect } from 'vitest';
import { GhostEngine, type TelemetryPoint } from '../src/engine/GhostEngine';

describe('GhostEngine', () => {
  const mockPoints: TelemetryPoint[] = [
    { timestamp: 0, latitude: 37.77, longitude: -122.41, speed: 4.0, distance: 0 },
    { timestamp: 10, latitude: 37.77, longitude: -122.41, speed: 4.0, distance: 40 },
    { timestamp: 20, latitude: 37.77, longitude: -122.41, speed: 6.0, distance: 100 }
  ];

  const engine = new GhostEngine(mockPoints);

  it('should return initial position at t = 0', () => {
    const pos = engine.getGhostPositionAtTime(0);
    expect(pos.x).toBe(0);
    expect(pos.speed).toBe(4.0);
  });

  it('should interpolate mid-point distance at constant speed', () => {
    const pos = engine.getGhostPositionAtTime(5);
    expect(pos.x).toBe(20);
    expect(pos.speed).toBe(4.0);
  });

  it('should linearly interpolate distance and speed during acceleration segment', () => {
    const pos = engine.getGhostPositionAtTime(15);
    expect(pos.x).toBe(70);
    expect(pos.speed).toBe(5.0);
  });

  it('should clamp to end boundary for excess time', () => {
    const pos = engine.getGhostPositionAtTime(60);
    expect(pos.x).toBe(100);
    expect(pos.speed).toBe(6.0);
  });
});
