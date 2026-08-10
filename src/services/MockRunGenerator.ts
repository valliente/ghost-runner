import type { TelemetryPoint, GhostVector } from '../engine/GhostEngine';

export class MockRunGenerator {
  /**
   * Generates a realistic 5km mock runner dataset with 300 telemetry points and natural pace variations.
   */
  public static generate5kMockRun(): GhostVector {
    const totalPoints = 300;
    const points: TelemetryPoint[] = [];
    
    let cumulativeDistance = 0;
    let currentTime = 0;
    const startLat = 37.7749;
    const startLon = -122.4194;

    for (let i = 0; i < totalPoints; i++) {
      // Time step of ~4 seconds per sample (total duration ~1200 seconds / 20 mins)
      const timeDelta = 4.0;
      currentTime += timeDelta;

      // Realistic runner pace dynamics (variations around 4.0 m/s ~ 14.4 km/h = 4:10 /km pace)
      // Warmup (first 30 points) -> Steady state -> Mid-race surge -> Final sprint (last 20 points)
      const progress = i / totalPoints;
      let baseSpeed = 4.0;
      
      if (progress < 0.1) {
        // Warmup: gradually ramp speed from 3.2 to 4.0 m/s
        baseSpeed = 3.2 + (progress / 0.1) * 0.8;
      } else if (progress > 0.9) {
        // Final sprint: ramp speed up to 4.8 m/s
        baseSpeed = 4.0 + ((progress - 0.9) / 0.1) * 0.8;
      } else {
        // Natural sine-wave rhythm variance (e.g. slight hills & breathing cycles)
        baseSpeed = 4.0 + Math.sin(i / 15) * 0.4 + Math.cos(i / 8) * 0.2;
      }

      const distDelta = baseSpeed * timeDelta;
      cumulativeDistance += distDelta;

      const currentPace = baseSpeed > 0 ? (1000 / (baseSpeed * 60)) : 0;

      // Simulate GPS coordinate path along a scenic loop
      const latOffset = (cumulativeDistance / 100000);
      const lonOffset = Math.sin(i / 20) * 0.0005;

      points.push({
        timestamp: currentTime,
        latitude: startLat + latOffset,
        longitude: startLon + lonOffset,
        speed: parseFloat(baseSpeed.toFixed(2)),
        distance: parseFloat(cumulativeDistance.toFixed(1)),
        pace: parseFloat(currentPace.toFixed(2))
      });
    }

    return {
      points,
      totalDistance: cumulativeDistance,
      totalDuration: currentTime
    };
  }
}
