import * as Tone from 'tone';

export class CadenceMetronome {
  private isRunning: boolean = false;
  private targetSpm: number = 175;
  private synth!: Tone.Synth;
  private loopId: number | null = null;
  private volumeGain!: Tone.Gain;

  public async init(): Promise<void> {
    if (this.synth) return;
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    this.volumeGain = new Tone.Gain(0.4).toDestination();

    // Retro 80s FM tick synth
    this.synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 }
    }).connect(this.volumeGain);
  }

  public async start(targetSpm: number = 175): Promise<void> {
    await this.init();
    this.stop();
    this.targetSpm = Math.max(120, Math.min(220, targetSpm));
    this.isRunning = true;

    let stepCount = 0;
    const intervalMs = (60 / this.targetSpm) * 1000;

    this.loopId = window.setInterval(() => {
      if (!this.isRunning) return;
      stepCount++;
      // High pitch accent every 4 steps (e.g. C6), low pitch regular tick (C5)
      const note = stepCount % 4 === 1 ? 'C6' : 'G5';
      const time = Tone.now();
      this.synth.triggerAttackRelease(note, '32n', time);
    }, intervalMs);
  }

  public setTargetCadence(spm: number): void {
    const clamped = Math.max(120, Math.min(220, spm));
    if (this.targetSpm === clamped && this.isRunning) return;
    this.targetSpm = clamped;
    if (this.isRunning) {
      this.start(this.targetSpm);
    }
  }

  public setVolume(volume: number): void {
    if (this.volumeGain) {
      const vol = Math.max(0, Math.min(1, volume));
      this.volumeGain.gain.rampTo(vol * 0.5, 0.1);
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.loopId !== null) {
      clearInterval(this.loopId);
      this.loopId = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getTargetSpm(): number {
    return this.targetSpm;
  }
}

export const cadenceMetronome = new CadenceMetronome();
