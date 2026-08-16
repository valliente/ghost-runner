export interface HUDConfig {
  showPaceGauge: boolean;
  showMiniMap: boolean;
  showHeartRate: boolean;
  showDeltaSplits: boolean;
  showRadarTrack: boolean;
}

export interface HUDUpdateData {
  distanceMeters: number;
  paceMinKm: number;
  deltaSeconds: number;
  heartRateBpm?: number;
  hrZone?: number;
  cadenceSpm?: number;
  progressFraction?: number;
}

export class HUDOverlay {
  private static readonly STORAGE_KEY = 'ghost_hud_config';
  private containerEl: HTMLElement | null = null;
  private config: HUDConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): HUDConfig {
    try {
      const saved = localStorage.getItem(HUDOverlay.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      showPaceGauge: true,
      showMiniMap: true,
      showHeartRate: true,
      showDeltaSplits: true,
      showRadarTrack: true
    };
  }

  public saveConfig(): void {
    try {
      localStorage.setItem(HUDOverlay.STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save HUD config:', e);
    }
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'cyber-hud-overlay';
    this.containerEl.innerHTML = `
      <!-- TOP BAR WIDGETS -->
      <div class="hud-top-bar" style="display: flex; justify-content: space-between; width: 100%; gap: 8px;">
        <!-- PACE GAUGE WIDGET -->
        <div id="widget-pace-gauge" class="hud-widget" style="display: ${this.config.showPaceGauge ? 'flex' : 'none'};">
          <div class="widget-label">PACE</div>
          <div class="widget-value val-cyan" id="hud-pace-text">--:--</div>
        </div>

        <!-- DELTA SPLIT WIDGET -->
        <div id="widget-delta-splits" class="hud-widget" style="display: ${this.config.showDeltaSplits ? 'flex' : 'none'};">
          <div class="widget-label">GHOST DELTA</div>
          <div class="widget-value val-pink" id="hud-delta-text">0.0s</div>
        </div>

        <!-- HEART RATE WIDGET -->
        <div id="widget-heart-rate" class="hud-widget" style="display: ${this.config.showHeartRate ? 'flex' : 'none'};">
          <div class="widget-label">HEART RATE</div>
          <div class="widget-value" id="hud-hr-text" style="color: #00f3ff;">-- BPM</div>
        </div>
      </div>

      <!-- ROUTE PROGRESS BAR WIDGET -->
      <div id="widget-minimap" class="hud-widget" style="display: ${this.config.showMiniMap ? 'block' : 'none'}; width: 100%; margin-top: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #8b949e; font-family: monospace;">
          <span>0.0 km</span>
          <span id="hud-dist-text" class="val-cyan">0.00 km</span>
          <span id="hud-target-dist">5.0 km</span>
        </div>
        <div style="width: 100%; height: 6px; background: rgba(0, 243, 255, 0.15); border-radius: 3px; overflow: hidden; margin-top: 3px;">
          <div id="hud-progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00f3ff, #ff007f); transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
  }

  public updateMetrics(data: HUDUpdateData): void {
    if (!this.containerEl) return;

    // 1. Pace
    const paceEl = this.containerEl.querySelector('#hud-pace-text');
    if (paceEl) {
      if (data.paceMinKm > 0 && data.paceMinKm < 30) {
        const mins = Math.floor(data.paceMinKm);
        const secs = Math.round((data.paceMinKm - mins) * 60);
        paceEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      } else {
        paceEl.textContent = '--:--';
      }
    }

    // 2. Delta
    const deltaEl = this.containerEl.querySelector('#hud-delta-text');
    if (deltaEl) {
      const absD = Math.abs(data.deltaSeconds);
      const sign = data.deltaSeconds <= 0 ? '-' : '+';
      deltaEl.textContent = `${sign}${absD.toFixed(1)}s`;
      deltaEl.className = `widget-value ${data.deltaSeconds <= 0 ? 'val-cyan' : 'val-pink'}`;
    }

    // 3. Heart Rate
    const hrEl = this.containerEl.querySelector('#hud-hr-text');
    if (hrEl && data.heartRateBpm) {
      hrEl.textContent = `${data.heartRateBpm} BPM`;
      // Color shift based on zone
      const colors = ['#00f3ff', '#00ff66', '#ffee00', '#ff7700', '#ff0033'];
      hrEl.setAttribute('style', `color: ${colors[(data.hrZone || 1) - 1]};`);
    }

    // 4. Distance & Progress
    const distEl = this.containerEl.querySelector('#hud-dist-text');
    const fillEl = this.containerEl.querySelector('#hud-progress-fill') as HTMLElement;
    if (distEl) {
      distEl.textContent = `${(data.distanceMeters / 1000).toFixed(2)} km`;
    }
    if (fillEl && data.progressFraction !== undefined) {
      fillEl.style.width = `${Math.min(100, Math.max(0, data.progressFraction * 100))}%`;
    }
  }

  public toggleWidget(key: keyof HUDConfig): void {
    this.config[key] = !this.config[key];
    this.saveConfig();
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
