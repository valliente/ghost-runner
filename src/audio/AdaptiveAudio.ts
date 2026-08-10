import * as Tone from 'tone';

export class AdaptiveAudioEngine {
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;

  private filter!: Tone.Filter;
  private bassSynth!: Tone.Synth;
  private leadSynth!: Tone.PolySynth;
  private kickSynth!: Tone.MembraneSynth;
  private snareSynth!: Tone.NoiseSynth;

  private bassLoop!: Tone.Sequence;
  private leadLoop!: Tone.Sequence;
  private drumLoop!: Tone.Sequence;

  private currentBpm: number = 120;
  private currentFilterFreq: number = 2500;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    // Low-pass filter for dynamic sound muffling when falling behind
    this.filter = new Tone.Filter({
      frequency: 2500,
      type: 'lowpass'
    }).toDestination();

    // 1. Bassline synth
    this.bassSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 }
    }).connect(this.filter);
    this.bassSynth.volume.value = -6;

    // 2. Synth Lead for 80s chord progressions
    this.leadSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.8 }
    }).connect(this.filter);
    this.leadSynth.volume.value = -10;

    // 3. Drums (Kick & Snare)
    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
    }).toDestination();
    this.kickSynth.volume.value = 0;

    this.snareSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination();
    this.snareSynth.volume.value = -12;

    // Sequences
    // 16th-note Synthwave Bassline
    const bassNotes = ['C2', 'C2', 'C2', 'C2', 'D#2', 'D#2', 'F2', 'G2', 'C2', 'C2', 'A#1', 'A#1', 'G#1', 'G#1', 'G1', 'G1'];
    this.bassLoop = new Tone.Sequence(
      (time, note) => {
        this.bassSynth.triggerAttackRelease(note, '16n', time);
      },
      bassNotes,
      '16n'
    );

    // 80s Chord Progression
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

    // 120 BPM Drum Loop (Kick on 1 & 3, Snare on 2 & 4)
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
      this.drumLoop.stop();
      this.isPlaying = false;
    }
  }

  /**
   * Connects Tone.Transport.bpm and filter frequency to the live speed ratio between Player and Ghost.
   * @param paceRatio Ratio of player speed to ghost speed (1.0 = equal)
   */
  public updateTempoAndTone(paceRatio: number): { bpm: number; filterFreq: number } {
    if (!this.isInitialized) return { bpm: 120, filterFreq: 2500 };

    // Clamped BPM between 90 and 180 (base 120 BPM)
    const targetBpm = Math.min(Math.max(120 * paceRatio, 90), 180);
    this.currentBpm = targetBpm;

    // Smoothly ramp BPM up or down
    Tone.Transport.bpm.rampTo(targetBpm, 0.2);

    // Low-pass filter modulation:
    // If Player falls behind (paceRatio < 1.0) -> lower filter frequency (muffle audio down to 400Hz)
    // If Player matches or exceeds pace -> open filter up to 5000Hz
    let targetFilterFreq = 2500;
    if (paceRatio < 1.0) {
      // Muffle synth audio
      targetFilterFreq = Math.max(400, 2500 * paceRatio);
    } else {
      // Open up synth brightness
      targetFilterFreq = Math.min(6000, 2500 * paceRatio);
    }

    this.currentFilterFreq = targetFilterFreq;
    if (this.filter) {
      this.filter.frequency.rampTo(targetFilterFreq, 0.2);
    }

    return { bpm: targetBpm, filterFreq: targetFilterFreq };
  }

  public getBpm(): number {
    return this.currentBpm;
  }

  public getFilterFreq(): number {
    return this.currentFilterFreq;
  }
}
