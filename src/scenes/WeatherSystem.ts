import Phaser from 'phaser';

export type TimeOfDayPhase = 'DUSK' | 'MIDNIGHT' | 'SUNRISE';
export type WeatherType = 'CLEAR' | 'RAIN' | 'CYBER_STORM' | 'ACID_FOG';

export interface WeatherPalette {
  skyTop: number;
  skyBottom: number;
  mountainTint: number;
  sunTint: number;
  rainAlpha: number;
  fogAlpha: number;
  weatherType: WeatherType;
}

export class WeatherSystem {
  private scene: Phaser.Scene;
  private rainEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private splashEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private puddles: Phaser.GameObjects.Graphics[] = [];
  private fogLayer1!: Phaser.GameObjects.Graphics;
  private fogLayer2!: Phaser.GameObjects.Graphics;
  private lightningFlashOverlay!: Phaser.GameObjects.Rectangle;

  private currentPhase: TimeOfDayPhase = 'DUSK';
  private currentWeatherType: WeatherType = 'RAIN';
  private lastLightningTime: number = 0;
  private nextLightningDelayMs: number = 7000;

  private static readonly PALETTES: Record<TimeOfDayPhase, WeatherPalette> = {
    DUSK: {
      skyTop: 0x1d023b,
      skyBottom: 0x4a0852,
      mountainTint: 0x8800aa,
      sunTint: 0xff007f,
      rainAlpha: 0.2,
      fogAlpha: 0.15,
      weatherType: 'CLEAR'
    },
    MIDNIGHT: {
      skyTop: 0x03000a,
      skyBottom: 0x0f0326,
      mountainTint: 0x330066,
      sunTint: 0x00f3ff,
      rainAlpha: 0.75,
      fogAlpha: 0.35,
      weatherType: 'CYBER_STORM'
    },
    SUNRISE: {
      skyTop: 0x2e0836,
      skyBottom: 0x7a1e3b,
      mountainTint: 0xcc3366,
      sunTint: 0xffbb00,
      rainAlpha: 0.1,
      fogAlpha: 0.1,
      weatherType: 'CLEAR'
    }
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public create(): void {
    // 1. Generate rain drop texture programmatically
    if (!this.scene.textures.exists('cyber-raindrop')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00f3ff, 0.85);
      g.fillRect(0, 0, 2, 14);
      g.generateTexture('cyber-raindrop', 2, 14);
      g.destroy();
    }

    // 2. Generate ripple particle texture
    if (!this.scene.textures.exists('rain-ripple')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(1, 0x00f3ff, 0.6);
      g.strokeEllipse(8, 4, 8, 4);
      g.generateTexture('rain-ripple', 16, 8);
      g.destroy();
    }

    // 3. Volumetric Neon Fog Bands
    this.fogLayer1 = this.scene.add.graphics({ x: 0, y: 240 });
    this.fogLayer1.fillStyle(0x00f3ff, 0.08);
    this.fogLayer1.fillRect(0, 0, 1600, 180);
    this.fogLayer1.setDepth(2);

    this.fogLayer2 = this.scene.add.graphics({ x: 0, y: 300 });
    this.fogLayer2.fillStyle(0xff007f, 0.06);
    this.fogLayer2.fillRect(0, 0, 1600, 150);
    this.fogLayer2.setDepth(3);

    // 4. Rain Particle Emitter (slanting diagonal cyber rain)
    this.rainEmitter = this.scene.add.particles(0, 0, 'cyber-raindrop', {
      x: { min: -100, max: 900 },
      y: -20,
      speedX: -90,
      speedY: { min: 500, max: 800 },
      lifespan: 1000,
      frequency: 20,
      scaleY: { min: 0.8, max: 1.6 },
      alpha: { start: 0.7, end: 0.1 },
      blendMode: 'ADD'
    });
    this.rainEmitter.setDepth(4);

    // 5. Splash ripple emitter on the ground track floor
    this.splashEmitter = this.scene.add.particles(0, 0, 'rain-ripple', {
      x: { min: 20, max: 780 },
      y: { min: 350, max: 420 },
      scale: { start: 0.2, end: 1.3 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 300,
      frequency: 60,
      blendMode: 'ADD'
    });
    this.splashEmitter.setDepth(5);

    // 6. Floor Reflection Puddles
    this.createPuddles();

    // 7. Fullscreen Thunder Lightning Flash Overlay
    this.lightningFlashOverlay = this.scene.add.rectangle(400, 225, 800, 450, 0xe0ffff, 0.0);
    this.lightningFlashOverlay.setDepth(20);
    this.lightningFlashOverlay.setBlendMode(Phaser.BlendModes.ADD);
  }

  private createPuddles(): void {
    for (let i = 0; i < 4; i++) {
      const puddle = this.scene.add.graphics();
      puddle.fillStyle(0x00f3ff, 0.18);
      puddle.fillEllipse(150 + i * 180, 390 + (i % 2) * 15, 60 + i * 10, 10);
      puddle.setDepth(1);
      this.puddles.push(puddle);
    }
  }

  /**
   * Triggers a blinding thunder & lightning strobe flash.
   */
  public triggerLightningFlash(): void {
    if (!this.lightningFlashOverlay) return;

    this.scene.tweens.add({
      targets: this.lightningFlashOverlay,
      fillAlpha: 0.85,
      duration: 50,
      yoyo: true,
      repeat: 1,
      ease: 'Power2',
      onComplete: () => {
        this.lightningFlashOverlay.setFillStyle(0xe0ffff, 0.0);
      }
    });

    // Camera micro-shake on thunder impact
    this.scene.cameras.main.shake(150, 0.005);
  }

  public update(elapsedSeconds: number, deltaSec: number): WeatherPalette {
    // Determine Time-of-Day Phase based on elapsed workout time
    let targetPhase: TimeOfDayPhase = 'DUSK';
    if (elapsedSeconds < 300) {
      targetPhase = 'DUSK';
      this.currentWeatherType = 'CLEAR';
    } else if (elapsedSeconds < 900) {
      targetPhase = 'MIDNIGHT';
      this.currentWeatherType = 'CYBER_STORM';
    } else {
      targetPhase = 'SUNRISE';
      this.currentWeatherType = 'CLEAR';
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

    // Drifting animated volumetric fog
    if (this.fogLayer1 && this.fogLayer2) {
      this.fogLayer1.x -= 20 * deltaSec;
      if (this.fogLayer1.x < -800) this.fogLayer1.x = 0;
      this.fogLayer2.x -= 35 * deltaSec;
      if (this.fogLayer2.x < -800) this.fogLayer2.x = 0;

      this.fogLayer1.setAlpha(palette.fogAlpha);
      this.fogLayer2.setAlpha(palette.fogAlpha * 0.7);
    }

    // Dynamic Lightning in Cyber Storm mode
    if (this.currentWeatherType === 'CYBER_STORM') {
      const now = Date.now();
      if (now - this.lastLightningTime > this.nextLightningDelayMs) {
        this.triggerLightningFlash();
        this.lastLightningTime = now;
        this.nextLightningDelayMs = 6000 + Math.random() * 8000;
      }
    }

    // Animate puddle shimmer
    const shimmer = 0.12 + 0.06 * Math.sin(elapsedSeconds * 4);
    this.puddles.forEach((p, idx) => {
      p.setAlpha(shimmer * (idx % 2 === 0 ? 1.2 : 0.8));
    });

    return palette;
  }

  public getCurrentPhase(): TimeOfDayPhase {
    return this.currentPhase;
  }

  public getCurrentWeather(): WeatherType {
    return this.currentWeatherType;
  }
}
