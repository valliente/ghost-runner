import type { GhostVector, TelemetryPoint } from './GhostEngine';

export type PacingStrategy = 'negative_split' | 'surge_recover' | 'constant_cadence';

export interface AIPacerConfig {
  name: string;
  strategy: PacingStrategy;
  targetPaceMinKm: number;
  totalDistanceMeters: number;
}

export class AIPacer {
  /**
   * Generates a fully calculated GhostVector tailored to an AI Pacer strategy.
   */
  public static generatePacerVector(config: AIPacerConfig): GhostVector {
    const { strategy, targetPaceMinKm, totalDistanceMeters } = config;
    const baseSpeedMs = 1000 / (targetPaceMinKm * 60); // m/s
    const points: TelemetryPoint[] = [];

    let currentDistance = 0;
    let elapsedSeconds = 0;
    const timeStepSec = 2.0;

    while (currentDistance < totalDistanceMeters) {
      let speedMultiplier = 1.0;
      const progressFraction = Math.min(currentDistance / totalDistanceMeters, 1.0);

      switch (strategy) {
        case 'negative_split':
          // Starts 5% slower (0.95), finishes 10% faster (1.10)
          speedMultiplier = 0.95 + 0.15 * progressFraction;
          break;

        case 'surge_recover': {
          // 240s cycle: 0-180s steady (1.0x), 180-210s attack surge (1.18x), 210-240s recovery (0.94x)
          const cycleTime = elapsedSeconds % 240;
          if (cycleTime >= 180 && cycleTime < 210) {
            speedMultiplier = 1.18; // 30s Surge attack
          } else if (cycleTime >= 210) {
            speedMultiplier = 0.94; // 30s Recovery
          } else {
            speedMultiplier = 1.0;
          }
          break;
        }

        case 'constant_cadence':
        default:
          speedMultiplier = 1.0; // Metronomic rigid pace
          break;
      }

      const instantSpeed = baseSpeedMs * speedMultiplier;
      const distDelta = instantSpeed * timeStepSec;
      currentDistance += distDelta;
      elapsedSeconds += timeStepSec;

      const instantPace = 1000 / (instantSpeed * 60);

      points.push({
        timestamp: elapsedSeconds,
        latitude: 37.7749 + (currentDistance / 111139) * 0.7,
        longitude: -122.4194 + (currentDistance / 111139) * 0.7,
        speed: parseFloat(instantSpeed.toFixed(2)),
        distance: parseFloat(Math.min(currentDistance, totalDistanceMeters).toFixed(1)),
        pace: parseFloat(instantPace.toFixed(2)),
        cadence: Math.round(165 + (speedMultiplier - 1.0) * 40)
      });
    }

    const totalDuration = points.length > 0 ? points[points.length - 1].timestamp : 0;

    return {
      points,
      totalDistance: totalDistanceMeters,
      totalDuration
    };
  }

  public static getStrategyDescription(strategy: PacingStrategy): string {
    switch (strategy) {
      case 'negative_split':
        return 'Starts 5% conservative, progressively ramps +10% faster to crush the finish line.';
      case 'surge_recover':
        return 'Tactical racer: launches explosive 30-second interval surges every 4 minutes.';
      case 'constant_cadence':
        return 'Unwavering metronome: maintains exact robotic target speed without variation.';
    }
  }
}
