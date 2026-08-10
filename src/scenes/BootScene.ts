import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Programmatically generate pixel-art textures using scene.make.graphics() and generateTexture()
    this.createPlayerSprite();
    this.createGhostSprite();
    this.createTrackGridTexture();
    this.createRetroSunTexture();
    this.createMountainParallaxTexture();
  }

  create() {
    this.scene.start('RunnerScene');
  }

  private createPlayerSprite() {
    const g = this.make.graphics({ x: 0, y: 0 });
    
    // Neon blue (#00f3ff) 16x16 2D runner sprite
    g.fillStyle(0x00f3ff, 1);
    
    // Head
    g.fillRect(6, 1, 4, 4);
    // Torso
    g.fillRect(5, 5, 6, 6);
    // Arms
    g.fillRect(3, 6, 2, 4);
    g.fillRect(11, 7, 2, 4);
    // Legs
    g.fillRect(4, 11, 3, 5);
    g.fillRect(9, 11, 3, 5);

    g.generateTexture('player-sprite', 16, 16);
    g.destroy();
  }

  private createGhostSprite() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Translucent neon magenta (#ff007f) 16x16 2D runner sprite
    g.fillStyle(0xff007f, 0.85);

    // Head
    g.fillRect(6, 1, 4, 4);
    // Torso
    g.fillRect(5, 5, 6, 6);
    // Arms
    g.fillRect(3, 7, 2, 4);
    g.fillRect(11, 6, 2, 4);
    // Legs
    g.fillRect(4, 11, 3, 5);
    g.fillRect(9, 11, 3, 5);

    // Glowing trail dots behind ghost
    g.fillStyle(0xff007f, 0.4);
    g.fillRect(1, 4, 2, 2);
    g.fillRect(0, 9, 2, 2);

    g.generateTexture('ghost-sprite', 16, 16);
    g.destroy();
  }

  private createTrackGridTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // 80s style neon magenta ground grid texture (64x64)
    g.fillStyle(0x090118, 1);
    g.fillRect(0, 0, 64, 64);

    // Grid lines (#ff007f)
    g.lineStyle(2, 0xff007f, 0.8);
    g.strokeRect(0, 0, 64, 64);

    // Perspective accents (#00f3ff)
    g.lineStyle(1, 0x00f3ff, 0.3);
    g.lineBetween(0, 64, 64, 0);

    g.generateTexture('track-grid', 64, 64);
    g.destroy();
  }

  private createRetroSunTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Glowing pixel-art synthwave sun (64x64)
    const radius = 28;
    const centerX = 32;
    const centerY = 32;

    for (let y = 4; y < 60; y++) {
      const dy = y - centerY;
      const dx = Math.floor(Math.sqrt(Math.max(0, radius * radius - dy * dy)));
      if (dx > 0) {
        // Cut scanline horizontal gaps near the bottom of sun
        if (y > 36 && (y % 4 < 2)) {
          continue;
        }
        const ratio = (y - 4) / 56;
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          new Phaser.Display.Color(255, 221, 0),
          new Phaser.Display.Color(255, 0, 127),
          100,
          Math.floor(ratio * 100)
        );
        const hex = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
        g.fillStyle(hex, 1);
        g.fillRect(centerX - dx, y, dx * 2, 1);
      }
    }

    g.generateTexture('retro-sun', 64, 64);
    g.destroy();
  }

  private createMountainParallaxTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Dark purple pixelated mountain outline (400x120)
    g.fillStyle(0x1c0b38, 1);
    g.beginPath();
    g.moveTo(0, 120);
    g.lineTo(0, 80);
    g.lineTo(40, 40);
    g.lineTo(90, 95);
    g.lineTo(140, 30);
    g.lineTo(200, 85);
    g.lineTo(260, 20);
    g.lineTo(330, 90);
    g.lineTo(400, 50);
    g.lineTo(400, 120);
    g.closePath();
    g.fillPath();

    // Neon mountain peak ridge line
    g.lineStyle(2, 0xa100ff, 0.8);
    g.beginPath();
    g.moveTo(0, 80);
    g.lineTo(40, 40);
    g.lineTo(90, 95);
    g.lineTo(140, 30);
    g.lineTo(200, 85);
    g.lineTo(260, 20);
    g.lineTo(330, 90);
    g.lineTo(400, 50);
    g.strokePath();

    g.generateTexture('mountain-parallax', 400, 120);
    g.destroy();
  }
}
