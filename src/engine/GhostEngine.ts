export interface TelemetryPoint {
  timestamp: number; // Elapsed time in seconds
  latitude: number;
  longitude: number;
  speed: number;     // Speed in meters per second (m/s)
  distance: number;  // Cumulative distance in meters
  pace?: number;     // Pace in minutes per kilometer (min/km)
}

export interface GhostVector {
  points: TelemetryPoint[];
  totalDistance: number;
  totalDuration: number;
}

export class GhostEngine {
  private ghostVector: GhostVector;

  constructor(pointsOrVector: TelemetryPoint[] | GhostVector) {
    if (Array.isArray(pointsOrVector)) {
      const points = [...pointsOrVector].sort((a, b) => a.timestamp - b.timestamp);
      const totalDistance = points.length > 0 ? points[points.length - 1].distance : 0;
      const totalDuration = points.length > 0 ? points[points.length - 1].timestamp - points[0].timestamp : 0;
      this.ghostVector = { points, totalDistance, totalDuration };
    } else {
      this.ghostVector = pointsOrVector;
    }
  }

  /**
   * Linearly interpolates a runner's position and speed along a 2D vector path using time-series telemetry data.
   * @param elapsedSeconds Elapsed time in seconds from run start
   */
  public getGhostPositionAtTime(elapsedSeconds: number): { x: number; speed: number } {
    const points = this.ghostVector.points;
    if (!points || points.length === 0) {
      return { x: 0, speed: 0 };
    }

    if (points.length === 1) {
      return { x: points[0].distance, speed: points[0].speed };
    }

    const firstTime = points[0].timestamp;
    const targetTime = firstTime + elapsedSeconds;

    if (targetTime <= points[0].timestamp) {
      return { x: points[0].distance, speed: points[0].speed };
    }

    const lastPoint = points[points.length - 1];
    if (targetTime >= lastPoint.timestamp) {
      return { x: lastPoint.distance, speed: lastPoint.speed };
    }

    // Binary / linear search for bounding telemetry points
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      if (targetTime >= p1.timestamp && targetTime <= p2.timestamp) {
        const timeRange = p2.timestamp - p1.timestamp;
        if (timeRange === 0) {
          return { x: p1.distance, speed: p1.speed };
        }

        const t = (targetTime - p1.timestamp) / timeRange;
        const interpolatedDistance = p1.distance + t * (p2.distance - p1.distance);
        const interpolatedSpeed = p1.speed + t * (p2.speed - p1.speed);

        return { x: interpolatedDistance, speed: interpolatedSpeed };
      }
    }

    return { x: lastPoint.distance, speed: lastPoint.speed };
  }

  public getGhostVector(): GhostVector {
    return this.ghostVector;
  }
}
