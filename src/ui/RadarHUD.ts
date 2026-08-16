import type { GhostEntity } from '../engine/GhostFleetEngine';

export class RadarHUD {
  private containerEl: HTMLElement | null = null;

  public render(parentEl: HTMLElement): void {
    this.destroy();
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'radar-hud-bar';
    this.containerEl.innerHTML = `
      <div class="radar-track">
        <div class="radar-indicator player-indicator" style="left: 50%;">
          <span class="radar-label">YOU</span>
        </div>
        <div id="radar-ghosts-container"></div>
      </div>
    `;
    parentEl.appendChild(this.containerEl);
  }

  public updateRadar(fleet: GhostEntity[]): void {
    if (!this.containerEl) return;
    const container = this.containerEl.querySelector('#radar-ghosts-container');
    if (!container) return;

    // Center is 50% (player). Range is +/- 100 meters
    container.innerHTML = fleet
      .map((ghost) => {
        // -100m -> 0%, 0m -> 50%, +100m -> 100%
        const normalizedPos = Math.min(Math.max((ghost.deltaMeters + 100) / 200, 0.05), 0.95) * 100;
        const deltaLabel = ghost.deltaMeters >= 0 ? `+${ghost.deltaMeters.toFixed(0)}m` : `${ghost.deltaMeters.toFixed(0)}m`;

        return `
          <div class="radar-indicator" style="left: ${normalizedPos}%; background-color: ${ghost.colorHex}; box-shadow: 0 0 8px ${ghost.colorHex};">
            <span class="radar-ghost-tag" style="color: ${ghost.colorHex};">${ghost.name} (${deltaLabel})</span>
          </div>
        `;
      })
      .join('');
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
