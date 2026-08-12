import { StorageService } from '../services/StorageService';
import type { GhostVector, TelemetryPoint } from '../engine/GhostEngine';

export interface RunSummaryData {
  trackName: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  avgPaceMinKm: number;
  timeDeltaSeconds: number; // negative = player ahead
  playerTelemetry: TelemetryPoint[];
  ghostVector: GhostVector;
}

export interface PostRunSummaryOptions {
  data: RunSummaryData;
  onClose: () => void;
  onSaveRun: () => void;
}

export class PostRunSummary {
  private containerEl: HTMLElement | null = null;
  private options: PostRunSummaryOptions;

  constructor(options: PostRunSummaryOptions) {
    this.options = options;
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();
    const data = this.options.data;

    const isVictory = data.timeDeltaSeconds <= 0;
    const resultTitle = isVictory ? 'VICTORY! YOU BEAT THE GHOST' : 'SESSION FINISHED';
    const resultColorClass = isVictory ? 'val-cyan' : 'val-pink';

    const durationStr = this.formatDuration(data.totalDurationSeconds);
    const distKmStr = (data.totalDistanceMeters / 1000).toFixed(2);
    const avgPaceStr = this.formatPace(data.avgPaceMinKm);
    const deltaStr = this.formatDelta(data.timeDeltaSeconds);

    const splits = this.calculateSplits(data.playerTelemetry);

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card">
        <h2 class="summary-title ${resultColorClass}">${resultTitle}</h2>
        <div class="summary-subtitle">${data.trackName}</div>

        <!-- Top Metrics Cards -->
        <div class="summary-stats-grid">
          <div class="stat-box">
            <span class="stat-label">DISTANCE</span>
            <span class="stat-val val-cyan">${distKmStr} km</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">TIME</span>
            <span class="stat-val val-cyan">${durationStr}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">AVG PACE</span>
            <span class="stat-val val-cyan">${avgPaceStr}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">TIME DELTA</span>
            <span class="stat-val ${resultColorClass}">${deltaStr}</span>
          </div>
        </div>

        <!-- SVG Pace Chart -->
        <div class="chart-container">
          <h3>PACE COMPARISON (MIN/KM)</h3>
          ${this.renderSvgChart(data.playerTelemetry, data.ghostVector.points)}
        </div>

        <!-- 1KM Splits Table -->
        <div class="splits-container">
          <h3>1KM SPLITS</h3>
          <table class="splits-table">
            <thead>
              <tr>
                <th>KM</th>
                <th>PLAYER PACE</th>
                <th>SPLIT TIME</th>
              </tr>
            </thead>
            <tbody>
              ${splits.map((s, idx) => `
                <tr>
                  <td>KM ${idx + 1}</td>
                  <td>${this.formatPace(s.paceMinKm)}</td>
                  <td>${this.formatDuration(s.splitDurationSec)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary Action Buttons -->
        <div class="summary-actions">
          <button id="btn-save-summary" class="menu-btn btn-pink">SAVE GHOST TO STORAGE</button>
          <button id="btn-close-summary" class="menu-btn">RETURN TO MENU</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.containerEl) return;

    const saveBtn = this.containerEl.querySelector('#btn-save-summary');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        StorageService.saveRun({
          name: this.options.data.trackName,
          date: new Date().toLocaleDateString(),
          totalDistanceMeters: this.options.data.totalDistanceMeters,
          totalDurationSeconds: this.options.data.totalDurationSeconds,
          avgPaceMinKm: this.options.data.avgPaceMinKm,
          ghostVector: {
            points: this.options.data.playerTelemetry,
            totalDistance: this.options.data.totalDistanceMeters,
            totalDuration: this.options.data.totalDurationSeconds
          }
        });
        alert('Run & Ghost trajectory saved successfully!');
        this.options.onSaveRun();
      });
    }

    const closeBtn = this.containerEl.querySelector('#btn-close-summary');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.options.onClose();
        this.destroy();
      });
    }
  }

  private renderSvgChart(playerPoints: TelemetryPoint[], ghostPoints: TelemetryPoint[]): string {
    if (!playerPoints || playerPoints.length < 2) return `<div class="no-chart">Insufficient data for chart</div>`;

    const width = 500;
    const height = 150;
    const padding = 20;

    const maxDist = Math.max(
      playerPoints[playerPoints.length - 1]?.distance || 1000,
      ghostPoints[ghostPoints.length - 1]?.distance || 1000
    );

    const getX = (dist: number) => padding + (dist / maxDist) * (width - 2 * padding);
    // Pace Y mapping: 2 min/km (top) to 7 min/km (bottom)
    const getY = (pace: number) => {
      const clampedPace = Math.min(Math.max(pace || 4.5, 2.0), 7.0);
      return padding + ((clampedPace - 2.0) / 5.0) * (height - 2 * padding);
    };

    const playerPath = playerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.distance).toFixed(1)} ${getY(p.pace || 4.5).toFixed(1)}`).join(' ');
    const ghostPath = ghostPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.distance).toFixed(1)} ${getY(p.pace || 4.5).toFixed(1)}`).join(' ');

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="svg-pace-chart">
        <!-- Background Grid Lines -->
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="#ff007f" stroke-opacity="0.2" />
        <line x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" stroke="#00f3ff" stroke-opacity="0.2" />
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ff007f" stroke-opacity="0.2" />

        <!-- Ghost Pace Line (Neon Magenta) -->
        <path d="${ghostPath}" fill="none" stroke="#ff007f" stroke-width="2" stroke-dasharray="4,4" />

        <!-- Player Pace Line (Neon Cyan) -->
        <path d="${playerPath}" fill="none" stroke="#00f3ff" stroke-width="3" />
      </svg>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-dot cyan-dot"></span> Player Pace</span>
        <span class="legend-item"><span class="legend-dot pink-dot"></span> Ghost Target</span>
      </div>
    `;
  }

  private calculateSplits(points: TelemetryPoint[]): { splitKm: number; paceMinKm: number; splitDurationSec: number }[] {
    const splits: { splitKm: number; paceMinKm: number; splitDurationSec: number }[] = [];
    if (!points || points.length === 0) return splits;

    let currentSplitKm = 1;
    let lastSplitTime = 0;
    let lastSplitDist = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const distKm = p.distance / 1000;
      if (distKm >= currentSplitKm || i === points.length - 1) {
        const distDeltaMeters = p.distance - lastSplitDist;
        const durationSec = p.timestamp - lastSplitTime;
        if (distDeltaMeters > 100) {
          const speedMs = distDeltaMeters / durationSec;
          const paceMinKm = speedMs > 0 ? (1000 / (speedMs * 60)) : 0;
          splits.push({
            splitKm: currentSplitKm,
            paceMinKm,
            splitDurationSec: durationSec
          });
        }
        currentSplitKm++;
        lastSplitTime = p.timestamp;
        lastSplitDist = p.distance;
      }
    }

    return splits;
  }

  private formatDuration(totalSec: number): string {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private formatPace(paceMinKm: number): string {
    if (!paceMinKm || !isFinite(paceMinKm) || paceMinKm <= 0) return '0:00 /km';
    const mins = Math.floor(paceMinKm);
    const secs = Math.round((paceMinKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  }

  private formatDelta(deltaSec: number): string {
    const absSec = Math.abs(Math.round(deltaSec));
    const mins = Math.floor(absSec / 60);
    const secs = absSec % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    return deltaSec <= 0 ? `-${timeStr} Ahead` : `+${timeStr} Behind`;
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
