import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Generate procedural retro synthwave pixel-art textures for Player and Ghost
    this.createPlayerTexture();
    this.createGhostTexture();
    this.createBackgroundGridTexture();
  }

  create() {
    this.scene.start('RunnerScene');
  }

  private createPlayerTexture() {
    const canvas = this.textures.createCanvas('player_sprite', 32, 48);
    if (!canvas) return;
    const ctx = canvas.context;

    // Glowing Neon Blue Player (#00f3ff)
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    
    // Head
    ctx.beginPath();
    ctx.arc(16, 10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Body & Limbs (cyberpunk runner silhouette)
    ctx.fillRect(12, 18, 8, 16);
    ctx.fillRect(8, 20, 4, 10);
    ctx.fillRect(20, 24, 4, 10);
    ctx.fillRect(10, 34, 5, 12);
    ctx.fillRect(17, 34, 5, 12);

    canvas.refresh();
  }

  private createGhostTexture() {
    const canvas = this.textures.createCanvas('ghost_sprite', 32, 48);
    if (!canvas) return;
    const ctx = canvas.context;

    // Translucent Neon Magenta Ghost (#ff007f)
    ctx.fillStyle = 'rgba(255, 0, 127, 0.75)';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 15;

    // Head
    ctx.beginPath();
    ctx.arc(16, 10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Body & Limbs
    ctx.fillRect(12, 18, 8, 16);
    ctx.fillRect(8, 24, 4, 10);
    ctx.fillRect(20, 20, 4, 10);
    ctx.fillRect(10, 34, 5, 12);
    ctx.fillRect(17, 34, 5, 12);

    canvas.refresh();
  }

  private createBackgroundGridTexture() {
    const canvas = this.textures.createCanvas('grid_bg', 800, 450);
    if (!canvas) return;
    const ctx = canvas.context;

    // Dark synthwave gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, '#0d0221');
    grad.addColorStop(0.6, '#260847');
    grad.addColorStop(1, '#050014');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    // Neon horizon line
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(800, 300);
    ctx.stroke();

    // Grid lines on track
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 300);
      ctx.lineTo(x - 60, 450);
      ctx.stroke();
    }
    for (let y = 300; y <= 450; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    canvas.refresh();
  }
}
