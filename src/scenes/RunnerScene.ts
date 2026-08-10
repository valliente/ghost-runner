import Phaser from 'phaser';
import { GhostEngine } from '../engine/GhostEngine';
import { GPXParser } from '../services/GPXParser';

export class RunnerScene extends Phaser.Scene {
  private playerSprite!: Phaser.GameObjects.Sprite;
  private ghostSprite!: Phaser.GameObjects.Sprite;
  private bgTile!: Phaser.GameObjects.TileSprite;
  
  private ghostEngine!: GhostEngine;
  private elapsedTime: number = 0;
  private isRunning: boolean = false;
  
  private playerDistance: number = 0;
  private playerSpeed: number = 4.0; // m/s default (~14.4 km/h)
  private ghostDistance: number = 0;
  private ghostSpeed: number = 0;

  private debugText!: Phaser.GameObjects.Text;
  private onPaceUpdateCallback?: (playerSpeed: number, ghostSpeed: number, paceDeltaRatio: number) => void;

  constructor() {
    super({ key: 'RunnerScene' });
  }

  init() {
    const defaultData = GPXParser.generateMockGhostData();
    this.ghostEngine = new GhostEngine(defaultData);
  }

  create() {
    // Parallax background track
    this.bgTile = this.add.tileSprite(400, 225, 800, 450, 'grid_bg');

    const groundY = 350;

    // Render Ghost sprite (translucent neon magenta)
    this.ghostSprite = this.add.sprite(150, groundY, 'ghost_sprite');
    this.ghostSprite.setOrigin(0.5, 1);
    this.ghostSprite.setAlpha(0.85);

    // Render Player sprite (neon blue)
    this.playerSprite = this.add.sprite(150, groundY, 'player_sprite');
    this.playerSprite.setOrigin(0.5, 1);

    // HUD stats display
    this.debugText = this.add.text(16, 16, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#00f3ff',
      backgroundColor: 'rgba(5, 0, 20, 0.85)',
      padding: { x: 10, y: 8 }
    });
  }

  update(_time: number, delta: number) {
    if (!this.isRunning) return;

    const deltaSec = delta / 1000;
    this.elapsedTime += deltaSec;

    // Update Player Distance
    this.playerDistance += this.playerSpeed * deltaSec;

    // Update Ghost via GhostEngine telemetry interpolation
    const ghostState = this.ghostEngine.getGhostPositionAtTime(this.elapsedTime);
    this.ghostDistance = ghostState.x;
    this.ghostSpeed = ghostState.speed;

    // Scroll track background relative to player speed
    this.bgTile.tilePositionX += this.playerSpeed * 20 * deltaSec;

    // Side-scrolling relative position calculation
    const baseX = 200;
    const distanceDelta = this.ghostDistance - this.playerDistance; // positive = ghost ahead
    
    // Map distance delta to pixel offset (1 meter = 15 pixels)
    const ghostXOffset = distanceDelta * 15;
    const targetGhostX = Phaser.Math.Clamp(baseX + ghostXOffset, 50, 750);
    
    // Smooth frame-by-frame interpolation for Ghost sprite
    this.ghostSprite.x = Phaser.Math.Linear(this.ghostSprite.x, targetGhostX, 0.1);
    this.playerSprite.x = baseX;

    // Sub-pixel bounce animation for running legs effect
    const bounce = Math.abs(Math.sin(this.elapsedTime * 12)) * 4;
    this.playerSprite.y = 350 - bounce;
    this.ghostSprite.y = 350 - (Math.abs(Math.sin(this.elapsedTime * 12)) * 4);

    // Calculate Pace Delta Ratio (Player Speed / Ghost Speed)
    const paceDeltaRatio = this.ghostSpeed > 0 ? (this.playerSpeed / this.ghostSpeed) : 1.0;
    if (this.onPaceUpdateCallback) {
      this.onPaceUpdateCallback(this.playerSpeed, this.ghostSpeed, paceDeltaRatio);
    }

    // HUD Text update
    const gapMeters = (this.playerDistance - this.ghostDistance).toFixed(1);
    const gapStatus = parseFloat(gapMeters) >= 0 ? `+${gapMeters}m Ahead` : `${gapMeters}m Behind`;
    this.debugText.setText([
      `TIME: ${this.elapsedTime.toFixed(1)}s`,
      `PLAYER SPEED: ${(this.playerSpeed * 3.6).toFixed(1)} km/h | DIST: ${this.playerDistance.toFixed(1)}m`,
      `GHOST  SPEED: ${(this.ghostSpeed * 3.6).toFixed(1)} km/h | DIST: ${this.ghostDistance.toFixed(1)}m`,
      `STATUS: ${gapStatus}`
    ]);
  }

  public setGhostEngine(engine: GhostEngine) {
    this.ghostEngine = engine;
    this.elapsedTime = 0;
    this.playerDistance = 0;
    this.ghostDistance = 0;
  }

  public setPlayerSpeed(speedMs: number) {
    this.playerSpeed = speedMs;
  }

  public startRun() {
    this.isRunning = true;
  }

  public pauseRun() {
    this.isRunning = false;
  }

  public resetRun() {
    this.isRunning = false;
    this.elapsedTime = 0;
    this.playerDistance = 0;
    this.ghostDistance = 0;
    if (this.playerSprite) this.playerSprite.x = 200;
    if (this.ghostSprite) this.ghostSprite.x = 200;
  }

  public setOnPaceUpdate(cb: (playerSpeed: number, ghostSpeed: number, ratio: number) => void) {
    this.onPaceUpdateCallback = cb;
  }
}
