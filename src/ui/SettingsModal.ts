import { StorageService, type UserSettings } from '../services/StorageService';
import { VoiceAnnouncer } from '../audio/VoiceAnnouncer';
import { HapticsEngine } from '../services/HapticsEngine';

export interface SettingsModalOptions {
  onClose: () => void;
  onSettingsChanged?: (settings: UserSettings) => void;
}

export class SettingsModal {
  private containerEl: HTMLElement | null = null;
  private options: SettingsModalOptions;

  constructor(options: SettingsModalOptions) {
    this.options = options;
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();
    const settings = StorageService.getSettings();

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card" style="max-width: 540px; max-height: 88vh; overflow-y: auto;">
        <h2 class="summary-title val-cyan">RETRO SETTINGS & ACCESSIBILITY</h2>
        
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <!-- Colorblind Accessibility Theme -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-family: monospace; font-size: 0.9rem; color: #00f3ff;">Colorblind Palette:</label>
            <select id="setting-theme-select" style="background: #0d0221; color: #ff007f; border: 1px solid #ff007f; padding: 4px 8px; border-radius: 4px; font-family: monospace;">
              <option value="default">Default Cyber Neon</option>
              <option value="deuteranopia">Deuteranopia (Blue / Orange)</option>
              <option value="protanopia">Protanopia (Sky / Crimson)</option>
              <option value="tritanopia">Tritanopia (Teal / Rose)</option>
              <option value="monochrome">High-Contrast Monochrome</option>
            </select>
          </div>

          <!-- Large Text HUD Scale Mode -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <label style="font-family: monospace; font-size: 0.9rem; color: #00f3ff;">Large Text HUD (Sunlight):</label>
              <div style="font-size: 0.7rem; color: #8b949e;">Enlarges HUD metrics for bright outdoor running</div>
            </div>
            <input type="checkbox" id="setting-large-text" style="width: 20px; height: 20px; accent-color: #00f3ff;" />
          </div>

          <!-- CRT Shader Toggle -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-family: monospace; font-size: 0.9rem; color: #00f3ff;">CRT Scanline Shader:</label>
            <input type="checkbox" id="setting-crt" ${settings.enableCRTShader ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #ff007f;" />
          </div>

          <!-- AMOLED Battery Saver Mode -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <label style="font-family: monospace; font-size: 0.9rem; color: #00f3ff;">AMOLED Battery Saver:</label>
              <div style="font-size: 0.7rem; color: #8b949e;">Disables particle effects & deepens black</div>
            </div>
            <input type="checkbox" id="setting-amoled" style="width: 20px; height: 20px; accent-color: #00f3ff;" />
          </div>

          <!-- Audio Voice Volume -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <label style="font-family: monospace; font-size: 0.9rem; color: #00f3ff;">Voice Announcer Volume:</label>
              <span id="voice-vol-text" class="val-pink" style="font-family: monospace;">${Math.round(settings.audioVolume * 100)}%</span>
            </div>
            <input type="range" id="setting-voice-vol" min="0" max="100" value="${Math.round(settings.audioVolume * 100)}" style="accent-color: #ff007f;" />
          </div>

          <!-- Haptics Metronome -->
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-family: monospace; font-size: 0.9rem; color: #00f3ff;">Cadence Vibration Metronome:</label>
            <input type="checkbox" id="setting-haptics" ${settings.enableAudioAlerts ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #00f3ff;" />
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px;">
          <button id="btn-settings-save" class="btn btn-pink">SAVE & APPLY</button>
          <button id="btn-settings-close" class="menu-btn">CLOSE</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.containerEl) return;

    const themeSelect = this.containerEl.querySelector('#setting-theme-select') as HTMLSelectElement;
    const largeTextCheck = this.containerEl.querySelector('#setting-large-text') as HTMLInputElement;
    const crtCheck = this.containerEl.querySelector('#setting-crt') as HTMLInputElement;
    const amoledCheck = this.containerEl.querySelector('#setting-amoled') as HTMLInputElement;
    const voiceVol = this.containerEl.querySelector('#setting-voice-vol') as HTMLInputElement;
    const voiceText = this.containerEl.querySelector('#voice-vol-text') as HTMLSpanElement;
    const hapticsCheck = this.containerEl.querySelector('#setting-haptics') as HTMLInputElement;

    const saveBtn = this.containerEl.querySelector('#btn-settings-save') as HTMLButtonElement;
    const closeBtn = this.containerEl.querySelector('#btn-settings-close') as HTMLButtonElement;

    voiceVol.addEventListener('input', () => {
      voiceText.textContent = `${voiceVol.value}%`;
    });

    saveBtn.addEventListener('click', () => {
      const newSettings: UserSettings = {
        targetPaceMinKm: 4.5,
        audioVolume: parseInt(voiceVol.value, 10) / 100,
        enableCRTShader: crtCheck.checked,
        enableAudioAlerts: hapticsCheck.checked,
        enableNitroBoost: true
      };

      StorageService.saveSettings(newSettings);
      VoiceAnnouncer.setVolume(newSettings.audioVolume);
      HapticsEngine.setEnabled(newSettings.enableAudioAlerts);

      // Apply Colorblind theme class
      document.body.className = '';
      if (themeSelect.value !== 'default') {
        document.body.classList.add(`theme-${themeSelect.value}`);
      }

      // Apply Large Text mode
      if (largeTextCheck.checked) {
        document.body.classList.add('hud-large-text');
      }

      // Apply AMOLED black mode
      if (amoledCheck.checked) {
        document.documentElement.style.setProperty('--bg-color', '#000000');
        document.documentElement.style.setProperty('--panel-bg', '#050505');
      } else {
        document.documentElement.style.setProperty('--bg-color', '#08020f');
        document.documentElement.style.setProperty('--panel-bg', 'rgba(22, 10, 36, 0.92)');
      }

      if (this.options.onSettingsChanged) {
        this.options.onSettingsChanged(newSettings);
      }

      alert('Settings saved and applied!');
      this.destroy();
      this.options.onClose();
    });

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
