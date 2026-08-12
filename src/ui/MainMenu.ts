import { StorageService } from '../services/StorageService';
import type { SavedRun } from '../services/StorageService';
import { MockRunGenerator } from '../services/MockRunGenerator';
import { GPXParserService } from '../services/GPXParserService';
import type { GhostVector } from '../engine/GhostEngine';

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
      <div class="main-menu-card">
        <h2 class="menu-title">SELECT TRACK / GHOST</h2>
        
        <div class="menu-section">
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

    // Custom GPX Loader
    const gpxInput = this.containerEl.querySelector('#menu-gpx-input') as HTMLInputElement;
    if (gpxInput) {
      gpxInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const xmlText = evt.target?.result as string;
            if (xmlText) {
              try {
                const vector = GPXParserService.parseGPX(xmlText);
                this.options.onSelectGhost(vector, target.files![0].name);
                this.destroy();
              } catch (err: any) {
                alert(`Error loading GPX: ${err?.message || err}`);
              }
            }
          };
          reader.readAsText(target.files[0]);
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
