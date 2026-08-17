import { DeepLinkService } from '../services/DeepLinkService';

export interface QRCodeModalOptions {
  trackId: string;
  trackName: string;
  distanceKm: number;
  creator: string;
  onClose: () => void;
}

export class QRCodeModal {
  private containerEl: HTMLElement | null = null;
  private options: QRCodeModalOptions;

  constructor(options: QRCodeModalOptions) {
    this.options = options;
  }

  public render(parentEl: HTMLElement): void {
    this.destroy();
    const shareUrl = DeepLinkService.generateShareLink(this.options.trackId);

    this.containerEl = document.createElement('div');
    this.containerEl.className = 'summary-overlay';
    this.containerEl.innerHTML = `
      <div class="summary-card" style="max-width: 480px; text-align: center;">
        <h2 class="summary-title val-cyan">PEER GHOST QR CODE</h2>
        
        <div style="font-size: 0.85rem; color: #8b949e; margin-top: 4px;">
          Scan with a smartphone camera to instantly challenge this track
        </div>

        <!-- TRACK METRICS -->
        <div style="background: #080114; border: 1px solid #330066; border-radius: 6px; padding: 10px; margin: 12px 0;">
          <div class="val-pink" style="font-family: monospace; font-weight: bold; font-size: 1.1rem;">${this.options.trackName}</div>
          <div style="font-size: 0.8rem; color: #8b949e; font-family: monospace; margin-top: 4px;">
            Distance: <span class="val-cyan">${this.options.distanceKm.toFixed(2)} km</span> | Created by: <span class="val-pink">${this.options.creator}</span>
          </div>
        </div>

        <!-- CANVAS RETRO QR MATRIX -->
        <div style="display: flex; justify-content: center; margin: 10px 0;">
          <canvas id="qr-canvas" width="220" height="220" style="border: 2px solid #00f3ff; border-radius: 8px; background: #000; box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);"></canvas>
        </div>

        <!-- LINK COPY INPUT -->
        <div style="display: flex; gap: 6px; margin-top: 10px;">
          <input type="text" id="qr-share-input" readonly value="${shareUrl}" style="flex: 1; background: #0c021f; border: 1px solid #00f3ff; color: #00f3ff; padding: 6px 10px; font-family: monospace; font-size: 0.8rem; border-radius: 4px;" />
          <button id="btn-qr-copy" class="btn btn-sm btn-pink">COPY</button>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <button id="btn-qr-close" class="menu-btn">CLOSE</button>
        </div>
      </div>
    `;

    parentEl.appendChild(this.containerEl);
    this.drawQRMatrix();
    this.bindEvents();
  }

  private drawQRMatrix(): void {
    if (!this.containerEl) return;
    const canvas = this.containerEl.querySelector('#qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 220;
    const cells = 25;
    const cellSize = size / cells;

    ctx.fillStyle = '#050012';
    ctx.fillRect(0, 0, size, size);

    // Generate deterministic pattern based on trackId hash
    let hash = 0;
    for (let i = 0; i < this.options.trackId.length; i++) {
      hash = (hash << 5) - hash + this.options.trackId.charCodeAt(i);
      hash |= 0;
    }

    ctx.fillStyle = '#00f3ff';

    // Draw Corner Position Detection Patterns
    const drawFinderPattern = (startX: number, startY: number) => {
      ctx.fillRect(startX * cellSize, startY * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#050012';
      ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect((startX + 2) * cellSize, (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinderPattern(1, 1);
    drawFinderPattern(cells - 8, 1);
    drawFinderPattern(1, cells - 8);

    // Draw pseudo-random cyber data blocks
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        // Skip corner finder boxes
        if ((r < 9 && c < 9) || (r < 9 && c > cells - 10) || (r > cells - 10 && c < 9)) {
          continue;
        }

        const seed = (r * cells + c + Math.abs(hash)) * 1664525 + 1013904223;
        if ((seed % 100) < 48) {
          ctx.fillStyle = (r + c) % 3 === 0 ? '#ff007f' : '#00f3ff';
          ctx.fillRect(c * cellSize + 0.5, r * cellSize + 0.5, cellSize - 1, cellSize - 1);
        }
      }
    }
  }

  private bindEvents(): void {
    if (!this.containerEl) return;

    const copyBtn = this.containerEl.querySelector('#btn-qr-copy') as HTMLButtonElement;
    const shareInput = this.containerEl.querySelector('#qr-share-input') as HTMLInputElement;
    const closeBtn = this.containerEl.querySelector('#btn-qr-close') as HTMLButtonElement;

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareInput.value);
        copyBtn.textContent = 'COPIED!';
        setTimeout(() => {
          if (copyBtn) copyBtn.textContent = 'COPY';
        }, 2000);
      } catch (e) {
        shareInput.select();
        document.execCommand('copy');
      }
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
