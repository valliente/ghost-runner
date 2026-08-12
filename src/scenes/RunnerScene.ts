import Phaser from 'phaser';
import { GhostEngine } from '../engine/GhostEngine';
import { MockRunGenerator } from '../services/MockRunGenerator';

export type GameState = 'READY' | 'COUNTDOWN' | 'RUNNING' | 'PAUSED' | 'FINISHED';

export interface MetricsUpdate {
  elapsedSeconds: number;
  playerDistanceKm: number;
  playerPaceMinKm: number;
  ghostPaceMinKm: number;
  paceDeltaSecKm: number;
  paceRatio: number;
  playerSpeedMs: number;
  ghostSpeedMs: number;
}

export class RunnerScene extends Phaser.Scene {
  private playerSprite!: Phaser.GameObjects.Sprite;
  private ghostSprite!: Phaser.GameObjects.Sprite;

  private sunImage!: Phaser.GameObjects.Image;
  private mountainTile!: Phaser.GameObjects.TileSprite;
  private gridTile!: Phaser.GameObjects.TileSprite;

  private ghostEngine!: GhostEngine;
  private elapsedTime: number = 0;

  private playerDistanceMeters: number = 0;
  private playerSpeedMs: number = 4.0; // ~4.0 m/s default (~14.4 km/h, pace ~4:10 /km)
  private ghostDistanceMeters: number = 0;
  private ghostSpeedMs: number = 0;

  private nitroChargeTimer: number = 0;
  private nitroActiveTimer: number = 0;
  private isNitroActive: boolean = false;

  private onMetricsUpdateCallback?: (metrics: MetricsUpdate) => void;

  constructor() {
    super({ key: 'RunnerScene' });
  }

  init() {
    const mockData = MockRunGenerator.generate5kMockRun();
    this.ghostEngine = new GhostEngine(mockData);
  }

  create() {
    // 1. Sky & Sun
    this.sunImage = this.add.image(400, 170, 'retro-sun');
    this.sunImage.setScale(2.5);

    // 2. Parallax Mountain Range (y = 250)
    this.mountainTile = this.add.tileSprite(400, 250, 800, 120, 'mountain-parallax');

    // 3. 80s Magenta Track Floor (y = 390)
    this.gridTile = this.add.tileSprite(400, 390, 800, 120, 'track-grid');

    const groundY = 360;

    // Render Ghost runner (translucent neon magenta)
    this.ghostSprite = this.add.sprite(200, groundY, 'ghost-sprite');
    this.ghostSprite.setScale(2.5);
    this.ghostSprite.setOrigin(0.5, 1);

    // Render Player runner (neon blue)
    this.playerSprite = this.add.sprite(200, groundY, 'player-sprite');
    this.playerSprite.setScale(2.5);
    this.playerSprite.setOrigin(0.5, 1);

    // Dynamic Speed Trail Particle Emitters
    this.createSpeedParticleTrails();
  }

  private playerEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private ghostEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private createSpeedParticleTrails() {
    // Neon Blue trail for Player
    this.playerEmitter = this.add.particles(0, 0, 'player-sprite', {
      speed: { min: 40, max: 100 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 400,
      blendMode: 'ADD',
      frequency: 40
    });
    this.playerEmitter.startFollow(this.playerSprite);

    // Neon Magenta trail for Ghost
    this.ghostEmitter = this.add.particles(0, 0, 'ghost-sprite', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 450,
      blendMode: 'ADD',
      frequency: 50
    });
    this.ghostEmitter.startFollow(this.ghostSprite);
  }

  update(_time: number, delta: number) {
    if (this.gameState === 'COUNTDOWN') {
      const deltaSec = delta / 1000;
      this.countdownTimer += deltaSec;
      if (this.countdownTimer >= 1.0) {
        this.countdownTimer = 0;
        this.countdownValue--;
        if (this.countdownValue > 0) {
          this.countdownText.setText(this.countdownValue.toString());
          import('../audio/SFXEngine').then(({ sfxEngine }) => sfxEngine.playCountdownBeep(false));
        } else if (this.countdownValue === 0) {
          this.countdownText.setText('GO!');
          import('../audio/SFXEngine').then(({ sfxEngine }) => sfxEngine.playCountdownBeep(true));
        } else {
          this.countdownText.setVisible(false);
          this.gameState = 'RUNNING';
        }
      }
      return;
    }

    if (this.gameState !== 'RUNNING') return;

    const deltaSec = delta / 1000;
    this.elapsedTime += deltaSec;

    // Advance Player Distance
    let effectivePlayerSpeed = this.playerSpeedMs;
    
    // Nitro Boost Logic (Pace 15% faster than target for 30 seconds)
    if (this.ghostSpeedMs > 0 && this.playerSpeedMs >= (this.ghostSpeedMs * 1.15)) {
      this.nitroChargeTimer += deltaSec;
      if (this.nitroChargeTimer >= 30 && !this.isNitroActive) {
        this.isNitroActive = true;
        this.nitroActiveTimer = 10; // 10s Nitro Duration
        this.nitroChargeTimer = 0;
        this.playerSprite.setTint(0x00ffff);
        import('../audio/SFXEngine').then(({ sfxEngine }) => sfxEngine.playNitroActivate());
      }
    } else {
      this.nitroChargeTimer = Math.max(0, this.nitroChargeTimer - deltaSec);
    }

    if (this.isNitroActive) {
      this.nitroActiveTimer -= deltaSec;
      effectivePlayerSpeed *= 1.25; // 25% extra speed boost during Nitro
      if (this.nitroActiveTimer <= 0) {
        this.isNitroActive = false;
        this.playerSprite.clearTint();
      }
    }

    this.playerDistanceMeters += effectivePlayerSpeed * deltaSec;

    // Advance Ghost via GhostEngine linear vector interpolation
    const ghostState = this.ghostEngine.getGhostPositionAtTime(this.elapsedTime);
    this.ghostDistanceMeters = ghostState.x;
    this.ghostSpeedMs = ghostState.speed;

    // Parallax scrolling speed logic
    // Ground grid scrolls fast relative to player speed
    this.gridTile.tilePositionX += (this.playerSpeedMs * 25 * deltaSec);
    // Mountains scroll slowly in background (parallax factor 0.2x)
    this.mountainTile.tilePositionX += (this.playerSpeedMs * 4 * deltaSec);

    // Side-scrolling relative position calculation (base reference X = 200)
    const baseX = 200;
    const distanceDelta = this.ghostDistanceMeters - this.playerDistanceMeters; // positive = ghost ahead
    
    // Map distance delta in meters to screen pixel offset (1m = 12px)
    const targetGhostX = Phaser.Math.Clamp(baseX + (distanceDelta * 12), 40, 760);
    
    // Smooth frame-by-frame position interpolation
    this.ghostSprite.x = Phaser.Math.Linear(this.ghostSprite.x, targetGhostX, 0.1);
    this.playerSprite.x = baseX;

    // Running bounce animation effect
    const bounce = Math.abs(Math.sin(this.elapsedTime * 12)) * 6;
    this.playerSprite.y = 360 - bounce;
    this.ghostSprite.y = 360 - (Math.abs(Math.sin(this.elapsedTime * 12)) * 6);

    // Calculate pace metrics
    const playerPaceMinKm = this.playerSpeedMs > 0 ? (1000 / (this.playerSpeedMs * 60)) : 0;
    const ghostPaceMinKm = this.ghostSpeedMs > 0 ? (1000 / (this.ghostSpeedMs * 60)) : 0;
    
    // Pace Delta in sec/km
    const paceDeltaSecKm = (playerPaceMinKm - ghostPaceMinKm) * 60;
    const paceRatio = this.ghostSpeedMs > 0 ? (this.playerSpeedMs / this.ghostSpeedMs) : 1.0;

    if (this.onMetricsUpdateCallback) {
      this.onMetricsUpdateCallback({
        elapsedSeconds: this.elapsedTime,
        playerDistanceKm: this.playerDistanceMeters / 1000,
        playerPaceMinKm,
        ghostPaceMinKm,
        paceDeltaSecKm,
        paceRatio,
        playerSpeedMs: this.playerSpeedMs,
        ghostSpeedMs: this.ghostSpeedMs
      });
    }
  }

  public setGhostEngine(engine: GhostEngine) {
    this.ghostEngine = engine;
    this.elapsedTime = 0;
    this.playerDistanceMeters = 0;
    this.ghostDistanceMeters = 0;
  }

  public setPlayerSpeed(speedMs: number) {
    this.playerSpeedMs = speedMs;
  }

  private gameState: GameState = 'READY';
  private countdownValue: number = 3;
  private countdownTimer: number = 0;
  private countdownText!: Phaser.GameObjects.Text;

  public getGameState(): GameState {
    return this.gameState;
  }

  public startRun() {
    if (this.gameState === 'READY' || this.gameState === 'PAUSED') {
      this.gameState = 'COUNTDOWN';
      this.countdownValue = 3;
      this.countdownTimer = 0;

      if (!this.countdownText) {
        this.countdownText = this.add.text(400, 225, '3', {
          fontFamily: 'monospace',
          fontSize: '72px',
          color: '#00f3ff',
          stroke: '#ff007f',
          strokeThickness: 6
        }).setOrigin(0.5);
      }
      this.countdownText.setVisible(true);
      this.countdownText.setText('3');
      import('../audio/SFXEngine').then(({ sfxEngine }) => sfxEngine.playCountdownBeep(false));
    }
  }

  public pauseRun() {
    this.gameState = 'PAUSED';
    if (this.countdownText) this.countdownText.setVisible(false);
  }

  public resetRun() {
    this.gameState = 'READY';
    this.elapsedTime = 0;
    this.playerDistanceMeters = 0;
    this.ghostDistanceMeters = 0;
    this.nitroChargeTimer = 0;
    this.isNitroActive = false;
    if (this.playerSprite) {
      this.playerSprite.x = 200;
      this.playerSprite.clearTint();
    }
    if (this.ghostSprite) this.ghostSprite.x = 200;
    if (this.countdownText) this.countdownText.setVisible(false);
  }

  public setOnMetricsUpdate(cb: (metrics: MetricsUpdate) => void) {
    this.onMetricsUpdateCallback = cb;
  }
}
