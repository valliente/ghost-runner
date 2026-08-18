export interface SplitMetric {
  splitNumber: number; // 1, 2, 3...
  splitDistanceMeters: number;
  splitTimeSeconds: number;
  splitPaceMinKm: number;
  ghostSplitTimeSeconds?: number;
  deltaSeconds: number; // negative = faster than ghost
  elevationDeltaMeters: number;
  isCompleted: boolean;
}

export class SplitsDrawer {
  private containerEl: HTMLElement | null = null;
  private isOpen: boolean = false;
  private splits: SplitMetric[] = [];
  private currentLiveSplit: Partial<SplitMetric> = {
    splitNumber: 1,
    splitDistanceMeters: 0,
    splitTimeSeconds: 0,
    splitPaceMinKm: 0,
    deltaSeconds: 0,
    isCompleted: false
  };

  public render(parentEl: HTMLElement): void {
    this.destroy();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'splits-drawer-wrapper';
    this.containerEl.innerHTML = `
      <!-- TOGGLE TAB BUTTON -->
      <button id="btn-toggle-splits" class="btn btn-sm btn-pink" style="position: fixed; right: 12px; bottom: 85px; z-index: 100; font-family: monospace; font-size: 0.75rem;">
        ⏱️ SPLITS (<span id="splits-count-badge">0</span>)
      </button>

      <!-- SLIDING PANEL -->
      <div id="splits-drawer-panel" class="summary-card" style="position: fixed; right: 12px; bottom: 125px; width: 340px; max-height: 380px; overflow-y: auto; z-index: 99; display: none; background: rgba(13, 2, 33, 0.95); border: 1px solid #00f3ff; box-shadow: 0 0 15px rgba(0, 243, 255, 0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 243, 255, 0.3); padding-bottom: 6px;">
          <span class="val-cyan" style="font-family: monospace; font-size: 0.85rem; font-weight: bold;">LIVE SPLIT LOG (1KM)</span>
          <span id="drawer-projected-finish" class="val-pink" style="font-family: monospace; font-size: 0.75rem;">EST: --:--</span>
        </div>

        <!-- TABLE -->
        <div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 0.7rem; color: #8b949e; margin-top: 6px; padding: 0 4px;">
          <span>KM</span>
          <span>PACE</span>
          <span>TIME</span>
          <span>DELTA</span>
        </div>

        <div id="splits-list-container" style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
          ${this.renderSplitRows()}
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.containerEl) return;
    const toggleBtn = this.containerEl.querySelector('#btn-toggle-splits');
    const panel = this.containerEl.querySelector('#splits-drawer-panel') as HTMLElement;

    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        this.isOpen = !this.isOpen;
        panel.style.display = this.isOpen ? 'block' : 'none';
        toggleBtn.textContent = this.isOpen ? '✖ CLOSE SPLITS' : `⏱️ SPLITS (${this.splits.length})`;
      });
    }
  }

  public recordSplit(split: SplitMetric): void {
    this.splits.push({ ...split, isCompleted: true });
    this.currentLiveSplit = {
      splitNumber: this.splits.length + 1,
      splitDistanceMeters: 0,
      splitTimeSeconds: 0,
      splitPaceMinKm: 0,
      deltaSeconds: 0,
      isCompleted: false
    };
    this.updateUI();
  }

  public updateLiveSplit(elapsedInSplitSec: number, distanceInSplitM: number, ghostDeltaSec: number, totalRunDistanceM: number, totalRunTimeSec: number): void {
    const paceMinKm = distanceInSplitM > 50 ? (elapsedInSplitSec / 60) / (distanceInSplitM / 1000) : 5.0;
    this.currentLiveSplit = {
      splitNumber: this.splits.length + 1,
      splitDistanceMeters: distanceInSplitM,
      splitTimeSeconds: elapsedInSplitSec,
      splitPaceMinKm: paceMinKm,
      deltaSeconds: ghostDeltaSec,
      isCompleted: false
    };

    // Calculate projected 5km / 10km finish
    if (this.containerEl && totalRunDistanceM > 500) {
      const avgPace = (totalRunTimeSec / 60) / (totalRunDistanceM / 1000);
      const est5kSec = avgPace * 5 * 60;
      const mins = Math.floor(est5kSec / 60);
      const secs = Math.round(est5kSec % 60);
      const estEl = this.containerEl.querySelector('#drawer-projected-finish');
      if (estEl) {
        estEl.textContent = `EST 5K: ${mins}:${secs.toString().padStart(2, '0')}`;
      }
    }

    this.updateUI();
  }

  private updateUI(): void {
    if (!this.containerEl) return;
    const badgeEl = this.containerEl.querySelector('#splits-count-badge');
    if (badgeEl) {
      badgeEl.textContent = this.splits.length.toString();
    }

    const listEl = this.containerEl.querySelector('#splits-list-container');
    if (listEl) {
      listEl.innerHTML = this.renderSplitRows();
    }
  }

  private renderSplitRows(): string {
    const all = [...this.splits];
    if (this.currentLiveSplit && this.currentLiveSplit.splitNumber) {
      all.push(this.currentLiveSplit as SplitMetric);
    }

    if (all.length === 0) {
      return `<div style="text-align: center; color: #8b949e; font-family: monospace; font-size: 0.75rem; padding: 8px;">Run 1km to log first split...</div>`;
    }

    return all.map((s) => {
      const mins = Math.floor(s.splitPaceMinKm || 0);
      const secs = Math.round(((s.splitPaceMinKm || 0) - mins) * 60);
      const paceFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

      const timeMins = Math.floor((s.splitTimeSeconds || 0) / 60);
      const timeSecs = Math.round((s.splitTimeSeconds || 0) % 60);
      const timeFormatted = `${timeMins}:${timeSecs.toString().padStart(2, '0')}`;

      const deltaAbs = Math.abs(s.deltaSeconds || 0).toFixed(1);
      const deltaSign = (s.deltaSeconds || 0) <= 0 ? '-' : '+';
      const deltaColor = (s.deltaSeconds || 0) <= 0 ? '#00f3ff' : '#ff007f';

      return `
        <div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 0.75rem; background: rgba(255, 255, 255, 0.04); padding: 4px 6px; border-radius: 2px; border-left: 2px solid ${s.isCompleted ? '#00f3ff' : '#ffee00'};">
          <span style="color: #f0f6fc; font-weight: bold;">KM ${s.splitNumber}${s.isCompleted ? '' : '*'}</span>
          <span style="color: #00f3ff;">${paceFormatted}</span>
          <span style="color: #8b949e;">${timeFormatted}</span>
          <span style="color: ${deltaColor}; font-weight: bold;">${deltaSign}${deltaAbs}s</span>
        </div>
      `;
    }).join('');
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
