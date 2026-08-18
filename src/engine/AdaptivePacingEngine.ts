export interface TrainingSessionLoad {
  id: string;
  timestamp: number;
  durationMinutes: number;
  distanceKm: number;
  avgPaceMinKm: number;
  avgHeartRate?: number;
  elevationGainM?: number;
  rpeScore?: number; // 1-10 Rate of Perceived Exertion
  trainingStressScore: number;
}

export interface WorkloadAnalysis {
  acuteLoad: number; // 7-day rolling fatigue
  chronicLoad: number; // 28-day rolling fitness base
  acwr: number; // Acute-to-Chronic Workload Ratio
  readinessState: 'fresh' | 'optimal' | 'fatigued' | 'overreaching';
  recommendedPaceAdjustmentPercent: number; // Positive = slow down (e.g. +4%), Negative = push faster (e.g. -2%)
  suggestedWorkoutType: 'recovery' | 'aerobic_base' | 'tempo' | 'intervals' | 'rest';
  fatigueIndex: number; // 0-100 scale
  recommendationMessage: string;
}

export class AdaptivePacingEngine {
  private static readonly STORAGE_KEY = 'ghost_runner_training_loads';

  /**
   * Computes Training Stress Score (TSS) for a run.
   */
  public static calculateSessionTSS(
    distanceKm: number,
    durationMinutes: number,
    avgHeartRate?: number,
    rpeScore: number = 6
  ): number {
    const intensity = avgHeartRate ? Math.min(1.0, avgHeartRate / 190) : rpeScore / 10;
    // Standard TRIMPS-derived TSS approximation
    const tss = durationMinutes * (intensity * intensity) * 1.5 * (1 + distanceKm / 20);
    return Math.round(tss * 10) / 10;
  }

  /**
   * Analyzes acute vs chronic training workload and computes ACWR (Gabbett model).
   */
  public static evaluateWorkload(history: TrainingSessionLoad[]): WorkloadAnalysis {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * oneDayMs;
    const twentyEightDaysAgo = now - 28 * oneDayMs;

    let acuteTssSum = 0;
    let chronicTssSum = 0;

    history.forEach((session) => {
      if (session.timestamp >= sevenDaysAgo) {
        acuteTssSum += session.trainingStressScore;
      }
      if (session.timestamp >= twentyEightDaysAgo) {
        chronicTssSum += session.trainingStressScore;
      }
    });

    const acuteLoad = acuteTssSum / 7;
    const chronicLoad = Math.max(10, chronicTssSum / 28);
    const acwr = Math.round((acuteLoad / chronicLoad) * 100) / 100;

    let readinessState: WorkloadAnalysis['readinessState'] = 'optimal';
    let paceAdjPercent = 0;
    let suggestedType: WorkloadAnalysis['suggestedWorkoutType'] = 'tempo';
    let msg = 'Training load is in the optimal sweet spot. Proceed with planned pace.';
    let fatigueIndex = 40;

    if (acwr < 0.8) {
      readinessState = 'fresh';
      paceAdjPercent = -2.0; // Can push 2% faster
      suggestedType = 'intervals';
      fatigueIndex = 15;
      msg = 'Runner is well-rested (Under-loaded). Ideal for PR attempts or High-Intensity Intervals.';
    } else if (acwr >= 0.8 && acwr <= 1.3) {
      readinessState = 'optimal';
      paceAdjPercent = 0;
      suggestedType = 'tempo';
      fatigueIndex = 45;
      msg = 'Workload in the optimal progressive training zone (ACWR 0.8-1.3).';
    } else if (acwr > 1.3 && acwr <= 1.5) {
      readinessState = 'fatigued';
      paceAdjPercent = 3.5; // Back off 3.5%
      suggestedType = 'aerobic_base';
      fatigueIndex = 75;
      msg = 'Elevated fatigue detected (ACWR > 1.3). Pace moderated by +3.5% to prevent injury.';
    } else {
      readinessState = 'overreaching';
      paceAdjPercent = 8.0; // Ease off significantly
      suggestedType = 'recovery';
      fatigueIndex = 95;
      msg = 'High injury hazard (ACWR > 1.5). Recovery jog or cross-training strongly advised.';
    }

    return {
      acuteLoad: Math.round(acuteLoad * 10) / 10,
      chronicLoad: Math.round(chronicLoad * 10) / 10,
      acwr,
      readinessState,
      recommendedPaceAdjustmentPercent: paceAdjPercent,
      suggestedWorkoutType: suggestedType,
      fatigueIndex,
      recommendationMessage: msg
    };
  }

  /**
   * Adapts target ghost pace (min/km) based on active fatigue evaluation.
   */
  public static adaptTargetPace(baseTargetPaceMinKm: number, analysis: WorkloadAnalysis): number {
    const factor = 1 + analysis.recommendedPaceAdjustmentPercent / 100;
    const adjusted = baseTargetPaceMinKm * factor;
    return Math.round(adjusted * 100) / 100;
  }

  /**
   * Saves a new session load into local storage history.
   */
  public static recordSessionLoad(session: Omit<TrainingSessionLoad, 'id'>): TrainingSessionLoad[] {
    const history = this.getLoadHistory();
    const newRecord: TrainingSessionLoad = {
      ...session,
      id: `load_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    history.push(newRecord);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      } catch (e) {
        // ignore
      }
    }
    return history;
  }

  /**
   * Retrieves full training load history.
   */
  public static getLoadHistory(): TrainingSessionLoad[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        // ignore
      }
    }
    // Return sample historical data if empty
    return [
      { id: 'h1', timestamp: Date.now() - 3 * 86400000, durationMinutes: 32, distanceKm: 6.2, avgPaceMinKm: 5.16, trainingStressScore: 48 },
      { id: 'h2', timestamp: Date.now() - 5 * 86400000, durationMinutes: 45, distanceKm: 8.5, avgPaceMinKm: 5.29, trainingStressScore: 68 },
      { id: 'h3', timestamp: Date.now() - 8 * 86400000, durationMinutes: 28, distanceKm: 5.0, avgPaceMinKm: 5.60, trainingStressScore: 35 },
      { id: 'h4', timestamp: Date.now() - 12 * 86400000, durationMinutes: 55, distanceKm: 10.0, avgPaceMinKm: 5.50, trainingStressScore: 82 }
    ];
  }
}
