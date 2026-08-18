export type HUDThemeType = 'cyberpunk_2088' | 'outrun_sunset' | 'matrix_monolith';

export interface HUDConfig {
  showPaceGauge: boolean;
  showMiniMap: boolean;
  showHeartRate: boolean;
  showDeltaSplits: boolean;
  showRadarTrack: boolean;
  theme: HUDThemeType;
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

export interface ThemeStyles {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  fontFamily: string;
}

export class HUDOverlay {
  private static readonly STORAGE_KEY = 'ghost_hud_config';
  private static memoryConfig: HUDConfig | null = null;
  private containerEl: HTMLElement | null = null;
  private config: HUDConfig;

  public static readonly THEMES: Record<HUDThemeType, ThemeStyles> = {
    cyberpunk_2088: {
      primaryColor: '#00f3ff',
      accentColor: '#ff007f',
      backgroundColor: 'rgba(13, 2, 33, 0.85)',
      borderColor: 'rgba(0, 243, 255, 0.3)',
      fontFamily: "'Courier New', Courier, monospace"
    },
    outrun_sunset: {
      primaryColor: '#ffbb00',
      accentColor: '#ff0055',
      backgroundColor: 'rgba(35, 5, 40, 0.88)',
      borderColor: 'rgba(255, 187, 0, 0.35)',
      fontFamily: "'Courier New', Courier, monospace"
    },
    matrix_monolith: {
      primaryColor: '#00ff66',
      accentColor: '#00aa33',
      backgroundColor: 'rgba(0, 20, 5, 0.9)',
      borderColor: 'rgba(0, 255, 102, 0.35)',
      fontFamily: "'Courier New', Courier, monospace"
    }
  };

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): HUDConfig {
    if (HUDOverlay.memoryConfig) return HUDOverlay.memoryConfig;

    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(HUDOverlay.STORAGE_KEY);
        if (saved) {
          HUDOverlay.memoryConfig = JSON.parse(saved);
          return HUDOverlay.memoryConfig!;
        }
      } catch (e) {
        // fallback
      }
    }
    HUDOverlay.memoryConfig = {
      showPaceGauge: true,
      showMiniMap: true,
      showHeartRate: true,
      showDeltaSplits: true,
      showRadarTrack: true,
      theme: 'cyberpunk_2088'
    };
    return HUDOverlay.memoryConfig;
  }

  public saveConfig(): void {
    HUDOverlay.memoryConfig = this.config;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(HUDOverlay.STORAGE_KEY, JSON.stringify(this.config));
      } catch (e) {
        console.warn('Failed to save HUD config:', e);
      }
    }
  }

  public setTheme(theme: HUDThemeType): void {
    this.config.theme = theme;
    this.saveConfig();
    this.applyTheme();
  }

  public getTheme(): HUDThemeType {
    return this.config.theme;
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
          <div class="widget-value" id="hud-hr-text">-- BPM</div>
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
    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.containerEl) return;
    const styles = HUDOverlay.THEMES[this.config.theme] || HUDOverlay.THEMES.cyberpunk_2088;

    const widgets = this.containerEl.querySelectorAll<HTMLElement>('.hud-widget');
    widgets.forEach((w) => {
      w.style.backgroundColor = styles.backgroundColor;
      w.style.borderColor = styles.borderColor;
      w.style.fontFamily = styles.fontFamily;
    });

    const fillEl = this.containerEl.querySelector<HTMLElement>('#hud-progress-fill');
    if (fillEl) {
      fillEl.style.background = `linear-gradient(90deg, ${styles.primaryColor}, ${styles.accentColor})`;
    }
  }

  public updateMetrics(data: HUDUpdateData): void {
    if (!this.containerEl) return;
    const styles = HUDOverlay.THEMES[this.config.theme] || HUDOverlay.THEMES.cyberpunk_2088;

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
      paceEl.setAttribute('style', `color: ${styles.primaryColor};`);
    }

    // 2. Delta
    const deltaEl = this.containerEl.querySelector('#hud-delta-text');
    if (deltaEl) {
      const absD = Math.abs(data.deltaSeconds);
      const sign = data.deltaSeconds <= 0 ? '-' : '+';
      deltaEl.textContent = `${sign}${absD.toFixed(1)}s`;
      deltaEl.setAttribute('style', `color: ${data.deltaSeconds <= 0 ? styles.primaryColor : styles.accentColor};`);
    }

    // 3. Heart Rate
    const hrEl = this.containerEl.querySelector('#hud-hr-text');
    if (hrEl && data.heartRateBpm) {
      hrEl.textContent = `${data.heartRateBpm} BPM`;
      const colors = [styles.primaryColor, '#00ff66', '#ffee00', '#ff7700', '#ff0033'];
      hrEl.setAttribute('style', `color: ${colors[(data.hrZone || 1) - 1]};`);
    }

    // 4. Distance & Progress
    const distEl = this.containerEl.querySelector('#hud-dist-text');
    const fillEl = this.containerEl.querySelector('#hud-progress-fill') as HTMLElement;
    if (distEl) {
      distEl.textContent = `${(data.distanceMeters / 1000).toFixed(2)} km`;
      distEl.setAttribute('style', `color: ${styles.primaryColor};`);
    }
    if (fillEl && data.progressFraction !== undefined) {
      fillEl.style.width = `${Math.min(100, Math.max(0, data.progressFraction * 100))}%`;
    }
  }

  public toggleWidget(key: keyof HUDConfig): void {
    if (key === 'theme') return;
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
