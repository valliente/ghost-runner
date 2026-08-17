import type { TelemetryPoint } from '../engine/GhostEngine';

export class IsometricMinimap {
  private graphics: Phaser.GameObjects.Graphics;
  private width: number;
  private height: number;
  private offsetX: number;
  private offsetY: number;

  constructor(scene: Phaser.Scene, x: number = 650, y: number = 40, width: number = 140, height: number = 90) {
    this.graphics = scene.add.graphics();
    this.offsetX = x;
    this.offsetY = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Transforms 3D route coordinates (distance, elevation, lateral) to 2D isometric screen projection.
   */
  private projectIso(distFraction: number, elevationMeters: number, lateral: number = 0): { x: number; y: number } {
    const angleRad = Math.PI / 6; // 30 degrees isometric angle
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    const nx = distFraction * this.width - this.width / 2;
    const nz = lateral * 20;
    const ny = -(elevationMeters * 0.6);

    const screenX = this.offsetX + this.width / 2 + (nx - nz) * cosAngle;
    const screenY = this.offsetY + this.height / 2 + (nx + nz) * sinAngle + ny;

    return { x: screenX, y: screenY };
  }

  public render(points: TelemetryPoint[], playerDistMeters: number, ghostDistMeters: number): void {
    this.graphics.clear();
    const g = this.graphics;

    if (!points || points.length < 2) return;
    const totalDist = points[points.length - 1].distance || 5000;

    // Background Isometric Panel Frame
    g.fillStyle(0x050012, 0.85);
    g.fillRoundedRect(this.offsetX - 10, this.offsetY - 10, this.width + 20, this.height + 20, 6);
    g.lineStyle(1, 0x00f3ff, 0.4);
    g.strokeRoundedRect(this.offsetX - 10, this.offsetY - 10, this.width + 20, this.height + 20, 6);

    // 1. Draw 3D Isometric Wireframe Ribbon
    g.lineStyle(1.5, 0x330066, 0.7);
    for (let i = 0; i < points.length - 1; i += 4) {
      const p1 = points[i];
      const p2 = points[Math.min(i + 4, points.length - 1)];

      const f1 = p1.distance / totalDist;
      const f2 = p2.distance / totalDist;

      const elev1 = p1.elevation || 10;
      const elev2 = p2.elevation || 10;

      const top1 = this.projectIso(f1, elev1, -0.5);
      const top2 = this.projectIso(f2, elev2, -0.5);
      const bot1 = this.projectIso(f1, elev1, 0.5);
      const bot2 = this.projectIso(f2, elev2, 0.5);

      // Top ribbon line
      g.lineStyle(1.5, 0x00f3ff, 0.6);
      g.lineBetween(top1.x, top1.y, top2.x, top2.y);

      // Bottom ribbon line
      g.lineStyle(1, 0xff007f, 0.3);
      g.lineBetween(bot1.x, bot1.y, bot2.x, bot2.y);

      // Cross grid struts
      g.lineStyle(0.5, 0x00f3ff, 0.2);
      g.lineBetween(top1.x, top1.y, bot1.x, bot1.y);
    }

    // 2. Draw Player Isometric Node (Cyan Beacon)
    const pFrac = Math.min(1.0, Math.max(0, playerDistMeters / totalDist));
    const pIdx = Math.min(Math.floor(pFrac * (points.length - 1)), points.length - 1);
    const pElev = points[pIdx]?.elevation || 10;
    const pIso = this.projectIso(pFrac, pElev, 0);

    g.fillStyle(0x00f3ff, 1);
    g.fillCircle(pIso.x, pIso.y, 4);
    g.lineStyle(1, 0xffffff, 0.9);
    g.strokeCircle(pIso.x, pIso.y, 6);

    // 3. Draw Ghost Isometric Node (Pink Beacon)
    const gFrac = Math.min(1.0, Math.max(0, ghostDistMeters / totalDist));
    const gIdx = Math.min(Math.floor(gFrac * (points.length - 1)), points.length - 1);
    const gElev = points[gIdx]?.elevation || 10;
    const gIso = this.projectIso(gFrac, gElev, 0);

    g.fillStyle(0xff007f, 0.9);
    g.fillCircle(gIso.x, gIso.y, 3.5);
    g.lineStyle(1, 0xff007f, 0.7);
    g.strokeCircle(gIso.x, gIso.y, 5);
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}
