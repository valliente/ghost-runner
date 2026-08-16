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
