export type WorkoutStepType = 'warmup' | 'work' | 'rest' | 'cooldown' | 'recovery';

export interface WorkoutStep {
  id: string;
  name: string;
  type: WorkoutStepType;
  durationSeconds?: number;
  distanceMeters?: number;
  targetPaceMinKm?: number; // Target pace in min/km (e.g. 4.0 = 4:00/km)
  targetCadenceSpm?: number; // Target cadence in SPM (e.g. 180)
  targetHeartRateZone?: number; // 1-5
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  category: 'intervals' | 'tempo' | 'pyramid' | 'endurance';
  totalEstimatedDistanceMeters: number;
  totalEstimatedDurationSeconds: number;
  steps: WorkoutStep[];
}

export interface WorkoutExecutionState {
  currentStepIndex: number;
  stepElapsedSeconds: number;
  stepElapsedMeters: number;
  totalElapsedSeconds: number;
  totalElapsedMeters: number;
  isCompleted: boolean;
  targetPaceMinKm: number;
  targetCadenceSpm: number;
  stepProgressPercent: number;
  currentStep: WorkoutStep | null;
  transitionTriggered: boolean;
  transitionMessage: string | null;
}

export class WorkoutBuilder {
  /**
   * Predefined high-intensity and endurance workout templates.
   */
  public static getPresetPlans(): WorkoutPlan[] {
    return [
      {
        id: 'plan_5k_tempo_crusher',
        name: '5K Tempo Crusher',
        description: 'Warmup into 3x 1km sub-threshold cruise intervals with 90s jog recovery, finishing with a progressive cooldown.',
        category: 'tempo',
        totalEstimatedDistanceMeters: 5200,
        totalEstimatedDurationSeconds: 1560,
        steps: [
          { id: 's1', name: 'Warmup Jog', type: 'warmup', distanceMeters: 1000, targetPaceMinKm: 5.5, targetCadenceSpm: 165, notes: 'Easy aerobic buildup' },
          { id: 's2', name: 'Tempo Block 1', type: 'work', distanceMeters: 1000, targetPaceMinKm: 4.0, targetCadenceSpm: 180, notes: 'Lock into race pace' },
          { id: 's3', name: 'Active Recovery', type: 'recovery', durationSeconds: 90, targetPaceMinKm: 6.0, targetCadenceSpm: 160, notes: 'Breathe and shake out legs' },
          { id: 's4', name: 'Tempo Block 2', type: 'work', distanceMeters: 1000, targetPaceMinKm: 3.95, targetCadenceSpm: 182, notes: 'Hold tight form' },
          { id: 's5', name: 'Active Recovery', type: 'recovery', durationSeconds: 90, targetPaceMinKm: 6.0, targetCadenceSpm: 160, notes: 'Hydrate / deep breaths' },
          { id: 's6', name: 'Tempo Block 3 (Surge)', type: 'work', distanceMeters: 1000, targetPaceMinKm: 3.85, targetCadenceSpm: 185, notes: 'Empty the tank on final km' },
          { id: 's7', name: 'Cooldown Flush', type: 'cooldown', distanceMeters: 800, targetPaceMinKm: 5.8, targetCadenceSpm: 160, notes: 'Lactate flush down' }
        ]
      },
      {
        id: 'plan_vo2max_pyramids',
        name: 'VO2 Max Pyramids',
        description: 'High-cadence interval pyramid: 200m -> 400m -> 800m -> 400m -> 200m sprint bursts with 1:1 rest intervals.',
        category: 'pyramid',
        totalEstimatedDistanceMeters: 4600,
        totalEstimatedDurationSeconds: 1320,
        steps: [
          { id: 'p1', name: 'Dynamic Warmup', type: 'warmup', distanceMeters: 800, targetPaceMinKm: 5.3, targetCadenceSpm: 170 },
          { id: 'p2', name: 'Sprint 200m', type: 'work', distanceMeters: 200, targetPaceMinKm: 3.3, targetCadenceSpm: 195 },
          { id: 'p3', name: 'Rest Jog 200m', type: 'rest', distanceMeters: 200, targetPaceMinKm: 6.2, targetCadenceSpm: 155 },
          { id: 'p4', name: 'Sprint 400m', type: 'work', distanceMeters: 400, targetPaceMinKm: 3.5, targetCadenceSpm: 190 },
          { id: 'p5', name: 'Rest Jog 400m', type: 'rest', distanceMeters: 400, targetPaceMinKm: 6.2, targetCadenceSpm: 155 },
          { id: 'p6', name: 'Apex 800m', type: 'work', distanceMeters: 800, targetPaceMinKm: 3.65, targetCadenceSpm: 188 },
          { id: 'p7', name: 'Rest Jog 400m', type: 'rest', distanceMeters: 400, targetPaceMinKm: 6.2, targetCadenceSpm: 155 },
          { id: 'p8', name: 'Sprint 400m', type: 'work', distanceMeters: 400, targetPaceMinKm: 3.45, targetCadenceSpm: 192 },
          { id: 'p9', name: 'Rest Jog 200m', type: 'rest', distanceMeters: 200, targetPaceMinKm: 6.2, targetCadenceSpm: 155 },
          { id: 'p10', name: 'Final 200m Hyper Blast', type: 'work', distanceMeters: 200, targetPaceMinKm: 3.2, targetCadenceSpm: 200 },
          { id: 'p11', name: 'Cooldown', type: 'cooldown', distanceMeters: 600, targetPaceMinKm: 6.0, targetCadenceSpm: 155 }
        ]
      },
      {
        id: 'plan_endurance_long_run',
        name: 'Endurance Long Run (10K Base)',
        description: 'Progressive steady aerobic conditioning with negative-split pacing in the second half.',
        category: 'endurance',
        totalEstimatedDistanceMeters: 10000,
        totalEstimatedDurationSeconds: 3000,
        steps: [
          { id: 'e1', name: 'Zone 2 Base Warmup', type: 'warmup', distanceMeters: 2000, targetPaceMinKm: 5.4, targetCadenceSpm: 168 },
          { id: 'e2', name: 'Steady Aerobic Engine', type: 'work', distanceMeters: 5000, targetPaceMinKm: 5.0, targetCadenceSpm: 174 },
          { id: 'e3', name: 'Negative Split Acceleration', type: 'work', distanceMeters: 2000, targetPaceMinKm: 4.5, targetCadenceSpm: 180 },
          { id: 'e4', name: 'Cooldown Flush', type: 'cooldown', distanceMeters: 1000, targetPaceMinKm: 5.8, targetCadenceSpm: 160 }
        ]
      }
    ];
  }

  /**
   * Initializes a fresh execution state for the selected workout plan.
   */
  public static initExecutionState(plan: WorkoutPlan): WorkoutExecutionState {
    const firstStep = plan.steps[0] || null;
    return {
      currentStepIndex: 0,
      stepElapsedSeconds: 0,
      stepElapsedMeters: 0,
      totalElapsedSeconds: 0,
      totalElapsedMeters: 0,
      isCompleted: plan.steps.length === 0,
      targetPaceMinKm: firstStep?.targetPaceMinKm || 5.0,
      targetCadenceSpm: firstStep?.targetCadenceSpm || 175,
      stepProgressPercent: 0,
      currentStep: firstStep,
      transitionTriggered: false,
      transitionMessage: firstStep ? `Starting: ${firstStep.name}` : null
    };
  }

  /**
   * Updates progress for the active workout interval and checks for step completions.
   */
  public static updateProgress(
    plan: WorkoutPlan,
    state: WorkoutExecutionState,
    deltaSeconds: number,
    deltaMeters: number
  ): WorkoutExecutionState {
    if (state.isCompleted || !state.currentStep) {
      return state;
    }

    const currentStep = state.currentStep;
    const stepElapsedSec = state.stepElapsedSeconds + deltaSeconds;
    const stepElapsedM = state.stepElapsedMeters + deltaMeters;
    const totalElapsedSec = state.totalElapsedSeconds + deltaSeconds;
    const totalElapsedM = state.totalElapsedMeters + deltaMeters;

    let isStepComplete = false;

    // Check distance-based completion
    if (currentStep.distanceMeters && stepElapsedM >= currentStep.distanceMeters) {
      isStepComplete = true;
    }
    // Check time-based completion
    else if (currentStep.durationSeconds && stepElapsedSec >= currentStep.durationSeconds) {
      isStepComplete = true;
    }

    if (isStepComplete) {
      const nextIndex = state.currentStepIndex + 1;
      if (nextIndex < plan.steps.length) {
        const nextStep = plan.steps[nextIndex];
        return {
          currentStepIndex: nextIndex,
          stepElapsedSeconds: 0,
          stepElapsedMeters: 0,
          totalElapsedSeconds: totalElapsedSec,
          totalElapsedMeters: totalElapsedM,
          isCompleted: false,
          targetPaceMinKm: nextStep.targetPaceMinKm || 5.0,
          targetCadenceSpm: nextStep.targetCadenceSpm || 175,
          stepProgressPercent: 0,
          currentStep: nextStep,
          transitionTriggered: true,
          transitionMessage: `Interval Complete! Next: ${nextStep.name} (${nextStep.type.toUpperCase()})`
        };
      } else {
        return {
          currentStepIndex: nextIndex,
          stepElapsedSeconds: stepElapsedSec,
          stepElapsedMeters: stepElapsedM,
          totalElapsedSeconds: totalElapsedSec,
          totalElapsedMeters: totalElapsedM,
          isCompleted: true,
          targetPaceMinKm: currentStep.targetPaceMinKm || 5.0,
          targetCadenceSpm: currentStep.targetCadenceSpm || 175,
          stepProgressPercent: 100,
          currentStep: null,
          transitionTriggered: true,
          transitionMessage: `Workout Finished! Excellent training session!`
        };
      }
    }

    // Calculate progress percentage inside current step
    let progressPercent = 0;
    if (currentStep.distanceMeters) {
      progressPercent = Math.min(100, (stepElapsedM / currentStep.distanceMeters) * 100);
    } else if (currentStep.durationSeconds) {
      progressPercent = Math.min(100, (stepElapsedSec / currentStep.durationSeconds) * 100);
    }

    return {
      ...state,
      stepElapsedSeconds: stepElapsedSec,
      stepElapsedMeters: stepElapsedM,
      totalElapsedSeconds: totalElapsedSec,
      totalElapsedMeters: totalElapsedM,
      stepProgressPercent: progressPercent,
      transitionTriggered: false,
      transitionMessage: null
    };
  }

  /**
   * Helper to construct custom repeat blocks.
   */
  public static createIntervalRepeats(
    workStep: Omit<WorkoutStep, 'id'>,
    restStep: Omit<WorkoutStep, 'id'>,
    repeats: number
  ): WorkoutStep[] {
    const steps: WorkoutStep[] = [];
    for (let i = 1; i <= repeats; i++) {
      steps.push({
        ...workStep,
        id: `work_rep_${i}_${Date.now()}`,
        name: `${workStep.name} (Rep ${i}/${repeats})`
      });
      if (i < repeats) {
        steps.push({
          ...restStep,
          id: `rest_rep_${i}_${Date.now()}`,
          name: `${restStep.name} (Rest ${i}/${repeats})`
        });
      }
    }
    return steps;
  }
}
