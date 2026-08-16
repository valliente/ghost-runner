export class VoiceAnnouncer {
  private static isEnabled: boolean = true;
  private static volume: number = 0.9;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static lastAnnouncementTime: number = 0;

  public static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public static setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Speaks a workout cue using pitch-shifted robotic voice modulation.
   */
  public static speak(text: string, priority: boolean = false): void {
    if (!this.isEnabled || !this.synth) return;

    const now = Date.now();
    // Prevent overlapping voice spam unless priority
    if (!priority && now - this.lastAnnouncementTime < 4000) return;
    this.lastAnnouncementTime = now;

    if (this.synth.speaking && priority) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.65; // Low robotic tone
    utterance.rate = 1.15;  // Fast arcade cadence
    utterance.volume = this.volume;

    // Pick English or robotic voice if available
    const voices = this.synth.getVoices();
    const roboticVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Robot'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (roboticVoice) {
      utterance.voice = roboticVoice;
    }

    this.synth.speak(utterance);
  }

  /**
   * Announces 1km split metrics.
   */
  public static announceSplit(km: number, splitPaceMinKm: number, deltaSec: number): void {
    const mins = Math.floor(splitPaceMinKm);
    const secs = Math.round((splitPaceMinKm - mins) * 60);
    const paceStr = `${mins} minutes ${secs} seconds per kilometer`;

    const deltaAbs = Math.abs(Math.round(deltaSec));
    const status = deltaSec <= 0 ? `${deltaAbs} seconds ahead of ghost` : `${deltaAbs} seconds behind ghost`;

    this.speak(`Kilometer ${km} completed. Pace: ${paceStr}. You are ${status}.`, true);
  }

  /**
   * Announces proximity alert when ghost is closing in or overtaking.
   */
  public static announceGhostProximity(distanceMeters: number, isAhead: boolean): void {
    const roundedDist = Math.round(Math.abs(distanceMeters));
    if (isAhead) {
      this.speak(`Warning: Ghost is closing in, ${roundedDist} meters behind you.`, false);
    } else {
      this.speak(`Alert: Ghost has passed you by ${roundedDist} meters. Increase pace now.`, true);
    }
  }

  /**
   * Announces workout completion statistics.
   */
  public static announceWorkoutComplete(totalDistanceKm: number, durationSec: number, avgPaceMinKm: number): void {
    const mins = Math.floor(durationSec / 60);
    const secs = Math.floor(durationSec % 60);
    const paceMins = Math.floor(avgPaceMinKm);
    const paceSecs = Math.round((avgPaceMinKm - paceMins) * 60);

    this.speak(
      `Mission accomplished. Total distance: ${totalDistanceKm.toFixed(2)} kilometers. Total time: ${mins} minutes ${secs} seconds. Average pace: ${paceMins} ${paceSecs} per kilometer.`,
      true
    );
  }
}
