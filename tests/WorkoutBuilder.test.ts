import { describe, it, expect } from 'vitest';
import { WorkoutBuilder, type WorkoutPlan } from '../src/engine/WorkoutBuilder';

describe('WorkoutBuilder & Interval Execution Engine', () => {
  it('should load preset workout plans with valid step sequences', () => {
    const plans = WorkoutBuilder.getPresetPlans();
    expect(plans.length).toBeGreaterThanOrEqual(3);

    const tempo5k = plans.find((p) => p.id === 'plan_5k_tempo_crusher');
    expect(tempo5k).toBeDefined();
    expect(tempo5k!.steps.length).toBe(7);
    expect(tempo5k!.totalEstimatedDistanceMeters).toBeGreaterThanOrEqual(5000);
  });

  it('should initialize and progress workout state through step transitions', () => {
    const testPlan: WorkoutPlan = {
      id: 'test_plan',
      name: 'Test 200m Intervals',
      description: 'Quick test plan',
      category: 'intervals',
      totalEstimatedDistanceMeters: 400,
      totalEstimatedDurationSeconds: 120,
      steps: [
        { id: 's1', name: 'Step 1', type: 'work', distanceMeters: 200, targetPaceMinKm: 4.0 },
        { id: 's2', name: 'Step 2', type: 'cooldown', distanceMeters: 200, targetPaceMinKm: 6.0 }
      ]
    };

    let state = WorkoutBuilder.initExecutionState(testPlan);
    expect(state.currentStepIndex).toBe(0);
    expect(state.isCompleted).toBe(false);
    expect(state.targetPaceMinKm).toBe(4.0);

    // Run 100m in Step 1 (50% progress)
    state = WorkoutBuilder.updateProgress(testPlan, state, 24, 100);
    expect(state.stepProgressPercent).toBe(50);
    expect(state.transitionTriggered).toBe(false);

    // Run another 110m (exceeds 200m -> triggers transition to Step 2)
    state = WorkoutBuilder.updateProgress(testPlan, state, 26, 110);
    expect(state.currentStepIndex).toBe(1);
    expect(state.transitionTriggered).toBe(true);
    expect(state.targetPaceMinKm).toBe(6.0);

    // Complete Step 2 (210m)
    state = WorkoutBuilder.updateProgress(testPlan, state, 60, 210);
    expect(state.isCompleted).toBe(true);
  });

  it('should generate custom interval repeat blocks accurately', () => {
    const repeats = WorkoutBuilder.createIntervalRepeats(
      { name: 'Fast 400', type: 'work', distanceMeters: 400, targetPaceMinKm: 3.8 },
      { name: 'Rest 200', type: 'rest', distanceMeters: 200, targetPaceMinKm: 6.5 },
      4
    );

    expect(repeats.length).toBe(7); // 4 work reps + 3 rest reps between
    expect(repeats[0].name).toContain('Rep 1/4');
    expect(repeats[repeats.length - 1].name).toContain('Rep 4/4');
  });
});
