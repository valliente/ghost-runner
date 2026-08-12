import * as Tone from 'tone';

export class SFXEngine {
  private isInit: boolean = false;
  private synth: Tone.Synth | null = null;
  private metalSynth: Tone.MetalSynth | null = null;

  public async init(): Promise<void> {
    if (this.isInit) return;
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    this.synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.2 }
    }).toDestination();
    this.synth.volume.value = -8;

    this.metalSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    this.metalSynth.frequency.value = 200;
    this.metalSynth.volume.value = -16;

    this.isInit = true;
  }

  /**
   * Retro 8-bit chime for 3-2-1-GO! countdown
   */
  public playCountdownBeep(isFinal: boolean = false): void {
    this.ensureContext();
    const now = Tone.now();
    if (!this.synth) return;

    if (isFinal) {
      this.synth.triggerAttackRelease('C6', '8n', now);
    } else {
      this.synth.triggerAttackRelease('C5', '16n', now);
    }
  }

  /**
   * Rising synth arpeggio when overtaking the ghost
   */
  public playOvertake(): void {
    this.ensureContext();
    const now = Tone.now();
    if (!this.synth) return;

    this.synth.triggerAttackRelease('E5', '32n', now);
    this.synth.triggerAttackRelease('G5', '32n', now + 0.05);
    this.synth.triggerAttackRelease('B5', '32n', now + 0.10);
    this.synth.triggerAttackRelease('E6', '16n', now + 0.15);
  }

  /**
   * Achievement fanfare chime for 1km splits
   */
  public playMilestone(): void {
    this.ensureContext();
    const now = Tone.now();
    if (!this.synth) return;

    this.synth.triggerAttackRelease('G5', '16n', now);
    this.synth.triggerAttackRelease('C6', '16n', now + 0.1);
    this.synth.triggerAttackRelease('E6', '8n', now + 0.2);
  }

  /**
   * Warning chime when falling behind target pace
   */
  public playWarning(): void {
    this.ensureContext();
    const now = Tone.now();
    if (!this.synth) return;

    this.synth.triggerAttackRelease('A3', '16n', now);
    this.synth.triggerAttackRelease('F3', '8n', now + 0.12);
  }

  /**
   * Nitro boost activation sound
   */
  public playNitroActivate(): void {
    this.ensureContext();
    const now = Tone.now();
    if (!this.synth) return;

    this.synth.triggerAttackRelease('C4', '32n', now);
    this.synth.triggerAttackRelease('G4', '32n', now + 0.04);
    this.synth.triggerAttackRelease('C5', '32n', now + 0.08);
    this.synth.triggerAttackRelease('G5', '32n', now + 0.12);
    this.synth.triggerAttackRelease('C6', '16n', now + 0.16);
  }

  private ensureContext(): void {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
  }
}

export const sfxEngine = new SFXEngine();
