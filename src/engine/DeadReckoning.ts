import type { TelemetryPoint } from './GhostEngine';

export class DeadReckoning {
  private static readonly EARTH_RADIUS = 6371000; // Earth radius in meters
  private static readonly MAX_DEAD_RECKONING_SECONDS = 20;

  /**
   * Calculates bearing in radians from point A to point B.
   */
  public static calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    return Math.atan2(y, x);
  }

  /**
   * Extrapolates runner position using dead reckoning during GPS signal dropouts.
   * @param lastPoint Last valid recorded telemetry point
   * @param headingRadians Current movement bearing in radians
   * @param elapsedSeconds Time elapsed since last valid GPS fix
   */
  public static extrapolate(
    lastPoint: TelemetryPoint,
    headingRadians: number,
    elapsedSeconds: number
  ): TelemetryPoint {
    const clampedElapsed = Math.min(elapsedSeconds, this.MAX_DEAD_RECKONING_SECONDS);
    const distanceTraveled = lastPoint.speed * clampedElapsed;

    const phi1 = (lastPoint.latitude * Math.PI) / 180;
    const lambda1 = (lastPoint.longitude * Math.PI) / 180;
    const delta = distanceTraveled / this.EARTH_RADIUS;

    const phi2 = Math.asin(
      Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(headingRadians)
    );

    const lambda2 =
      lambda1 +
      Math.atan2(
        Math.sin(headingRadians) * Math.sin(delta) * Math.cos(phi1),
        Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
      );

    const extrapolatedLat = (phi2 * 180) / Math.PI;
    const extrapolatedLon = (lambda2 * 180) / Math.PI;

    return {
      timestamp: lastPoint.timestamp + clampedElapsed,
      latitude: parseFloat(extrapolatedLat.toFixed(6)),
      longitude: parseFloat(extrapolatedLon.toFixed(6)),
      speed: lastPoint.speed,
      distance: lastPoint.distance + distanceTraveled,
      pace: lastPoint.pace
    };
  }
}
