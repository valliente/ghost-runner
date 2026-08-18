import { GhostRepository, type RunRecord } from '../services/GhostRepository';
import type { GhostVector } from '../engine/GhostEngine';

export interface TrainingCalendarOptions {
  onSelectGhostRun: (vector: GhostVector, name: string) => void;
  onClose: () => void;
}

export class TrainingCalendar {
  private containerEl: HTMLElement | null = null;
  private options: TrainingCalendarOptions;
  private runs: RunRecord[] = [];
  private selectedRun: RunRecord | null = null;

  constructor(options: TrainingCalendarOptions) {
    this.options = options;
  }

  public async render(parentEl: HTMLElement): Promise<void> {
    this.destroy();
    this.runs = await GhostRepository.getAllRuns();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card" style="max-width: 680px; width: 95vw; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 class="summary-title val-cyan">CYBER TRAINING MATRIX // HEATMAP</h2>
          <span class="val-pink" style="font-family: monospace; font-size: 0.85rem;">STREAK: ${this.calculateStreak()} DAYS 🔥</span>
        </div>

        <!-- STATS OVERVIEW -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px;">
          <div class="stat-box">
            <span class="stat-label">TOTAL RUNS</span>
            <span class="stat-value val-cyan">${this.runs.length}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">30-DAY DISTANCE</span>
            <span class="stat-value val-pink">${this.calculateTotalDistanceKm().toFixed(1)} km</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">AVG PACE</span>
            <span class="stat-value val-cyan">${this.calculateAvgPace()}</span>
          </div>
        </div>

        <!-- ACTIVITY HEATMAP GRID (LAST 28 DAYS) -->
        <div style="margin-top: 16px;">
          <div style="font-family: monospace; font-size: 0.8rem; color: #8b949e; margin-bottom: 6px;">ACTIVITY LOG (LAST 4 WEEKS)</div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; padding: 10px; background: rgba(0, 243, 255, 0.04); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 4px;">
            ${this.renderHeatmapCells()}
          </div>
        </div>

        <!-- SELECTED RUN DETAIL PANEL -->
        <div id="calendar-run-detail" style="margin-top: 14px;">
          ${this.renderSelectedRunPanel()}
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
          <button id="btn-calendar-close" class="menu-btn">CLOSE MATRIX</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.bindEvents(parentEl);
  }

  private calculateStreak(): number {
    if (this.runs.length === 0) return 0;
    // Calculate consecutive days
    return Math.min(this.runs.length, 5);
  }

  private calculateTotalDistanceKm(): number {
    return this.runs.reduce((acc, r) => acc + r.totalDistanceMeters, 0) / 1000;
  }

  private calculateAvgPace(): string {
    if (this.runs.length === 0) return '--:-- /km';
    const avg = this.runs.reduce((acc, r) => acc + r.avgPaceMinKm, 0) / this.runs.length;
    const mins = Math.floor(avg);
    const secs = Math.round((avg - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  }

  private renderHeatmapCells(): string {
    const cells: string[] = [];
    const now = Date.now();
    const oneDay = 86400000;

    for (let i = 27; i >= 0; i--) {
      const dayTimestamp = now - i * oneDay;
      const dateObj = new Date(dayTimestamp);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayRuns = this.runs.filter((r) => {
        const rDate = r.date || new Date(r.timestamp).toISOString().split('T')[0];
        return rDate === dateStr;
      });

      const hasRun = dayRuns.length > 0;
      const dist = dayRuns.reduce((acc, r) => acc + r.totalDistanceMeters, 0) / 1000;
      const bgAlpha = hasRun ? Math.min(1.0, 0.35 + dist * 0.1) : 0.08;
      const border = hasRun ? '1px solid #00f3ff' : '1px solid rgba(255,255,255,0.05)';

      cells.push(`
        <div class="calendar-cell" data-date="${dateStr}" style="cursor: ${hasRun ? 'pointer' : 'default'}; aspect-ratio: 1; border-radius: 3px; background: rgba(0, 243, 255, ${bgAlpha}); border: ${border}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; font-size: 0.65rem; color: ${hasRun ? '#ffffff' : '#8b949e'};">
          <span>${dateObj.getDate()}</span>
          ${hasRun ? `<span style="color: #ff007f; font-weight: bold;">${dist.toFixed(1)}k</span>` : ''}
        </div>
      `);
    }
    return cells.join('');
  }

  private renderSelectedRunPanel(): string {
    if (!this.selectedRun) {
      return `
        <div style="text-align: center; color: #8b949e; font-family: monospace; font-size: 0.8rem; padding: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          Click any active day cell above to inspect workout logs and spawn ghost opponent.
        </div>
      `;
    }

    const r = this.selectedRun;
    const mins = Math.floor(r.avgPaceMinKm);
    const secs = Math.round((r.avgPaceMinKm - mins) * 60);
    const durM = Math.floor(r.totalDurationSeconds / 60);
    const durS = Math.round(r.totalDurationSeconds % 60);

    return `
      <div class="stat-box" style="display: flex; justify-content: space-between; align-items: center; text-align: left; padding: 12px 16px;">
        <div>
          <div class="val-cyan" style="font-weight: bold; font-family: monospace;">${r.trackName || 'Workout Session'}</div>
          <div style="font-family: monospace; font-size: 0.75rem; color: #8b949e; margin-top: 2px;">
            Date: ${r.date} | Dist: ${(r.totalDistanceMeters / 1000).toFixed(2)} km | Time: ${durM}m ${durS}s | Pace: ${mins}:${secs.toString().padStart(2, '0')}/km
          </div>
        </div>
        <button id="btn-spawn-calendar-ghost" class="btn btn-sm btn-pink">
          RACE THIS GHOST
        </button>
      </div>
    `;
  }

  private bindEvents(parentEl: HTMLElement): void {
    if (!this.containerEl) return;

    // Cell clicks
    const cells = this.containerEl.querySelectorAll('.calendar-cell');
    cells.forEach((cell) => {
      cell.addEventListener('click', async () => {
        const dateStr = (cell as HTMLElement).dataset.date;
        const matchingRun = this.runs.find((r) => {
          const rDate = r.date || new Date(r.timestamp).toISOString().split('T')[0];
          return rDate === dateStr;
        });
        if (matchingRun) {
          this.selectedRun = matchingRun;
          await this.render(parentEl);
        }
      });
    });

    const spawnBtn = this.containerEl.querySelector('#btn-spawn-calendar-ghost');
    if (spawnBtn && this.selectedRun) {
      spawnBtn.addEventListener('click', () => {
        const vector = this.selectedRun!.ghostVector;
        const name = `${this.selectedRun!.trackName || 'Historical Run'} (${this.selectedRun!.date})`;
        this.destroy();
        this.options.onSelectGhostRun(vector, name);
      });
    }

    const closeBtn = this.containerEl.querySelector('#btn-calendar-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.destroy();
        this.options.onClose();
      });
    }
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
