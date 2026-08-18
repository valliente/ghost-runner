export interface SlipstreamState {
  isDrafting: boolean;
  targetGhostId: string | null;
  proximityMeters: number;
  draftDurationSeconds: number;
  draftBonusPercent: number; // 0% to 12%
  speedMultiplier: number; // 1.00 to 1.08
  lockOnProgressPercent: number; // 0% to 100%
  triggerAudioLock: boolean;
}

export class SlipstreamEngine {
  private static readonly MIN_DRAFT_DISTANCE_M = 0.5;
  private static readonly MAX_DRAFT_DISTANCE_M = 4.5;
  private static readonly LOCK_ON_TIME_THRESHOLD_S = 1.5;

  private activeDurationSeconds: number = 0;
  private currentTargetGhostId: string | null = null;
  private lockOnTriggered: boolean = false;

  /**
   * Evaluates player position relative to ghost to determine drafting lock-on.
   * Player must be trailing behind the ghost by 0.5m - 4.5m.
   */
  public evaluate(
    playerDistanceMeters: number,
    playerSpeedMs: number,
    ghostDistanceMeters: number,
    ghostSpeedMs: number,
    ghostId: string,
    deltaSeconds: number
  ): SlipstreamState {
    const deltaMeters = ghostDistanceMeters - playerDistanceMeters;

    // Must be trailing behind the ghost within proximity sweet spot and running with positive velocity
    const isInDraftPocket =
      deltaMeters >= SlipstreamEngine.MIN_DRAFT_DISTANCE_M &&
      deltaMeters <= SlipstreamEngine.MAX_DRAFT_DISTANCE_M &&
      playerSpeedMs > 1.5 &&
      Math.abs(playerSpeedMs - ghostSpeedMs) < 2.0;

    if (isInDraftPocket) {
      if (this.currentTargetGhostId === ghostId) {
        this.activeDurationSeconds += deltaSeconds;
      } else {
        this.currentTargetGhostId = ghostId;
        this.activeDurationSeconds = deltaSeconds;
        this.lockOnTriggered = false;
      }

      const lockPercent = Math.min(100, (this.activeDurationSeconds / SlipstreamEngine.LOCK_ON_TIME_THRESHOLD_S) * 100);
      const isFullLock = this.activeDurationSeconds >= SlipstreamEngine.LOCK_ON_TIME_THRESHOLD_S;

      // Distance scaling factor: closer to 1.5m gives maximum bonus (12%)
      const proximityFactor = 1.0 - Math.abs(deltaMeters - 2.0) / 2.5;
      const draftBonus = isFullLock ? Math.min(12.0, 5.0 + 7.0 * Math.max(0, proximityFactor)) : 0;
      const speedMultiplier = 1.0 + draftBonus / 100;

      const triggerAudio = isFullLock && !this.lockOnTriggered;
      if (triggerAudio) {
        this.lockOnTriggered = true;
      }

      return {
        isDrafting: isFullLock,
        targetGhostId: ghostId,
        proximityMeters: Math.round(deltaMeters * 10) / 10,
        draftDurationSeconds: Math.round(this.activeDurationSeconds * 10) / 10,
        draftBonusPercent: Math.round(draftBonus * 10) / 10,
        speedMultiplier: Math.round(speedMultiplier * 1000) / 1000,
        lockOnProgressPercent: Math.round(lockPercent),
        triggerAudioLock: triggerAudio
      };
    } else {
      // Slipstream lost or broke out of pocket
      this.activeDurationSeconds = Math.max(0, this.activeDurationSeconds - deltaSeconds * 2);
      if (this.activeDurationSeconds <= 0) {
        this.currentTargetGhostId = null;
        this.lockOnTriggered = false;
      }

      return {
        isDrafting: false,
        targetGhostId: null,
        proximityMeters: Math.round(deltaMeters * 10) / 10,
        draftDurationSeconds: 0,
        draftBonusPercent: 0,
        speedMultiplier: 1.0,
        lockOnProgressPercent: 0,
        triggerAudioLock: false
      };
    }
  }

  /**
   * Resets active slipstream state.
   */
  public reset(): void {
    this.activeDurationSeconds = 0;
    this.currentTargetGhostId = null;
    this.lockOnTriggered = false;
  }
}

export const slipstreamEngine = new SlipstreamEngine();
