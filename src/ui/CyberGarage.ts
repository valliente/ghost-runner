import { ProgressionSystem } from '../engine/ProgressionSystem';

export interface CosmeticItem {
  id: string;
  name: string;
  type: 'avatar' | 'trail';
  description: string;
  requiredLevel: number;
  colorHex: string;
}

export interface GarageLoadout {
  selectedAvatarId: string;
  selectedTrailId: string;
}

export class CyberGarage {
  private static readonly STORAGE_KEY = 'ghost_garage_loadout';
  private containerEl: HTMLElement | null = null;
  private onClose: () => void;

  public static readonly AVATARS: CosmeticItem[] = [
    { id: 'avatar_shinobi', name: 'Cyber Shinobi', type: 'avatar', description: 'Agile runner with neon visor & plasma katana', requiredLevel: 1, colorHex: '#00f3ff' },
    { id: 'avatar_valkyrie', name: 'Synth Valkyrie', type: 'avatar', description: 'High-speed armored racer with wing boosters', requiredLevel: 3, colorHex: '#ff007f' },
    { id: 'avatar_mech', name: 'Retro Mech', type: 'avatar', description: 'Heavy chrome chassis with titanium shocks', requiredLevel: 5, colorHex: '#ffee00' },
    { id: 'avatar_panther', name: 'Neon Panther', type: 'avatar', description: 'Holographic cyber beast built for pure velocity', requiredLevel: 10, colorHex: '#a000ff' }
  ];

  public static readonly TRAILS: CosmeticItem[] = [
    { id: 'trail_cyan_grid', name: 'Cyan Grid Trail', type: 'trail', description: 'Classic 80s neon perspective laser tracks', requiredLevel: 1, colorHex: '#00f3ff' },
    { id: 'trail_plasma_fire', name: 'Plasma Flame', type: 'trail', description: 'Blazing pink exhaust flames bursting from sneakers', requiredLevel: 2, colorHex: '#ff007f' },
    { id: 'trail_matrix_code', name: 'Matrix Glyphs', type: 'trail', description: 'Falling green digital rain left behind every stride', requiredLevel: 4, colorHex: '#00ff66' },
    { id: 'trail_hyper_rainbow', name: 'Hyper Strobe', type: 'trail', description: 'Ultra-rare chromatic prism beam for max overdrive', requiredLevel: 8, colorHex: '#ffd700' }
  ];

  constructor(options: { onClose: () => void }) {
    this.onClose = options.onClose;
  }

  public static getLoadout(): GarageLoadout {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      selectedAvatarId: 'avatar_shinobi',
      selectedTrailId: 'trail_cyan_grid'
    };
  }

  public static saveLoadout(loadout: GarageLoadout): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(loadout));
    } catch (e) {
      console.warn('Failed to save garage loadout:', e);
    }
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();
    const profile = ProgressionSystem.getProfile();
    const loadout = CyberGarage.getLoadout();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card" style="max-width: 650px; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 class="summary-title val-cyan">CYBER GARAGE // RUNNER CUSTOMIZATION</h2>
          <span class="val-pink" style="font-family: monospace; font-size: 0.9rem; font-weight: bold;">LEVEL ${profile.level}</span>
        </div>

        <!-- AVATAR SELECTION SECTION -->
        <div style="margin-top: 10px;">
          <div class="val-cyan" style="font-family: monospace; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">RUNNER AVATARS</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            ${CyberGarage.AVATARS.map((av) => {
              const unlocked = profile.level >= av.requiredLevel;
              const isEquipped = loadout.selectedAvatarId === av.id;
              return `
                <div class="stat-box" style="border-color: ${isEquipped ? '#ff007f' : unlocked ? av.colorHex : '#444'}; text-align: left; position: relative;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${av.colorHex}; font-weight: bold; font-family: monospace;">${av.name}</span>
                    ${isEquipped ? '<span style="color: #ff007f; font-size: 0.7rem; font-weight: bold;">[EQUIPPED]</span>' : ''}
                  </div>
                  <div style="font-size: 0.7rem; color: #8b949e; margin: 4px 0;">${av.description}</div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                    <span style="font-size: 0.65rem; color: ${unlocked ? '#00ff66' : '#ff4444'}; font-family: monospace;">
                      ${unlocked ? 'UNLOCKED' : `REQ. LVL ${av.requiredLevel}`}
                    </span>
                    ${unlocked && !isEquipped ? `<button class="btn btn-sm btn-equip-avatar" data-id="${av.id}">EQUIP</button>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- TRAIL SELECTION SECTION -->
        <div style="margin-top: 14px;">
          <div class="val-pink" style="font-family: monospace; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">SPEED PARTICLE TRAILS</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            ${CyberGarage.TRAILS.map((tr) => {
              const unlocked = profile.level >= tr.requiredLevel;
              const isEquipped = loadout.selectedTrailId === tr.id;
              return `
                <div class="stat-box" style="border-color: ${isEquipped ? '#00f3ff' : unlocked ? tr.colorHex : '#444'}; text-align: left;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${tr.colorHex}; font-weight: bold; font-family: monospace;">${tr.name}</span>
                    ${isEquipped ? '<span style="color: #00f3ff; font-size: 0.7rem; font-weight: bold;">[EQUIPPED]</span>' : ''}
                  </div>
                  <div style="font-size: 0.7rem; color: #8b949e; margin: 4px 0;">${tr.description}</div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                    <span style="font-size: 0.65rem; color: ${unlocked ? '#00ff66' : '#ff4444'}; font-family: monospace;">
                      ${unlocked ? 'UNLOCKED' : `REQ. LVL ${tr.requiredLevel}`}
                    </span>
                    ${unlocked && !isEquipped ? `<button class="btn btn-sm btn-pink btn-equip-trail" data-id="${tr.id}">EQUIP</button>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
          <button id="btn-garage-close" class="menu-btn">CLOSE</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.bindEvents(parentEl);
  }

  private bindEvents(parentEl: HTMLElement): void {
    if (!this.containerEl) return;

    // Equip Avatar Buttons
    const avatarBtns = this.containerEl.querySelectorAll('.btn-equip-avatar');
    avatarBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
          const loadout = CyberGarage.getLoadout();
          loadout.selectedAvatarId = id;
          CyberGarage.saveLoadout(loadout);
          this.render(parentEl);
        }
      });
    });

    // Equip Trail Buttons
    const trailBtns = this.containerEl.querySelectorAll('.btn-equip-trail');
    trailBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) {
          const loadout = CyberGarage.getLoadout();
          loadout.selectedTrailId = id;
          CyberGarage.saveLoadout(loadout);
          this.render(parentEl);
        }
      });
    });

    const closeBtn = this.containerEl.querySelector('#btn-garage-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.destroy();
      this.onClose();
    });
  }

  public destroy(): void {
    if (this.containerEl && this.containerEl.parentNode) {
      this.containerEl.parentNode.removeChild(this.containerEl);
      this.containerEl = null;
    }
  }
}
