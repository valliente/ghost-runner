import * as Tone from 'tone';

export class AdaptiveAudioEngine {
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;

  // Master Chain
  private masterLimiter!: Tone.Limiter;
  private filter!: Tone.Filter;

  // Stem Channels
  private drumsGain!: Tone.Gain;
  private bassGain!: Tone.Gain;
  private leadGain!: Tone.Gain;
  private arpGain!: Tone.Gain;
  private padGain!: Tone.Gain;

  // Spatial 3D Audio for Ghost Tracking
  private ghostPanner!: Tone.Panner3D;
  private ghostFootstepSynth!: Tone.MembraneSynth;
  private ghostWhooshSynth!: Tone.NoiseSynth;
  private ghostGain!: Tone.Gain;

  // Synths
  private bassSynth!: Tone.Synth;
  private leadSynth!: Tone.PolySynth;
  private arpSynth!: Tone.Synth;
  private padSynth!: Tone.PolySynth;
  private kickSynth!: Tone.MembraneSynth;
  private snareSynth!: Tone.NoiseSynth;

  // Sequences
  private bassLoop!: Tone.Sequence;
  private leadLoop!: Tone.Sequence;
  private arpLoop!: Tone.Sequence;
  private padLoop!: Tone.Sequence;
  private drumLoop!: Tone.Sequence;

  private currentBpm: number = 120;
  private currentFilterFreq: number = 2500;
  private currentExertionZone: number = 2;
  private currentGradeSlope: number = 0;

  // Procedural Synth Scales (Dorian Minor)
  private static readonly D_DORIAN_SCALE = ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    // 1. Master Output with Brickwall Limiter (-1 dBFS threshold)
    this.masterLimiter = new Tone.Limiter(-1).toDestination();

    // 2. Dynamic Low-Pass Master Filter
    this.filter = new Tone.Filter({
      frequency: 2500,
      type: 'lowpass'
    }).connect(this.masterLimiter);

    // 3. Multi-Channel Stem Gains
    this.drumsGain = new Tone.Gain(1.0).connect(this.filter);
    this.bassGain = new Tone.Gain(0.9).connect(this.filter);
    this.leadGain = new Tone.Gain(0.8).connect(this.filter);
    this.arpGain = new Tone.Gain(0.0).connect(this.filter);
    this.padGain = new Tone.Gain(0.7).connect(this.filter);

    // 4. Spatial 3D Ghost Audio Channel
    this.ghostPanner = new Tone.Panner3D({
      panningModel: 'HRTF',
      distanceModel: 'exponential',
      positionX: 0,
      positionY: 0,
      positionZ: 1,
      refDistance: 1,
      maxDistance: 50,
      rolloffFactor: 1.5
    });

    this.ghostGain = new Tone.Gain(0.75).connect(this.filter);
    this.ghostPanner.connect(this.ghostGain);

    this.ghostFootstepSynth = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.1 }
    }).connect(this.ghostPanner);
    this.ghostFootstepSynth.volume.value = -14;

    this.ghostWhooshSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.0, release: 0.2 }
    }).connect(this.ghostPanner);
    this.ghostWhooshSynth.volume.value = -16;

    // 5. Bassline Synth
    this.bassSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 }
    }).connect(this.bassGain);
    this.bassSynth.volume.value = -6;

    // 6. Synth Lead
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.8 }
    }).connect(this.leadGain);
    this.leadSynth.volume.value = -10;

    // 7. Arpeggiator Synth
    this.arpSynth = new Tone.Synth({
      oscillator: { type: 'pulse', width: 0.3 },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.1 }
    }).connect(this.arpGain);
    this.arpSynth.volume.value = -8;

    // 8. Ambient Synth Pad
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.4, decay: 0.8, sustain: 0.8, release: 1.5 }
    }).connect(this.padGain);
    this.padSynth.volume.value = -12;

    // 9. Drums (Kick & Snare)
    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
    }).connect(this.drumsGain);

    this.snareSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).connect(this.drumsGain);
    this.snareSynth.volume.value = -12;

    // 10. Sequences
    const bassNotes = ['C2', 'C2', 'C2', 'C2', 'D#2', 'D#2', 'F2', 'G2', 'C2', 'C2', 'A#1', 'A#1', 'G#1', 'G#1', 'G1', 'G1'];
    this.bassLoop = new Tone.Sequence(
      (time, note) => {
        this.bassSynth.triggerAttackRelease(note, '16n', time);
      },
      bassNotes,
      '16n'
    );

    const chords = [
      ['C4', 'E4', 'G4', 'B4'],
      ['A3', 'C4', 'E4', 'G4'],
      ['F3', 'A3', 'C4', 'E4'],
      ['G3', 'B3', 'D4', 'F4']
    ];
    this.leadLoop = new Tone.Sequence(
      (time, chord) => {
        this.leadSynth.triggerAttackRelease(chord, '2n', time);
      },
      chords,
      '1m'
    );

    const arpNotes = ['C5', 'G4', 'D#5', 'G5', 'A#4', 'F5', 'D5', 'G5'];
    this.arpLoop = new Tone.Sequence(
      (time, note) => {
        // Adapt pitch to terrain slope
        const pitch = this.calculatePitchForSlope(note);
        this.arpSynth.triggerAttackRelease(pitch, '32n', time);
      },
      arpNotes,
      '16n'
    );

    this.padLoop = new Tone.Sequence(
      (time, chord) => {
        this.padSynth.triggerAttackRelease(chord, '1m', time);
      },
      chords,
      '2m'
    );

    const drumEvents = [
      'kick', null, 'kick', null,
      'snare', null, 'kick', null,
      'kick', null, 'kick', null,
      'snare', null, 'kick', 'snare'
    ];
    this.drumLoop = new Tone.Sequence(
      (time, event) => {
        if (event === 'kick') {
          this.kickSynth.triggerAttackRelease('C1', '8n', time);
        } else if (event === 'snare') {
          this.snareSynth.triggerAttackRelease('8n', time);
        }
      },
      drumEvents,
      '16n'
    );

    Tone.Transport.bpm.value = 120;
    this.isInitialized = true;
  }

  /**
   * Updates 3D spatial position of opponent/ghost audio relative to player.
   * deltaMeters > 0: Ghost is ahead (+Z), deltaMeters < 0: Ghost is behind (-Z)
   * laneOffsetX: -1 (left lane), 0 (center), +1 (right lane)
   */
  public updateGhostSpatialPosition(deltaMeters: number, laneOffsetX: number = 0): void {
    if (!this.isInitialized || !this.ghostPanner) return;

    const posX = Math.max(-5, Math.min(5, laneOffsetX * 3));
    const posZ = Math.max(-25, Math.min(25, deltaMeters));

    this.ghostPanner.positionX.rampTo(posX, 0.1);
    this.ghostPanner.positionZ.rampTo(posZ, 0.1);
  }

  /**
   * Plays a 3D positioned ghost footstep.
   */
  public triggerGhostFootstep(deltaMeters: number, laneOffsetX: number = 0): void {
    if (!this.isInitialized) return;
    this.updateGhostSpatialPosition(deltaMeters, laneOffsetX);
    this.ghostFootstepSynth.triggerAttackRelease('E2', '16n');
  }

  /**
   * Plays a 3D positioned aerodynamic whoosh when drafting or passing.
   */
  public triggerGhostWhoosh(deltaMeters: number): void {
    if (!this.isInitialized) return;
    this.updateGhostSpatialPosition(deltaMeters, 0.5);
    this.ghostWhooshSynth.triggerAttackRelease('8n');
  }

  private calculatePitchForSlope(baseNote: string): string {
    if (this.currentGradeSlope > 2.0) {
      // Uphill: Transpose higher
      return baseNote.replace('4', '5').replace('5', '6');
    } else if (this.currentGradeSlope < -2.0) {
      // Downhill: Resolve lower
      return baseNote.replace('5', '4').replace('6', '5');
    }
    return baseNote;
  }

  public setElevationSlope(gradePercent: number): void {
    this.currentGradeSlope = gradePercent;
  }

  /**
   * Generates a procedural synthwave lead arpeggio melody locked to Dorian scale.
   */
  public generateProceduralMelody(seed: number): string[] {
    const melody: string[] = [];
    const scale = AdaptiveAudioEngine.D_DORIAN_SCALE;

    for (let i = 0; i < 8; i++) {
      const idx = Math.abs(Math.floor(Math.sin(seed + i * 1.5) * scale.length)) % scale.length;
      melody.push(scale[idx]);
    }
    return melody;
  }

  public async startMusic(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (!this.isPlaying) {
      this.bassLoop.start(0);
      this.leadLoop.start(0);
      this.arpLoop.start(0);
      this.padLoop.start(0);
      this.drumLoop.start(0);
      Tone.Transport.start();
      this.isPlaying = true;
    }
  }

  public stopMusic(): void {
    if (this.isPlaying) {
      Tone.Transport.stop();
      this.bassLoop.stop();
      this.leadLoop.stop();
      this.arpLoop.stop();
      this.padLoop.stop();
      this.drumLoop.stop();
      this.isPlaying = false;
    }
  }

  /**
   * Dynamically automates stem gains based on runner exertion zone (Zones 1-5).
   */
  public setExertionZone(zone: 1 | 2 | 3 | 4 | 5): void {
    this.currentExertionZone = zone;
    if (!this.isInitialized) return;

    switch (zone) {
      case 1:
        this.padGain.gain.rampTo(1.0, 0.5);
        this.bassGain.gain.rampTo(0.5, 0.5);
        this.leadGain.gain.rampTo(0.2, 0.5);
        this.arpGain.gain.rampTo(0.0, 0.5);
        this.drumsGain.gain.rampTo(0.4, 0.5);
        break;
      case 2:
        this.padGain.gain.rampTo(0.8, 0.5);
        this.bassGain.gain.rampTo(0.7, 0.5);
        this.leadGain.gain.rampTo(0.5, 0.5);
        this.arpGain.gain.rampTo(0.1, 0.5);
        this.drumsGain.gain.rampTo(0.7, 0.5);
        break;
      case 3:
        this.padGain.gain.rampTo(0.6, 0.5);
        this.bassGain.gain.rampTo(0.9, 0.5);
        this.leadGain.gain.rampTo(0.8, 0.5);
        this.arpGain.gain.rampTo(0.4, 0.5);
        this.drumsGain.gain.rampTo(0.9, 0.5);
        break;
      case 4:
        this.padGain.gain.rampTo(0.4, 0.5);
        this.bassGain.gain.rampTo(1.0, 0.5);
        this.leadGain.gain.rampTo(1.0, 0.5);
        this.arpGain.gain.rampTo(0.9, 0.5);
        this.drumsGain.gain.rampTo(1.1, 0.5);
        break;
      case 5:
        this.padGain.gain.rampTo(0.2, 0.5);
        this.bassGain.gain.rampTo(1.1, 0.5);
        this.leadGain.gain.rampTo(1.2, 0.5);
        this.arpGain.gain.rampTo(1.2, 0.5);
        this.drumsGain.gain.rampTo(1.2, 0.5);
        break;
    }
  }

  public updateTempoAndTone(paceRatio: number): { bpm: number; filterFreq: number } {
    if (!this.isInitialized) return { bpm: 120, filterFreq: 2500 };

    const targetBpm = Math.min(Math.max(120 * paceRatio, 90), 185);
    this.currentBpm = targetBpm;

    Tone.Transport.bpm.rampTo(targetBpm, 0.2);

    let targetFilterFreq = 2500;
    if (paceRatio < 1.0) {
      targetFilterFreq = Math.max(400, 2500 * paceRatio);
    } else {
      targetFilterFreq = Math.min(6000, 2500 * paceRatio);
    }

    this.currentFilterFreq = targetFilterFreq;
    if (this.filter) {
      this.filter.frequency.rampTo(targetFilterFreq, 0.2);
    }

    return { bpm: targetBpm, filterFreq: targetFilterFreq };
  }

  private lastAlertTime: number = 0;

  public checkPaceAlerts(paceDeltaSecKm: number): void {
    const now = Date.now();
    if (now - this.lastAlertTime < 8000) return;

    if (paceDeltaSecKm > 10) {
      import('./SFXEngine').then(({ sfxEngine }) => {
        sfxEngine.playWarning();
      });
      this.lastAlertTime = now;
    }
  }

  public getBpm(): number {
    return this.currentBpm;
  }

  public getFilterFreq(): number {
    return this.currentFilterFreq;
  }

  public getExertionZone(): number {
    return this.currentExertionZone;
  }
}
