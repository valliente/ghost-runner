import type { TelemetryPoint } from '../engine/GhostEngine';

export interface RouteReplayOptions {
  playerPoints: TelemetryPoint[];
  ghostPoints: TelemetryPoint[];
  onClose: () => void;
}

export class RouteReplayMap {
  private containerEl: HTMLElement | null = null;
  private mapCanvas!: HTMLCanvasElement;
  private mapCtx!: CanvasRenderingContext2D;
  private eleCanvas!: HTMLCanvasElement;
  private eleCtx!: CanvasRenderingContext2D;

  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;
  private currentProgress: number = 0; // 0 to 1
  private animFrameId: number | null = null;
  private lastFrameTime: number = 0;

  private options: RouteReplayOptions;

  constructor(options: RouteReplayOptions) {
    this.options = options;
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card" style="max-width: 720px;">
        <h2 class="summary-title val-cyan">GPS ROUTE REPLAY & ELEVATION</h2>
        
        <!-- Top-Down 2D Map Canvas -->
        <div style="width: 100%; height: 260px; background: #050014; border: 1px solid #00f3ff; border-radius: 6px; position: relative;">
          <canvas id="route-map-canvas" width="680" height="260" style="width: 100%; height: 100%;"></canvas>
        </div>

        <!-- Elevation Profile Canvas -->
        <div style="width: 100%; height: 100px; background: #0d0221; border: 1px solid #ff007f; border-radius: 6px; margin-top: 8px;">
          <canvas id="route-ele-canvas" width="680" height="100" style="width: 100%; height: 100%;"></canvas>
        </div>

        <!-- Playback Controls -->
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 10px;">
          <button id="btn-replay-play" class="btn btn-sm">PLAY</button>
          <button id="btn-replay-speed" class="btn btn-sm btn-pink">1X</button>
          <input type="range" id="replay-scrubber" min="0" max="1000" value="0" style="flex: 1; accent-color: #00f3ff;" />
          <span id="replay-metric-text" class="val-cyan" style="font-family: monospace; font-size: 0.85rem; min-width: 90px;">0.00 km</span>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
          <button id="btn-replay-close" class="menu-btn">CLOSE</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);

    this.mapCanvas = this.containerEl.querySelector('#route-map-canvas') as HTMLCanvasElement;
    this.mapCtx = this.mapCanvas.getContext('2d')!;
    this.eleCanvas = this.containerEl.querySelector('#route-ele-canvas') as HTMLCanvasElement;
    this.eleCtx = this.eleCanvas.getContext('2d')!;

    this.bindEvents();
    this.drawStaticFrames();
  }

  private bindEvents(): void {
    if (!this.containerEl) return;

    const playBtn = this.containerEl.querySelector('#btn-replay-play') as HTMLButtonElement;
    const speedBtn = this.containerEl.querySelector('#btn-replay-speed') as HTMLButtonElement;
    const scrubber = this.containerEl.querySelector('#replay-scrubber') as HTMLInputElement;
    const closeBtn = this.containerEl.querySelector('#btn-replay-close') as HTMLButtonElement;

    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playBtn.textContent = this.isPlaying ? 'PAUSE' : 'PLAY';
      if (this.isPlaying) {
        this.lastFrameTime = performance.now();
        this.startAnimationLoop();
      }
    });

    speedBtn.addEventListener('click', () => {
      this.playbackSpeed = this.playbackSpeed === 1.0 ? 2.0 : this.playbackSpeed === 2.0 ? 4.0 : 1.0;
      speedBtn.textContent = `${this.playbackSpeed}X`;
    });

    scrubber.addEventListener('input', () => {
      this.currentProgress = parseInt(scrubber.value, 10) / 1000;
      this.drawStaticFrames();
    });

    closeBtn.addEventListener('click', () => {
      this.destroy();
      this.options.onClose();
    });
  }

  private startAnimationLoop(): void {
    const loop = (now: number) => {
      if (!this.isPlaying) return;

      const deltaSec = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;

      // Advance progress (total run replay duration = 30 seconds at 1x)
      this.currentProgress += (deltaSec * this.playbackSpeed) / 30;
      if (this.currentProgress >= 1.0) {
        this.currentProgress = 1.0;
        this.isPlaying = false;
        const playBtn = this.containerEl?.querySelector('#btn-replay-play') as HTMLButtonElement;
        if (playBtn) playBtn.textContent = 'REPLAY';
      }

      const scrubber = this.containerEl?.querySelector('#replay-scrubber') as HTMLInputElement;
      if (scrubber) scrubber.value = Math.round(this.currentProgress * 1000).toString();

      this.drawStaticFrames();

      if (this.isPlaying) {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private drawStaticFrames(): void {
    this.drawMap();
    this.drawElevation();
  }

  private drawMap(): void {
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;
    const padding = 30;

    ctx.clearRect(0, 0, w, h);

    const pts = this.options.playerPoints;
    if (!pts || pts.length < 2) return;

    // Determine bounding box
    let minLat = pts[0].latitude, maxLat = pts[0].latitude;
    let minLon = pts[0].longitude, maxLon = pts[0].longitude;

    pts.forEach((p) => {
      minLat = Math.min(minLat, p.latitude);
      maxLat = Math.max(maxLat, p.latitude);
      minLon = Math.min(minLon, p.longitude);
      maxLon = Math.max(maxLon, p.longitude);
    });

    const latSpan = maxLat - minLat || 0.001;
    const lonSpan = maxLon - minLon || 0.001;

    const mapX = (lon: number) => padding + ((lon - minLon) / lonSpan) * (w - 2 * padding);
    const mapY = (lat: number) => h - padding - ((lat - minLat) / latSpan) * (h - 2 * padding);

    // 1. Draw Player Path (Neon Cyan)
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = mapX(p.longitude);
      const y = mapY(p.latitude);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 2. Draw Active Position Dot for Player
    const playerIdx = Math.min(Math.floor(this.currentProgress * (pts.length - 1)), pts.length - 1);
    const curP = pts[playerIdx];
    if (curP) {
      const px = mapX(curP.longitude);
      const py = mapY(curP.latitude);

      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const metricText = this.containerEl?.querySelector('#replay-metric-text');
      if (metricText) {
        metricText.textContent = `${(curP.distance / 1000).toFixed(2)} km`;
      }
    }
  }

  private drawElevation(): void {
    const ctx = this.eleCtx;
    const w = this.eleCanvas.width;
    const h = this.eleCanvas.height;
    const padding = 20;

    ctx.clearRect(0, 0, w, h);

    const pts = this.options.playerPoints;
    if (!pts || pts.length < 2) return;

    let minEle = pts[0].elevation || 0;
    let maxEle = pts[0].elevation || 0;
    pts.forEach((p) => {
      const e = p.elevation || 0;
      minEle = Math.min(minEle, e);
      maxEle = Math.max(maxEle, e);
    });
    const eleSpan = maxEle - minEle || 10;

    const maxDist = pts[pts.length - 1].distance || 1000;
    const getX = (dist: number) => padding + (dist / maxDist) * (w - 2 * padding);
    const getY = (ele: number) => h - padding - (((ele || 0) - minEle) / eleSpan) * (h - 2 * padding);

    // Fill gradient
    ctx.fillStyle = 'rgba(255, 0, 127, 0.2)';
    ctx.beginPath();
    ctx.moveTo(getX(pts[0].distance), h);
    pts.forEach((p) => ctx.lineTo(getX(p.distance), getY(p.elevation || 0)));
    ctx.lineTo(getX(pts[pts.length - 1].distance), h);
    ctx.closePath();
    ctx.fill();

    // Elevation Ridge
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = getX(p.distance);
      const y = getY(p.elevation || 0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Scrubber Cursor
    const cursorX = padding + this.currentProgress * (w - 2 * padding);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, h);
    ctx.stroke();
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isPlaying = false;
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
