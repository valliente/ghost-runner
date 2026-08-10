import * as Tone from 'tone';

export class AdaptiveAudioEngine {
  private player: Tone.GrainPlayer | null = null;
  private isLoaded: boolean = false;
  private isPlaying: boolean = false;
  private currentPlaybackRate: number = 1.0;
  private synth: Tone.Synth | null = null;
  private noiseSynth: Tone.NoiseSynth | null = null;

  constructor() {
    // Audio context is lazily initialized on user interaction
  }

  public async init(): Promise<void> {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    // Web Audio synths for sound effects
    this.synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 }
    }).toDestination();

    this.noiseSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
    }).toDestination();
  }

  public async loadSynthwaveTrack(audioUrl?: string): Promise<void> {
    return new Promise((resolve) => {
      // Use Tone.GrainPlayer for pitch-preserved tempo pitch-shifting (0.8x to 1.5x)
      const sampleUrl = audioUrl || 'https://tonejs.github.io/audio/berklee/gong_1.mp3';
      
      this.player = new Tone.GrainPlayer({
        url: sampleUrl,
        loop: true,
        grainSize: 0.1,
        overlap: 0.05,
        playbackRate: 1.0,
        onload: () => {
          this.isLoaded = true;
          resolve();
        }
      }).toDestination();
    });
  }

  public async startMusic(): Promise<void> {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    if (this.player && this.isLoaded && !this.isPlaying) {
      this.player.start();
      this.isPlaying = true;
    }
  }

  public stopMusic(): void {
    if (this.player && this.isPlaying) {
      this.player.stop();
      this.isPlaying = false;
    }
  }

  /**
   * Adjusts playback rate/tempo dynamically between 0.8x and 1.5x based on real-time pace delta
   * @param paceDeltaRatio Ratio of player pace to ghost pace
   */
  public updateTempoFromPaceDelta(paceDeltaRatio: number): number {
    const targetRate = Math.min(Math.max(paceDeltaRatio, 0.8), 1.5);
    this.setPlaybackRate(targetRate);
    return targetRate;
  }

  public setPlaybackRate(targetRate: number): void {
    const clampedRate = Math.min(Math.max(targetRate, 0.8), 1.5);
    this.currentPlaybackRate = clampedRate;
    if (this.player) {
      this.player.playbackRate = clampedRate;
    }
  }

  public getPlaybackRate(): number {
    return this.currentPlaybackRate;
  }

  public triggerSFX(type: 'boost' | 'checkpoint' | 'pass' | 'button'): void {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    const now = Tone.now();
    if (type === 'boost') {
      if (this.synth) {
        this.synth.triggerAttackRelease('C5', '8n', now);
        this.synth.triggerAttackRelease('G5', '8n', now + 0.1);
      }
    } else if (type === 'checkpoint') {
      if (this.synth) {
        this.synth.triggerAttackRelease('E5', '16n', now);
        this.synth.triggerAttackRelease('B5', '16n', now + 0.08);
        this.synth.triggerAttackRelease('E6', '8n', now + 0.16);
      }
    } else if (type === 'pass') {
      if (this.synth) {
        this.synth.triggerAttackRelease('A4', '16n', now);
        this.synth.triggerAttackRelease('C#5', '16n', now + 0.05);
      }
    } else if (type === 'button') {
      if (this.noiseSynth) {
        this.noiseSynth.triggerAttackRelease('16n', now);
      }
    }
  }
}
