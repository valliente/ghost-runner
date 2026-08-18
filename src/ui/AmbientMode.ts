export interface AmbientDisplayData {
  paceMinKm: number;
  distanceMeters: number;
  durationSeconds: number;
  deltaSeconds: number;
  heartRateBpm?: number;
  cadenceSpm?: number;
}

export class AmbientModeManager {
  private static instance: AmbientModeManager | null = null;
  private isActive: boolean = false;
  private containerEl: HTMLElement | null = null;
  private burnInOffset: number = 0;
  private burnInInterval: any = null;
  private onToggleCallback: ((isActive: boolean) => void) | null = null;

  public static getInstance(): AmbientModeManager {
    if (!AmbientModeManager.instance) {
      AmbientModeManager.instance = new AmbientModeManager();
    }
    return AmbientModeManager.instance;
  }

  public isAmbientActive(): boolean {
    return this.isActive;
  }

  public setToggleCallback(cb: (isActive: boolean) => void): void {
    this.onToggleCallback = cb;
  }

  /**
   * Activates or toggles AMOLED Ambient Mode.
   */
  public toggle(parentEl: HTMLElement): boolean {
    this.isActive = !this.isActive;
    if (this.isActive) {
      this.render(parentEl);
      this.startBurnInProtection();
    } else {
      this.destroy();
      this.stopBurnInProtection();
    }

    if (this.onToggleCallback) {
      this.onToggleCallback(this.isActive);
    }
    return this.isActive;
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();

    this.containerEl = document.createElement('div');
    this.containerEl.id = 'amoled-ambient-overlay';
    this.containerEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #000000;
      color: #ffffff;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 24px 16px;
      box-sizing: border-box;
      font-family: monospace;
      user-select: none;
    `;

    this.containerEl.innerHTML = `
      <!-- TOP STATUS -->
      <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.85rem; color: #888888;">
        <span>AMOLED ECO 15FPS</span>
        <span id="ambient-time">00:00:00</span>
      </div>

      <!-- MASSIVE PACE -->
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 10px;">
        <span style="font-size: 0.9rem; color: #888888; letter-spacing: 2px;">CURRENT PACE</span>
        <span id="ambient-pace" style="font-size: 4.8rem; font-weight: bold; line-height: 1; color: #ffffff;">--:--</span>
        <span style="font-size: 0.9rem; color: #888888;">/KM</span>
      </div>

      <!-- DELTA & DISTANCE SPLITS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; width: 100%; gap: 16px; text-align: center;">
        <div style="border: 1px solid #333333; padding: 12px; border-radius: 6px;">
          <div style="font-size: 0.75rem; color: #888888;">DISTANCE</div>
          <div id="ambient-dist" style="font-size: 2.0rem; font-weight: bold; color: #00f3ff;">0.00 <span style="font-size: 0.9rem;">KM</span></div>
        </div>

        <div style="border: 1px solid #333333; padding: 12px; border-radius: 6px;">
          <div style="font-size: 0.75rem; color: #888888;">GHOST DELTA</div>
          <div id="ambient-delta" style="font-size: 2.0rem; font-weight: bold; color: #ff007f;">0.0s</div>
        </div>
      </div>

      <!-- FOOTER TAP HINT -->
      <div style="font-size: 0.75rem; color: #555555; text-align: center;">
        TAP ANYWHERE TO EXIT AMBIENT MODE
      </div>
    `;

    // Exit on tap
    this.containerEl.addEventListener('click', () => {
      this.toggle(parentEl);
    });

    parentEl.appendChild(this.containerEl);
  }

  public updateMetrics(data: AmbientDisplayData): void {
    if (!this.containerEl || !this.isActive) return;

    // 1. Time
    const hours = Math.floor(data.durationSeconds / 3600);
    const mins = Math.floor((data.durationSeconds % 3600) / 60);
    const secs = Math.floor(data.durationSeconds % 60);
    const timeEl = this.containerEl.querySelector('#ambient-time');
    if (timeEl) {
      timeEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 2. Pace
    const paceEl = this.containerEl.querySelector('#ambient-pace');
    if (paceEl) {
      if (data.paceMinKm > 0 && data.paceMinKm < 30) {
        const pMins = Math.floor(data.paceMinKm);
        const pSecs = Math.round((data.paceMinKm - pMins) * 60);
        paceEl.textContent = `${pMins}:${pSecs.toString().padStart(2, '0')}`;
      } else {
        paceEl.textContent = '--:--';
      }
    }

    // 3. Distance
    const distEl = this.containerEl.querySelector('#ambient-dist');
    if (distEl) {
      distEl.innerHTML = `${(data.distanceMeters / 1000).toFixed(2)} <span style="font-size: 0.9rem;">KM</span>`;
    }

    // 4. Ghost Delta
    const deltaEl = this.containerEl.querySelector<HTMLElement>('#ambient-delta');
    if (deltaEl) {
      const absD = Math.abs(data.deltaSeconds).toFixed(1);
      const sign = data.deltaSeconds <= 0 ? '-' : '+';
      deltaEl.textContent = `${sign}${absD}s`;
      deltaEl.style.color = data.deltaSeconds <= 0 ? '#00f3ff' : '#ff007f';
    }
  }

  private startBurnInProtection(): void {
    this.burnInInterval = setInterval(() => {
      this.burnInOffset = (this.burnInOffset + 1) % 4;
      if (this.containerEl) {
        this.containerEl.style.transform = `translate(${this.burnInOffset}px, ${this.burnInOffset}px)`;
      }
    }, 60000);
  }

  private stopBurnInProtection(): void {
    if (this.burnInInterval) {
      clearInterval(this.burnInInterval);
      this.burnInInterval = null;
    }
  }

  public destroy(): void {
    this.stopBurnInProtection();
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}

export const ambientMode = AmbientModeManager.getInstance();
