import { describe, it, expect } from 'vitest';
import { WorkerBridge } from '../src/services/WorkerBridge';

describe('WorkerBridge', () => {
  const bridge = new WorkerBridge();

  it('should compute Haversine geodetic distance accurately', async () => {
    // SFO (37.7749, -122.4194) to Oakland (37.8044, -122.2712) ~13.5 km
    const distance = await bridge.computeHaversine(37.7749, -122.4194, 37.8044, -122.2712);
    expect(distance).toBeGreaterThan(12000);
    expect(distance).toBeLessThan(15000);
  });

  it('should filter GPS coordinates through Kalman smoothing', async () => {
    const filtered = await bridge.filterGPS(37.7749, -122.4194, 3.8, 4.0);
    expect(filtered).toBeDefined();
    expect(filtered.latitude).toBeCloseTo(37.7749, 3);
    expect(filtered.longitude).toBeCloseTo(-122.4194, 3);
    expect(filtered.speed).toBeGreaterThan(0);
  });
});
