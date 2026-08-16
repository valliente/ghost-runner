import type { TelemetryPoint } from '../engine/GhostEngine';

export interface SplitScreenReplayOptions {
  playerPoints: TelemetryPoint[];
  ghostPoints: TelemetryPoint[];
  onClose: () => void;
}

export class SplitScreenReplay {
  private containerEl: HTMLElement | null = null;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;
  private progress: number = 0; // 0 to 1
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  private options: SplitScreenReplayOptions;

  constructor(options: SplitScreenReplayOptions) {
    this.options = options;
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card" style="max-width: 760px;">
        <h2 class="summary-title val-cyan">SPLIT-SCREEN SYNCHRONIZED REPLAY</h2>
        
        <!-- DUAL RUNNER VIEWPORTS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%;">
          <!-- Left: Player View -->
          <div style="background: #080114; border: 1px solid #00f3ff; border-radius: 6px; padding: 10px; text-align: center;">
            <div class="val-cyan" style="font-family: monospace; font-weight: bold;">⚡ YOU (PLAYER)</div>
            <div id="split-player-pace" class="val-cyan" style="font-size: 1.4rem; font-family: monospace; margin-top: 6px;">--:-- /km</div>
            <div id="split-player-dist" style="font-size: 0.8rem; color: #8b949e; font-family: monospace;">0.00 km</div>
          </div>

          <!-- Right: Ghost View -->
          <div style="background: #080114; border: 1px solid #ff007f; border-radius: 6px; padding: 10px; text-align: center;">
            <div class="val-pink" style="font-family: monospace; font-weight: bold;">👻 TARGET GHOST</div>
            <div id="split-ghost-pace" class="val-pink" style="font-size: 1.4rem; font-family: monospace; margin-top: 6px;">--:-- /km</div>
            <div id="split-ghost-dist" style="font-size: 0.8rem; color: #8b949e; font-family: monospace;">0.00 km</div>
          </div>
        </div>

        <!-- TELEMETRY COMPARISON GRAPH CANVAS -->
        <div style="width: 100%; height: 160px; background: #050012; border: 1px solid #330066; border-radius: 6px; margin-top: 10px; position: relative;">
          <canvas id="split-graph-canvas" width="720" height="160" style="width: 100%; height: 100%;"></canvas>
        </div>

        <!-- CONTROLS -->
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
          <button id="btn-split-play" class="btn btn-sm">PLAY</button>
          <button id="btn-split-speed" class="btn btn-sm btn-pink">1X</button>
          <input type="range" id="split-scrubber" min="0" max="1000" value="0" style="flex: 1; accent-color: #00f3ff;" />
          <span id="split-time-label" class="val-cyan" style="font-family: monospace; font-size: 0.85rem; min-width: 80px;">00:00</span>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
          <button id="btn-split-close" class="menu-btn">CLOSE</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.canvas = this.containerEl.querySelector('#split-graph-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.bindEvents();
    this.draw();
  }

  private bindEvents(): void {
    if (!this.containerEl) return;

    const playBtn = this.containerEl.querySelector('#btn-split-play') as HTMLButtonElement;
    const speedBtn = this.containerEl.querySelector('#btn-split-speed') as HTMLButtonElement;
    const scrubber = this.containerEl.querySelector('#split-scrubber') as HTMLInputElement;
    const closeBtn = this.containerEl.querySelector('#btn-split-close') as HTMLButtonElement;

    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playBtn.textContent = this.isPlaying ? 'PAUSE' : 'PLAY';
      if (this.isPlaying) {
        this.lastTime = performance.now();
        this.startLoop();
      }
    });

    speedBtn.addEventListener('click', () => {
      this.playbackSpeed = this.playbackSpeed === 1.0 ? 2.0 : this.playbackSpeed === 2.0 ? 4.0 : 1.0;
      speedBtn.textContent = `${this.playbackSpeed}X`;
    });

    scrubber.addEventListener('input', () => {
      this.progress = parseInt(scrubber.value, 10) / 1000;
      this.draw();
    });

    closeBtn.addEventListener('click', () => {
      this.destroy();
      this.options.onClose();
    });
  }

  private startLoop(): void {
    const loop = (now: number) => {
      if (!this.isPlaying) return;

      const deltaSec = (now - this.lastTime) / 1000;
      this.lastTime = now;

      this.progress += (deltaSec * this.playbackSpeed) / 25; // 25s full run replay
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.isPlaying = false;
        const playBtn = this.containerEl?.querySelector('#btn-split-play') as HTMLButtonElement;
        if (playBtn) playBtn.textContent = 'REPLAY';
      }

      const scrubber = this.containerEl?.querySelector('#split-scrubber') as HTMLInputElement;
      if (scrubber) scrubber.value = Math.round(this.progress * 1000).toString();

      this.draw();

      if (this.isPlaying) {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const padding = 25;

    ctx.clearRect(0, 0, w, h);

    const pPts = this.options.playerPoints;
    const gPts = this.options.ghostPoints;

    // Draw Grid & Axes
    ctx.strokeStyle = '#1e053a';
    ctx.lineWidth = 1;
    for (let y = padding; y < h - padding; y += 25) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }

    const drawCurve = (pts: TelemetryPoint[], color: string) => {
      if (!pts || pts.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = padding + (i / (pts.length - 1)) * (w - 2 * padding);
        // Speed range: 2 to 6 m/s
        const speedClamped = Math.max(2, Math.min(6, p.speed));
        const y = h - padding - ((speedClamped - 2) / 4) * (h - 2 * padding);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    // Draw Player Curve (Cyan) and Ghost Curve (Pink)
    drawCurve(pPts, '#00f3ff');
    drawCurve(gPts, '#ff007f');

    // Scrubber Cursor Line
    const cursorX = padding + this.progress * (w - 2 * padding);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, h);
    ctx.stroke();

    // Update Split-Screen Viewport Text
    const pIdx = Math.min(Math.floor(this.progress * (pPts.length - 1)), pPts.length - 1);
    const gIdx = Math.min(Math.floor(this.progress * (gPts.length - 1)), gPts.length - 1);

    if (pPts[pIdx]) {
      const p = pPts[pIdx];
      const paceEl = this.containerEl?.querySelector('#split-player-pace');
      const distEl = this.containerEl?.querySelector('#split-player-dist');
      if (paceEl) paceEl.textContent = `${Math.floor(p.pace || 4)}:${Math.round(((p.pace || 4) % 1) * 60).toString().padStart(2, '0')} /km`;
      if (distEl) distEl.textContent = `${(p.distance / 1000).toFixed(2)} km`;
    }

    if (gPts[gIdx]) {
      const g = gPts[gIdx];
      const paceEl = this.containerEl?.querySelector('#split-ghost-pace');
      const distEl = this.containerEl?.querySelector('#split-ghost-dist');
      if (paceEl) paceEl.textContent = `${Math.floor(g.pace || 4)}:${Math.round(((g.pace || 4) % 1) * 60).toString().padStart(2, '0')} /km`;
      if (distEl) distEl.textContent = `${(g.distance / 1000).toFixed(2)} km`;
    }
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
