import Phaser from 'phaser';

export class CyberCityScene extends Phaser.Scene {
  private skylineGraphics!: Phaser.GameObjects.Graphics;
  private monorailGraphics!: Phaser.GameObjects.Graphics;
  private gridFloorGraphics!: Phaser.GameObjects.Graphics;
  private billboardText!: Phaser.GameObjects.Text;

  private skylineScrollX: number = 0;
  private trainX: number = -200;
  private roadwayScrollX: number = 0;

  constructor() {
    super({ key: 'CyberCityScene' });
  }

  public create(): void {
    // 1. Sky & Far Skyline Layer
    this.skylineGraphics = this.add.graphics();
    this.drawSkyline();

    // 2. Neon Hologram Billboard
    this.billboardText = this.add.text(400, 100, 'GHOST RUNNER // NEO-TOKYO', {
      fontFamily: 'Courier, monospace',
      fontSize: '20px',
      color: '#00f3ff',
      stroke: '#ff007f',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5);

    // 3. Monorail Layer
    this.monorailGraphics = this.add.graphics();
    this.drawMonorailTrack();

    // 4. Foreground Grid Roadway
    this.gridFloorGraphics = this.add.graphics();
    this.drawGridRoadway();
  }

  private drawSkyline(): void {
    this.skylineGraphics.clear();
    const g = this.skylineGraphics;

    // Dark cyberpunk gradient sky
    g.fillGradientStyle(0x050014, 0x050014, 0x220538, 0x220538, 1);
    g.fillRect(0, 0, 800, 300);

    // Far Skyscraper Silhouettes with illuminated neon windows
    g.fillStyle(0x0d031f, 1);
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 70 - this.skylineScrollX) % 840 + 840) % 840 - 40;
      const bw = 50 + (i % 3) * 15;
      const bh = 140 + (i % 4) * 30;
      g.fillRect(bx, 300 - bh, bw, bh);

      // Windows
      g.fillStyle(i % 2 === 0 ? 0x00f3ff : 0xff007f, 0.4);
      for (let wy = 300 - bh + 15; wy < 290; wy += 20) {
        g.fillRect(bx + 8, wy, 6, 8);
        g.fillRect(bx + 20, wy, 6, 8);
      }
      g.fillStyle(0x0d031f, 1);
    }
  }

  private drawMonorailTrack(): void {
    this.monorailGraphics.clear();
    const g = this.monorailGraphics;

    // Monorail Beam at y = 240
    g.fillStyle(0x1a0633, 1);
    g.fillRect(0, 240, 800, 8);
    g.fillStyle(0x00f3ff, 0.6);
    g.fillRect(0, 247, 800, 2);

    // Monorail High-Speed Bullet Train
    g.fillStyle(0xff007f, 1);
    g.fillRoundedRect(this.trainX, 222, 160, 18, 6);
    g.fillStyle(0x00f3ff, 0.9);
    g.fillRect(this.trainX + 120, 226, 30, 8); // Headlight glow
  }

  private drawGridRoadway(): void {
    this.gridFloorGraphics.clear();
    const g = this.gridFloorGraphics;

    // Roadway floor at y = 350 to 500
    g.fillStyle(0x0a0117, 1);
    g.fillRect(0, 350, 800, 150);

    // Cyan Perspective Grid Lines
    g.lineStyle(1, 0x00f3ff, 0.4);
    for (let x = 0; x <= 800; x += 40) {
      g.lineBetween(x, 350, (x - 400) * 1.8 + 400, 500);
    }

    // Horizontal moving grid lines
    const offset = this.roadwayScrollX % 30;
    for (let y = 350 + offset; y <= 500; y += 30) {
      const alpha = (y - 350) / 150;
      g.lineStyle(1, 0xff007f, alpha * 0.7);
      g.lineBetween(0, y, 800, y);
    }
  }

  public updateBackdrop(runnerSpeedMs: number, deltaSec: number): void {
    const scrollDelta = runnerSpeedMs * deltaSec * 60;

    this.skylineScrollX += scrollDelta * 0.15;
    this.roadwayScrollX += scrollDelta * 1.2;

    // Move monorail train across the sky
    this.trainX += 350 * deltaSec;
    if (this.trainX > 900) {
      this.trainX = -250;
    }

    this.drawSkyline();
    this.drawMonorailTrack();
    this.drawGridRoadway();

    // Billboard glow pulse
    const pulse = 0.8 + 0.2 * Math.sin(this.time.now / 300);
    this.billboardText.setAlpha(pulse);
  }

  public setBillboardMessage(msg: string): void {
    if (this.billboardText) {
      this.billboardText.setText(msg);
    }
  }
}
