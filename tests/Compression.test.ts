import { describe, it, expect } from 'vitest';
import { GhostRepository } from '../src/services/GhostRepository';
import type { GhostVector, TelemetryPoint } from '../src/engine/GhostEngine';

describe('GhostRepository LZ-String Compression', () => {
  it('should compress and decompress large telemetry vector losslessly', () => {
    const points: TelemetryPoint[] = [];
    for (let i = 0; i < 2000; i++) {
      points.push({
        timestamp: i * 2,
        latitude: 37.7749 + i * 0.0001,
        longitude: -122.4194 + i * 0.0001,
        speed: 3.8 + Math.sin(i / 10) * 0.5,
        distance: i * 7.6,
        pace: 4.38,
        elevation: 20 + Math.sin(i / 20) * 10
      });
    }

    const vector: GhostVector = {
      points,
      totalDistance: points[points.length - 1].distance,
      totalDuration: points[points.length - 1].timestamp
    };

    const rawJson = JSON.stringify(vector);
    const compressed = GhostRepository.compressVector(vector);

    // Verify significant compression ratio (>60% reduction)
    expect(compressed.length).toBeLessThan(rawJson.length * 0.5);

    // Verify lossless restoration
    const restored = GhostRepository.decompressVector(compressed);
    expect(restored.totalDistance).toBe(vector.totalDistance);
    expect(restored.points.length).toBe(vector.points.length);
    expect(restored.points[500].latitude).toBeCloseTo(vector.points[500].latitude, 5);
    expect(restored.points[500].speed).toBeCloseTo(vector.points[500].speed, 2);
  });
});
