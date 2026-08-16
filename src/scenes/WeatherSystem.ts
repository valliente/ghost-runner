import Phaser from 'phaser';

export type TimeOfDayPhase = 'DUSK' | 'MIDNIGHT' | 'SUNRISE';

export interface WeatherPalette {
  skyTop: number;
  skyBottom: number;
  mountainTint: number;
  sunTint: number;
  rainAlpha: number;
}

export class WeatherSystem {
  private scene: Phaser.Scene;
  private rainEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private splashEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private puddles: Phaser.GameObjects.Graphics[] = [];

  private currentPhase: TimeOfDayPhase = 'DUSK';

  private static readonly PALETTES: Record<TimeOfDayPhase, WeatherPalette> = {
    DUSK: {
      skyTop: 0x1d023b,
      skyBottom: 0x4a0852,
      mountainTint: 0x8800aa,
      sunTint: 0xff007f,
      rainAlpha: 0.2
    },
    MIDNIGHT: {
      skyTop: 0x03000a,
      skyBottom: 0x0f0326,
      mountainTint: 0x330066,
      sunTint: 0x00f3ff,
      rainAlpha: 0.7
    },
    SUNRISE: {
      skyTop: 0x2e0836,
      skyBottom: 0x7a1e3b,
      mountainTint: 0xcc3366,
      sunTint: 0xffbb00,
      rainAlpha: 0.1
    }
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public create(): void {
    // Generate rain drop texture programmatically if not present
    if (!this.scene.textures.exists('cyber-raindrop')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00f3ff, 0.8);
      g.fillRect(0, 0, 2, 12);
      g.generateTexture('cyber-raindrop', 2, 12);
      g.destroy();
    }

    // Generate ripple particle texture
    if (!this.scene.textures.exists('rain-ripple')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(1, 0x00f3ff, 0.6);
      g.strokeEllipse(8, 4, 8, 4);
      g.generateTexture('rain-ripple', 16, 8);
      g.destroy();
    }

    // Rain Particle Emitter (slanting diagonal cyber rain)
    this.rainEmitter = this.scene.add.particles(0, 0, 'cyber-raindrop', {
      x: { min: -100, max: 900 },
      y: -20,
      speedX: -80,
      speedY: { min: 450, max: 700 },
      lifespan: 1000,
      frequency: 25,
      scaleY: { min: 0.8, max: 1.5 },
      alpha: { start: 0.6, end: 0.1 },
      blendMode: 'ADD'
    });

    // Splash ripple emitter on the ground track floor (y = 350-420)
    this.splashEmitter = this.scene.add.particles(0, 0, 'rain-ripple', {
      x: { min: 20, max: 780 },
      y: { min: 350, max: 420 },
      scale: { start: 0.2, end: 1.2 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 300,
      frequency: 80,
      blendMode: 'ADD'
    });

    // Floor Reflection Puddles
    this.createPuddles();
  }

  private createPuddles(): void {
    for (let i = 0; i < 4; i++) {
      const puddle = this.scene.add.graphics();
      puddle.fillStyle(0x00f3ff, 0.15);
      puddle.fillEllipse(150 + i * 180, 390 + (i % 2) * 15, 60 + i * 10, 10);
      this.puddles.push(puddle);
    }
  }

  public update(elapsedSeconds: number, _deltaSec: number): WeatherPalette {
    // Determine Time-of-Day Phase based on elapsed workout time
    let targetPhase: TimeOfDayPhase = 'DUSK';
    if (elapsedSeconds < 300) {
      targetPhase = 'DUSK';
    } else if (elapsedSeconds < 900) {
      targetPhase = 'MIDNIGHT';
    } else {
      targetPhase = 'SUNRISE';
    }

    this.currentPhase = targetPhase;
    const palette = WeatherSystem.PALETTES[this.currentPhase];

    // Adjust rain density based on phase
    if (this.rainEmitter) {
      this.rainEmitter.setAlpha(palette.rainAlpha);
    }
    if (this.splashEmitter) {
      this.splashEmitter.setAlpha(palette.rainAlpha * 0.8);
    }

    // Animate puddle shimmer
    const shimmer = 0.1 + 0.05 * Math.sin(elapsedSeconds * 4);
    this.puddles.forEach((p, idx) => {
      p.setAlpha(shimmer * (idx % 2 === 0 ? 1.2 : 0.8));
    });

    return palette;
  }

  public getCurrentPhase(): TimeOfDayPhase {
    return this.currentPhase;
  }
}
