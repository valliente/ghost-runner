import { describe, it, expect } from 'vitest';
import { GPSKalmanFilter } from '../../src/engine/KalmanFilter';
import { GhostEngine, type TelemetryPoint } from '../../src/engine/GhostEngine';
import { SegmentTracker } from '../../src/engine/SegmentTracker';
import { ActivityExporter } from '../../src/services/ActivityExporter';

describe('E2E Race Simulation (10,000m Scenario)', () => {
  it('should accurately simulate full 10km race with Kalman filtering and segment triggers', () => {
    const targetDistanceMeters = 10000;
    const timeStepSec = 2.0; // 2-second telemetry ticks
    const baseSpeed = 3.75; // m/s (~4:26 /km)

    const kalman = new GPSKalmanFilter();
    const segmentTracker = new SegmentTracker();
    const playerPoints: TelemetryPoint[] = [];

    let currentDist = 0;
    let elapsedSec = 0;
    let segmentActiveCount = 0;
    let segmentCompletedCount = 0;

    let baseLat = 37.7749;
    let baseLon = -122.4194;

    while (currentDist < targetDistanceMeters) {
      elapsedSec += timeStepSec;

      // Realistic speed variation (fatigue + terrain)
      const instantSpeed = baseSpeed + Math.sin(elapsedSec / 60) * 0.3;
      const stepDistance = instantSpeed * timeStepSec;
      currentDist += stepDistance;

      // Add GPS sensor noise to simulate raw mobile receiver
      const noiseLat = (Math.random() - 0.5) * 0.0001;
      const noiseLon = (Math.random() - 0.5) * 0.0001;
      baseLat += (stepDistance / 111139) * 0.7;
      baseLon += (stepDistance / 111139) * 0.7;

      const filtered = kalman.filter(baseLat + noiseLat, baseLon + noiseLon, instantSpeed, 4.0);

      const point: TelemetryPoint = {
        timestamp: elapsedSec,
        latitude: filtered.latitude,
        longitude: filtered.longitude,
        speed: filtered.speed,
        distance: parseFloat(currentDist.toFixed(1)),
        pace: 1000 / (filtered.speed * 60)
      };
      playerPoints.push(point);

      // Check Segment Tracker
      const segState = segmentTracker.update(currentDist, elapsedSec);
      if (segState) {
        if (segState.status === 'ACTIVE') segmentActiveCount++;
        if (segState.status === 'COMPLETED') segmentCompletedCount++;
      }
    }

    // 1. Verify Total Distance and Duration
    expect(currentDist).toBeGreaterThanOrEqual(targetDistanceMeters);
    expect(playerPoints.length).toBeGreaterThan(1200);

    // 2. Verify Segments triggered and completed
    expect(segmentActiveCount).toBeGreaterThan(0);
    expect(segmentCompletedCount).toBeGreaterThan(0);

    // 3. Verify GhostEngine interpolation over 10km
    const ghostEngine = new GhostEngine(playerPoints);
    const midPos = ghostEngine.getGhostPositionAtTime(elapsedSec / 2);
    expect(midPos.x).toBeGreaterThan(3000);
    expect(midPos.x).toBeLessThan(7000);

    // 4. Verify GPX and TCX Schema exports
    const gpx = ActivityExporter.generateGPX(playerPoints, '10K Cyber Championship');
    const tcx = ActivityExporter.generateTCX(playerPoints, '10K Cyber Championship');

    expect(gpx).toContain('<trkpt');
    expect(gpx).toContain('10K Cyber Championship');
    expect(tcx).toContain('<TrainingCenterDatabase');
    expect(tcx).toContain('<DistanceMeters>');
  });
});
