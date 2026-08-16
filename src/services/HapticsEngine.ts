import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class HapticsEngine {
  private static isHapticsEnabled: boolean = true;
  private static cadenceIntervalId: number | null = null;

  public static setEnabled(enabled: boolean): void {
    this.isHapticsEnabled = enabled;
  }

  /**
   * Double Pulse: Warning cue when ghost is overtaking player.
   */
  public static async triggerGhostOvertakeWarning(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate([120, 80, 120]);
      }
    }
  }

  /**
   * Triple Short Buzz: 1km Split milestone completed.
   */
  public static async triggerSplitMilestone(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }, 80);
      }, 80);
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate([80, 50, 80, 50, 120]);
      }
    }
  }

  /**
   * Long Ramping Vibration: High Exertion Heart Rate Zone 5 exceeded warning.
   */
  public static async triggerZoneExceedWarning(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate([150, 80, 250]);
      }
    }
  }

  /**
   * Rhythmic Celebratory Fanfare: New Personal Record (PR) or Boss victory.
   */
  public static async triggerPRVictoryFanfare(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200, 100, 300]);
      }
    }
  }

  /**
   * Heavy Impact: Milestone completed / Boss battle encounter / Victory.
   */
  public static async triggerHeavyImpact(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate(300);
      }
    }
  }

  /**
   * Gentle Cadence Tick: Rhythm assist metronome tick.
   */
  public static async triggerCadenceTick(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
    }
  }

  /**
   * Starts a rhythm metronome at target cadence (SPM - steps per minute).
   */
  public static startCadenceMetronome(spm: number = 175): void {
    this.stopCadenceMetronome();
    if (!this.isHapticsEnabled || spm <= 0) return;

    const intervalMs = (60 / spm) * 1000;
    this.cadenceIntervalId = window.setInterval(() => {
      this.triggerCadenceTick();
    }, intervalMs);
  }

  public static stopCadenceMetronome(): void {
    if (this.cadenceIntervalId !== null) {
      clearInterval(this.cadenceIntervalId);
      this.cadenceIntervalId = null;
    }
  }
}
