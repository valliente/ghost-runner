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
    this.arpGain = new Tone.Gain(0.0).connect(this.filter); // Activated in higher exertion zones
    this.padGain = new Tone.Gain(0.7).connect(this.filter);

    // 4. Bassline Synth
    this.bassSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 }
    }).connect(this.bassGain);
    this.bassSynth.volume.value = -6;

    // 5. Synth Lead
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.8 }
    }).connect(this.leadGain);
    this.leadSynth.volume.value = -10;

    // 6. Arpeggiator Synth
    this.arpSynth = new Tone.Synth({
      oscillator: { type: 'pulse', width: 0.3 },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.1 }
    }).connect(this.arpGain);
    this.arpSynth.volume.value = -8;

    // 7. Ambient Synth Pad
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.4, decay: 0.8, sustain: 0.8, release: 1.5 }
    }).connect(this.padGain);
    this.padSynth.volume.value = -12;

    // 8. Drums (Kick & Snare)
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

    // 9. Sequences
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
        this.arpSynth.triggerAttackRelease(note, '32n', time);
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
      case 1: // Recovery / Warmup
        this.padGain.gain.rampTo(1.0, 0.5);
        this.bassGain.gain.rampTo(0.5, 0.5);
        this.leadGain.gain.rampTo(0.2, 0.5);
        this.arpGain.gain.rampTo(0.0, 0.5);
        this.drumsGain.gain.rampTo(0.4, 0.5);
        break;
      case 2: // Aerobic Easy
        this.padGain.gain.rampTo(0.8, 0.5);
        this.bassGain.gain.rampTo(0.7, 0.5);
        this.leadGain.gain.rampTo(0.5, 0.5);
        this.arpGain.gain.rampTo(0.1, 0.5);
        this.drumsGain.gain.rampTo(0.7, 0.5);
        break;
      case 3: // Tempo / Steady
        this.padGain.gain.rampTo(0.6, 0.5);
        this.bassGain.gain.rampTo(0.9, 0.5);
        this.leadGain.gain.rampTo(0.8, 0.5);
        this.arpGain.gain.rampTo(0.4, 0.5);
        this.drumsGain.gain.rampTo(0.9, 0.5);
        break;
      case 4: // Threshold / Sprint
        this.padGain.gain.rampTo(0.4, 0.5);
        this.bassGain.gain.rampTo(1.0, 0.5);
        this.leadGain.gain.rampTo(1.0, 0.5);
        this.arpGain.gain.rampTo(0.9, 0.5);
        this.drumsGain.gain.rampTo(1.1, 0.5);
        break;
      case 5: // Max Effort / Boss Sprint
        this.padGain.gain.rampTo(0.2, 0.5);
        this.bassGain.gain.rampTo(1.1, 0.5);
        this.leadGain.gain.rampTo(1.2, 0.5);
        this.arpGain.gain.rampTo(1.2, 0.5);
        this.drumsGain.gain.rampTo(1.2, 0.5);
        break;
    }
  }

  /**
   * Connects Tone.Transport.bpm and filter frequency to the live speed ratio between Player and Ghost.
   */
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
