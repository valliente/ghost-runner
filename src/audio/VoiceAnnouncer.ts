export type CoachPersona = 'arcade' | 'drill' | 'zen';

export class VoiceAnnouncer {
  private static isEnabled: boolean = true;
  private static volume: number = 0.9;
  private static persona: CoachPersona = 'arcade';
  private static milestoneIntervalMeters: number = 1000;
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static lastAnnouncementTime: number = 0;

  public static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public static setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public static setPersona(persona: CoachPersona): void {
    this.persona = persona;
  }

  public static setMilestoneInterval(meters: number): void {
    this.milestoneIntervalMeters = Math.max(250, meters);
  }

  public static getMilestoneInterval(): number {
    return this.milestoneIntervalMeters;
  }

  public static getPersona(): CoachPersona {
    return this.persona;
  }

  /**
   * Speaks a workout cue using pitch-shifted robotic voice modulation.
   */
  public static speak(text: string, priority: boolean = false): void {
    if (!this.isEnabled || !this.synth) return;

    const now = Date.now();
    if (!priority && now - this.lastAnnouncementTime < 4000) return;
    this.lastAnnouncementTime = now;

    if (this.synth.speaking && priority) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Persona-specific vocal properties
    if (this.persona === 'arcade') {
      utterance.pitch = 0.65; // Robotic cyberpunk
      utterance.rate = 1.15;
    } else if (this.persona === 'drill') {
      utterance.pitch = 0.85; // Sharp & punchy
      utterance.rate = 1.25;
    } else { // 'zen'
      utterance.pitch = 1.05; // Calm & flowing
      utterance.rate = 0.92;
    }

    utterance.volume = this.volume;

    const voices = this.synth.getVoices();
    const voice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Robot'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (voice) {
      utterance.voice = voice;
    }

    this.synth.speak(utterance);
  }

  /**
   * Announces milestone split metrics with persona flavor.
   */
  public static announceSplit(km: number, splitPaceMinKm: number, deltaSec: number): void {
    const mins = Math.floor(splitPaceMinKm);
    const secs = Math.round((splitPaceMinKm - mins) * 60);
    const paceStr = `${mins} minutes ${secs} seconds per kilometer`;
    const deltaAbs = Math.abs(Math.round(deltaSec));
    const status = deltaSec <= 0 ? `${deltaAbs} seconds ahead` : `${deltaAbs} seconds behind`;

    if (this.persona === 'drill') {
      const cheer = deltaSec <= 0 ? 'Good pace, keep pushing!' : 'You are falling behind, move your feet now!';
      this.speak(`Split ${km} kilometers. Pace ${paceStr}. ${status}. ${cheer}`, true);
    } else if (this.persona === 'zen') {
      this.speak(`Kilometer ${km}. Pace is steady at ${paceStr}. Focus on your breathing and rhythm.`, true);
    } else {
      this.speak(`Kilometer ${km} reached! Pace: ${paceStr}. Ghost status: ${status}.`, true);
    }
  }

  /**
   * Announces proximity alert when ghost is closing in or overtaking.
   */
  public static announceGhostProximity(distanceMeters: number, isAhead: boolean): void {
    const roundedDist = Math.round(Math.abs(distanceMeters));
    if (this.persona === 'drill') {
      if (isAhead) {
        this.speak(`Ghost is on your tail at ${roundedDist} meters! Pick up the cadence!`, false);
      } else {
        this.speak(`Ghost overtook you by ${roundedDist} meters! Surge now, zero excuses!`, true);
      }
    } else if (this.persona === 'zen') {
      if (isAhead) {
        this.speak(`Ghost is nearby. Maintain your calm flow.`, false);
      } else {
        this.speak(`Ghost has moved ahead. Deep breath, gently increase your tempo.`, true);
      }
    } else {
      if (isAhead) {
        this.speak(`Warning: Ghost closing in, ${roundedDist} meters behind.`, false);
      } else {
        this.speak(`Alert: Ghost passed you by ${roundedDist} meters. Nitro boost available!`, true);
      }
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

    if (this.persona === 'drill') {
      this.speak(`Workout terminated. Distance: ${totalDistanceKm.toFixed(2)} kilometers in ${mins} minutes ${secs} seconds. Good hustle runner.`, true);
    } else if (this.persona === 'zen') {
      this.speak(`Journey complete. ${totalDistanceKm.toFixed(2)} kilometers finished with mindful balance. Average pace ${paceMins} ${paceSecs}. Great work.`, true);
    } else {
      this.speak(`Mission accomplished! Total distance: ${totalDistanceKm.toFixed(2)} kilometers. Time: ${mins} minutes ${secs} seconds. Average pace: ${paceMins} ${paceSecs} per kilometer!`, true);
    }
  }
}
