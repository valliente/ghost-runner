import { describe, it, expect } from 'vitest';
import { KalmanFilter1D, GPSKalmanFilter } from '../src/engine/KalmanFilter';

describe('KalmanFilter', () => {
  it('should smooth 1D noisy scalar measurements', () => {
    const filter = new KalmanFilter1D(0.05, 0.5, 10.0);
    const noisyMeasurements = [10.2, 9.8, 10.5, 9.7, 10.1, 10.3, 9.9];
    let smoothed = 10.0;

    for (const m of noisyMeasurements) {
      smoothed = filter.update(m);
    }

    expect(smoothed).toBeGreaterThan(9.8);
    expect(smoothed).toBeLessThan(10.3);
  });

  it('should reduce jitter on noisy GPS coordinate streams', () => {
    const gpsFilter = new GPSKalmanFilter();
    const baseLat = 37.7749;
    const baseLon = -122.4194;

    // Simulate GPS readings with noise
    const noisyReadings = [
      { lat: baseLat + 0.0002, lon: baseLon - 0.0002, speed: 3.5 },
      { lat: baseLat - 0.0001, lon: baseLon + 0.0001, speed: 3.6 },
      { lat: baseLat + 0.0003, lon: baseLon + 0.0002, speed: 3.4 },
      { lat: baseLat, lon: baseLon, speed: 3.5 }
    ];

    let lastFiltered = { latitude: 0, longitude: 0, speed: 0, accuracy: 5.0 };
    for (const r of noisyReadings) {
      lastFiltered = gpsFilter.filter(r.lat, r.lon, r.speed, 5.0);
    }

    expect(Math.abs(lastFiltered.latitude - baseLat)).toBeLessThan(0.0005);
    expect(Math.abs(lastFiltered.longitude - baseLon)).toBeLessThan(0.0005);
    expect(lastFiltered.speed).toBeCloseTo(3.5, 0);
  });
});
