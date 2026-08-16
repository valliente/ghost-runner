import { StorageService } from '../services/StorageService';
import type { SavedRun } from '../services/StorageService';
import { MockRunGenerator } from '../services/MockRunGenerator';
import { GPXParserService } from '../services/GPXParserService';
import type { GhostVector } from '../engine/GhostEngine';
import { AIPacer, type PacingStrategy } from '../engine/AIPacer';

export interface MainMenuOptions {
  onSelectGhost: (vector: GhostVector, trackName: string) => void;
  onStartFreeRun: () => void;
}

export class MainMenu {
  private containerEl: HTMLElement | null = null;
  private options: MainMenuOptions;

  constructor(options: MainMenuOptions) {
    this.options = options;
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'main-menu-overlay';
    this.containerEl.innerHTML = `
      <div class="main-menu-card" style="max-height: 88vh; overflow-y: auto;">
        <h2 class="menu-title">SELECT TRACK / AI PACER</h2>
        
        <!-- AI PACER BOTS SECTION -->
        <div class="menu-section" style="border: 1px solid #ff007f; padding: 12px; border-radius: 8px; background: rgba(255, 0, 127, 0.06);">
          <h3 class="val-pink" style="margin-top: 0;">⚡ AI PACER BOT (v1.102)</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <label style="font-family: monospace; font-size: 0.85rem; color: #00f3ff; min-width: 70px;">Strategy:</label>
              <select id="pacer-strategy-select" style="background: #0d0221; color: #ff007f; border: 1px solid #ff007f; padding: 4px 8px; border-radius: 4px; font-family: monospace; flex: 1;">
                <option value="negative_split">Negative Split (Ramp Finish)</option>
                <option value="surge_recover">Surge & Recover (Tactical Attacks)</option>
                <option value="constant_cadence">Constant Cadence (Metronomic)</option>
              </select>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <label style="font-family: monospace; font-size: 0.85rem; color: #00f3ff; min-width: 70px;">Distance:</label>
              <select id="pacer-distance-select" style="background: #0d0221; color: #00f3ff; border: 1px solid #00f3ff; padding: 4px 8px; border-radius: 4px; font-family: monospace; flex: 1;">
                <option value="3000">3.0 KM Arcade Sprint</option>
                <option value="5000" selected>5.0 KM Circuit</option>
                <option value="10000">10.0 KM Neon Highway</option>
              </select>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <label style="font-family: monospace; font-size: 0.85rem; color: #00f3ff; min-width: 70px;">Target Pace:</label>
              <input type="text" id="pacer-pace-input" value="4:15" placeholder="4:15" style="background: #0d0221; color: #ffd700; border: 1px solid #ffd700; padding: 4px 8px; border-radius: 4px; font-family: monospace; width: 80px;" />
              <span style="font-size: 0.8rem; color: #8b949e;">min/km</span>
              <button id="btn-start-ai-pacer" class="btn btn-sm btn-pink" style="margin-left: auto;">RACE AI BOT</button>
            </div>
            <div id="pacer-desc" style="font-size: 0.75rem; color: #8b949e; font-style: italic;">
              Starts 5% conservative, progressively ramps +10% faster to crush the finish line.
            </div>
          </div>
        </div>

        <div class="menu-section" style="margin-top: 14px;">
          <h3>PREDEFINED SYNTHWAVE TRACKS</h3>
          <div class="track-list">
            <button class="menu-btn track-btn" data-track="5k">
              <span class="track-name">5K Synthwave Circuit</span>
              <span class="track-meta">5.0 km | Target: 4:10 /km</span>
            </button>
            <button class="menu-btn track-btn" data-track="10k">
              <span class="track-name">10K Neon Highway</span>
              <span class="track-meta">10.0 km | Target: 4:30 /km</span>
            </button>
            <button class="menu-btn track-btn" data-track="3k">
              <span class="track-name">3K Arcade Sprint</span>
              <span class="track-meta">3.0 km | Target: 3:45 /km</span>
            </button>
          </div>
        </div>

        <div class="menu-section">
          <h3>SAVED RUN HISTORY & GHOSTS</h3>
          <div id="saved-ghosts-list" class="ghosts-list">
            <!-- Populated dynamically -->
          </div>
        </div>

        <div class="menu-section menu-actions">
          <label class="menu-btn btn-pink" style="cursor:pointer;">
            LOAD CUSTOM GPX FILE
            <input type="file" id="menu-gpx-input" accept=".gpx" style="display:none;" />
          </label>
          <button id="btn-free-run" class="menu-btn">START FREE RUN</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.bindEvents();
    this.renderSavedGhosts();
  }

  private bindEvents(): void {
    if (!this.containerEl) return;

    // AI Pacer Strategy description sync
    const strategySelect = this.containerEl.querySelector('#pacer-strategy-select') as HTMLSelectElement;
    const descEl = this.containerEl.querySelector('#pacer-desc') as HTMLElement;
    if (strategySelect && descEl) {
      strategySelect.addEventListener('change', () => {
        descEl.textContent = AIPacer.getStrategyDescription(strategySelect.value as PacingStrategy);
      });
    }

    // AI Pacer Race Button
    const aiBtn = this.containerEl.querySelector('#btn-start-ai-pacer') as HTMLButtonElement;
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        const strategy = (this.containerEl?.querySelector('#pacer-strategy-select') as HTMLSelectElement).value as PacingStrategy;
        const distMeters = parseInt((this.containerEl?.querySelector('#pacer-distance-select') as HTMLSelectElement).value, 10);
        const paceStr = (this.containerEl?.querySelector('#pacer-pace-input') as HTMLInputElement).value || '4:15';

        const parts = paceStr.split(':');
        const mins = parseFloat(parts[0]) || 4;
        const secs = parseFloat(parts[1]) || 15;
        const targetPace = mins + secs / 60;

        const vector = AIPacer.generatePacerVector({
          name: `AI Pacer (${strategy})`,
          strategy,
          targetPaceMinKm: targetPace,
          totalDistanceMeters: distMeters
        });

        this.options.onSelectGhost(vector, `AI Bot [${strategy.replace('_', ' ').toUpperCase()}]`);
        this.destroy();
      });
    }

    // Track Selection Buttons
    const trackBtns = this.containerEl.querySelectorAll('.track-btn');
    trackBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const trackType = target.getAttribute('data-track');
        if (trackType === '5k') {
          const vector = MockRunGenerator.generate5kMockRun();
          this.options.onSelectGhost(vector, '5K Synthwave Circuit');
        } else if (trackType === '10k') {
          const vector = this.generate10kTrack();
          this.options.onSelectGhost(vector, '10K Neon Highway');
        } else if (trackType === '3k') {
          const vector = this.generate3kSprint();
          this.options.onSelectGhost(vector, '3K Arcade Sprint');
        }
        this.destroy();
      });
    });

    // Multi-Format File Loader (.gpx, .fit, .xml)
    const fileInput = this.containerEl.querySelector('#menu-gpx-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.accept = '.gpx,.fit,.xml';
      fileInput.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          const file = target.files[0];
          const ext = file.name.split('.').pop()?.toLowerCase();

          try {
            if (ext === 'fit') {
              const buffer = await file.arrayBuffer();
              const { FITParserService } = await import('../services/FITParserService');
              const vector = FITParserService.parseFIT(buffer);
              this.options.onSelectGhost(vector, file.name);
              this.destroy();
            } else if (ext === 'xml') {
              const text = await file.text();
              const { HealthKitParser } = await import('../services/HealthKitParser');
              const vector = HealthKitParser.parseHealthXML(text);
              this.options.onSelectGhost(vector, file.name);
              this.destroy();
            } else {
              const text = await file.text();
              const vector = GPXParserService.parseGPX(text);
              this.options.onSelectGhost(vector, file.name);
              this.destroy();
            }
          } catch (err: any) {
            alert(`Error parsing workout file (${file.name}): ${err?.message || err}`);
          }
        }
      });
    }

    // Free Run Button
    const freeRunBtn = this.containerEl.querySelector('#btn-free-run');
    if (freeRunBtn) {
      freeRunBtn.addEventListener('click', () => {
        this.options.onStartFreeRun();
        this.destroy();
      });
    }
  }

  private renderSavedGhosts(): void {
    if (!this.containerEl) return;
    const listEl = this.containerEl.querySelector('#saved-ghosts-list');
    if (!listEl) return;

    const runs = StorageService.getSavedRuns();
    if (runs.length === 0) {
      listEl.innerHTML = `<div class="no-data-msg">No saved ghosts yet. Complete a run to save history!</div>`;
      return;
    }

    listEl.innerHTML = runs.map((run: SavedRun) => `
      <div class="saved-run-item" data-id="${run.id}">
        <div class="run-info">
          <span class="run-name">${run.name}</span>
          <span class="run-meta">${(run.totalDistanceMeters / 1000).toFixed(2)} km | ${run.avgPaceMinKm.toFixed(2)} /km | ${run.date}</span>
        </div>
        <button class="btn btn-sm btn-select-saved" data-id="${run.id}">RACE GHOST</button>
      </div>
    `).join('');

    const selectBtns = listEl.querySelectorAll('.btn-select-saved');
    selectBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const found = runs.find(r => r.id === id);
        if (found) {
          this.options.onSelectGhost(found.ghostVector, found.name);
          this.destroy();
        }
      });
    });
  }

  private generate10kTrack(): GhostVector {
    const points = [];
    let dist = 0;
    for (let t = 0; t <= 2700; t += 5) {
      const speed = 3.7 + Math.sin(t / 40) * 0.5;
      dist += speed * 5;
      points.push({ timestamp: t, latitude: 37.77, longitude: -122.41, speed, distance: dist });
    }
    return { points, totalDistance: dist, totalDuration: 2700 };
  }

  private generate3kSprint(): GhostVector {
    const points = [];
    let dist = 0;
    for (let t = 0; t <= 675; t += 3) {
      const speed = 4.4 + Math.cos(t / 20) * 0.6;
      dist += speed * 3;
      points.push({ timestamp: t, latitude: 37.77, longitude: -122.41, speed, distance: dist });
    }
    return { points, totalDistance: dist, totalDuration: 675 };
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
