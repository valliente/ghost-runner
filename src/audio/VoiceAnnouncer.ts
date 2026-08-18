export type CoachPersona = 'arcade' | 'drill' | 'zen' | 'arcade_ja' | 'cyber_ai' | 'track_coach_80s';

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
    if (!priority && now - this.lastAnnouncementTime < 3500) return;
    this.lastAnnouncementTime = now;

    if (this.synth.speaking && priority) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Persona-specific vocal properties
    switch (this.persona) {
      case 'arcade':
        utterance.pitch = 0.65;
        utterance.rate = 1.15;
        break;
      case 'arcade_ja':
        utterance.pitch = 1.1;
        utterance.rate = 1.25;
        utterance.lang = 'ja-JP';
        break;
      case 'cyber_ai':
        utterance.pitch = 0.55;
        utterance.rate = 1.05;
        break;
      case 'track_coach_80s':
        utterance.pitch = 0.95;
        utterance.rate = 1.3;
        break;
      case 'drill':
        utterance.pitch = 0.85;
        utterance.rate = 1.25;
        break;
      case 'zen':
        utterance.pitch = 1.05;
        utterance.rate = 0.92;
        break;
    }

    utterance.volume = this.volume;

    const voices = this.synth.getVoices();
    if (this.persona === 'arcade_ja') {
      const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
      if (jaVoice) utterance.voice = jaVoice;
    } else {
      const voice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Robot'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (voice) {
        utterance.voice = voice;
      }
    }

    this.synth.speak(utterance);
  }

  /**
   * Announces milestone split metrics with persona flavor.
   */
  public static announceSplit(km: number, splitPaceMinKm: number, deltaSec: number): void {
    const mins = Math.floor(splitPaceMinKm);
    const secs = Math.round((splitPaceMinKm - mins) * 60);
    const paceStr = `${mins}:${secs.toString().padStart(2, '0')} per kilometer`;
    const deltaAbs = Math.abs(Math.round(deltaSec));
    const status = deltaSec <= 0 ? `${deltaAbs} seconds ahead` : `${deltaAbs} seconds behind`;

    if (this.persona === 'arcade_ja') {
      const jaStatus = deltaSec <= 0 ? 'リード中' : 'ビハインド';
      this.speak(`${km}キロ通過。ペース${mins}分${secs}秒。${jaStatus}！`, true);
    } else if (this.persona === 'track_coach_80s') {
      const cheer = deltaSec <= 0 ? 'Looking strong champion!' : 'Pick up those knees, let us go!';
      this.speak(`Split ${km}K in the books! Pace ${paceStr}. ${status}. ${cheer}`, true);
    } else if (this.persona === 'drill') {
      const cheer = deltaSec <= 0 ? 'Good pace, keep pushing!' : 'You are falling behind, move your feet now!';
      this.speak(`Split ${km} kilometers. Pace ${paceStr}. ${status}. ${cheer}`, true);
    } else if (this.persona === 'zen') {
      this.speak(`Kilometer ${km}. Pace is steady at ${paceStr}. Focus on your breathing and rhythm.`, true);
    } else {
      this.speak(`Kilometer ${km} reached! Pace: ${paceStr}. Ghost status: ${status}.`, true);
    }
  }

  /**
   * Announces slipstream drafting lock-on.
   */
  public static announceSlipstreamLock(bonusPercent: number): void {
    if (this.persona === 'arcade_ja') {
      this.speak(`スリップストリーム ロックオン！加速プラス${Math.round(bonusPercent)}パーセント！`, true);
    } else if (this.persona === 'cyber_ai') {
      this.speak(`Aerodynamic slipstream acquired. Efficiency bonus: plus ${Math.round(bonusPercent)} percent.`, true);
    } else {
      this.speak(`Drafting lock-on! Slipstream speed boost engaged!`, true);
    }
  }

  /**
   * Announces interval step transitions during structured workouts.
   */
  public static announceIntervalStep(stepName: string, stepType: string, targetPaceMinKm?: number): void {
    let paceNote = '';
    if (targetPaceMinKm) {
      const mins = Math.floor(targetPaceMinKm);
      const secs = Math.round((targetPaceMinKm - mins) * 60);
      paceNote = `Target pace: ${mins}:${secs.toString().padStart(2, '0')}.`;
    }

    if (this.persona === 'arcade_ja') {
      this.speak(`インターバルチェンジ！ ${stepName}！ 行くぞ！`, true);
    } else if (this.persona === 'track_coach_80s') {
      this.speak(`New block: ${stepName}! ${stepType.toUpperCase()} mode! ${paceNote} 3, 2, 1, LET'S GO!`, true);
    } else {
      this.speak(`Interval transition: ${stepName}. ${paceNote} Push your pace!`, true);
    }
  }

  /**
   * Announces segment PR records.
   */
  public static announceSegmentPR(segmentName: string, deltaSec: number): void {
    const deltaStr = Math.abs(deltaSec).toFixed(1);
    if (this.persona === 'arcade_ja') {
      this.speak(`区間レコード更新！ ${segmentName} マイナス${deltaStr}秒！`, true);
    } else {
      this.speak(`New segment record on ${segmentName}! ${deltaStr} seconds faster!`, true);
    }
  }

  /**
   * Announces cyber boss encounters and incoming hazard attacks.
   */
  public static announceBossAttack(bossName: string, attackType: string): void {
    if (this.persona === 'arcade_ja') {
      this.speak(`警告！ ${bossName}の${attackType}！ 回避せよ！`, true);
    } else {
      this.speak(`Warning! ${bossName} incoming with ${attackType}! Increase cadence to evade!`, true);
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

    if (this.persona === 'arcade_ja') {
      this.speak(`トレーニング終了！ 距離${totalDistanceKm.toFixed(2)}キロ、タイム${mins}分${secs}秒。お疲れ様でした！`, true);
    } else if (this.persona === 'drill') {
      this.speak(`Workout terminated. Distance: ${totalDistanceKm.toFixed(2)} kilometers in ${mins} minutes ${secs} seconds. Good hustle runner.`, true);
    } else if (this.persona === 'zen') {
      this.speak(`Journey complete. ${totalDistanceKm.toFixed(2)} kilometers finished with mindful balance. Average pace ${paceMins}:${paceSecs.toString().padStart(2, '0')}. Great work.`, true);
    } else {
      this.speak(`Mission accomplished! Total distance: ${totalDistanceKm.toFixed(2)} kilometers. Time: ${mins} minutes ${secs} seconds. Average pace: ${paceMins}:${paceSecs.toString().padStart(2, '0')} per kilometer!`, true);
    }
  }
}
