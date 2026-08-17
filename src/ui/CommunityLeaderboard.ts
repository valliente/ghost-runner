import { CloudGhostService, type CloudGhostRecord } from '../services/CloudGhostService';
import type { GhostVector } from '../engine/GhostEngine';
import { QRCodeModal } from './QRCodeModal';

export interface CommunityLeaderboardOptions {
  onSelectGhost: (vector: GhostVector, name: string) => void;
  onClose: () => void;
}

export class CommunityLeaderboard {
  private containerEl: HTMLElement | null = null;
  private options: CommunityLeaderboardOptions;
  private selectedFilter: string = 'all';

  constructor(options: CommunityLeaderboardOptions) {
    this.options = options;
  }

  public async render(parentEl: HTMLElement): Promise<void> {
    this.destroy();
    const ghosts = await CloudGhostService.fetchCommunityGhosts();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card" style="max-width: 720px; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 class="summary-title val-cyan">GLOBAL GHOST NETWORK // COMMUNITY TRACKS</h2>
          <span class="val-pink" style="font-family: monospace; font-size: 0.85rem;">${ghosts.length} TRACKS ONLINE</span>
        </div>

        <!-- FILTER TABS -->
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button class="btn btn-sm ${this.selectedFilter === 'all' ? 'btn-pink' : ''} filter-tab" data-filter="all">ALL TRACKS</button>
          <button class="btn btn-sm ${this.selectedFilter === '5k' ? 'btn-pink' : ''} filter-tab" data-filter="5k">5K SPRINTS</button>
          <button class="btn btn-sm ${this.selectedFilter === '10k' ? 'btn-pink' : ''} filter-tab" data-filter="10k">10K ENDURANCE</button>
          <button class="btn btn-sm ${this.selectedFilter === 'climb' ? 'btn-pink' : ''} filter-tab" data-filter="climb">HILL CLIMBS</button>
        </div>

        <!-- TRACK LIST -->
        <div id="community-track-list" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
          ${this.renderTrackRows(ghosts)}
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
          <button id="btn-leaderboard-close" class="menu-btn">CLOSE</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.bindEvents(parentEl);
  }

  private renderTrackRows(records: CloudGhostRecord[]): string {
    const filtered = this.selectedFilter === 'all'
      ? records
      : records.filter((r) => r.tags.includes(this.selectedFilter));

    if (filtered.length === 0) {
      return `<div style="text-align: center; color: #8b949e; padding: 20px; font-family: monospace;">No community tracks found for this category.</div>`;
    }

    return filtered.map((item, idx) => {
      const paceMin = Math.floor(item.avgPaceMinKm);
      const paceSec = Math.round((item.avgPaceMinKm - paceMin) * 60);
      const paceFormatted = `${paceMin}:${paceSec.toString().padStart(2, '0')} /km`;

      return `
        <div class="stat-box" style="display: flex; justify-content: space-between; align-items: center; text-align: left; padding: 10px 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="val-pink" style="font-family: monospace; font-size: 1.1rem; font-weight: bold; min-width: 28px;">#${idx + 1}</span>
            <div>
              <div class="val-cyan" style="font-weight: bold; font-family: monospace; font-size: 0.95rem;">${item.name}</div>
              <div style="font-size: 0.75rem; color: #8b949e; font-family: monospace; margin-top: 2px;">
                Runner: <span style="color: #f0f6fc;">${item.creator}</span> | Dist: <span class="val-pink">${(item.distanceMeters / 1000).toFixed(1)} km</span> | Pace: <span class="val-cyan">${paceFormatted}</span> | Elev: +${item.elevationGain}m
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-sm btn-qr-share" data-id="${item.id}" data-name="${item.name}" data-dist="${item.distanceMeters / 1000}" data-creator="${item.creator}">
              QR CODE
            </button>
            <button class="btn btn-sm btn-pink btn-race-ghost" data-id="${item.id}" data-name="${item.name}">
              RACE GHOST
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  private bindEvents(parentEl: HTMLElement): void {
    if (!this.containerEl) return;

    // Filter tab buttons
    const filterTabs = this.containerEl.querySelectorAll('.filter-tab');
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', async () => {
        this.selectedFilter = (tab as HTMLElement).dataset.filter || 'all';
        await this.render(parentEl);
      });
    });

    // Race Ghost Buttons
    const raceBtns = this.containerEl.querySelectorAll('.btn-race-ghost');
    raceBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        const name = (btn as HTMLElement).dataset.name || 'Cloud Ghost';
        if (id) {
          const vector = await CloudGhostService.downloadGhost(id);
          this.destroy();
          this.options.onSelectGhost(vector, name);
        }
      });
    });

    // QR Share Buttons
    const qrBtns = this.containerEl.querySelectorAll('.btn-qr-share');
    qrBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn as HTMLElement;
        const qrModal = new QRCodeModal({
          trackId: target.dataset.id || '',
          trackName: target.dataset.name || '',
          distanceKm: parseFloat(target.dataset.dist || '5.0'),
          creator: target.dataset.creator || 'Runner',
          onClose: () => {
            // return to leaderboard
          }
        });
        qrModal.render(parentEl);
      });
    });

    const closeBtn = this.containerEl.querySelector('#btn-leaderboard-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.destroy();
      this.options.onClose();
    });
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
