export type HeartRateCallback = (bpm: number, zoneState: HeartRateZoneState) => void;

export interface HeartRateZoneState {
  bpm: number;
  maxHr: number;
  percentage: number;
  zone: 1 | 2 | 3 | 4 | 5;
  zoneName: string;
  colorHex: string;
}

export class BluetoothHR {
  private device: any = null;
  private gattServer: any = null;
  private isConnected: boolean = false;
  private callback?: HeartRateCallback;
  private maxHr: number = 190; // Default max HR estimate

  public setMaxHr(maxHr: number): void {
    this.maxHr = Math.max(100, Math.min(230, maxHr));
  }

  public async connect(onHeartRate: HeartRateCallback): Promise<void> {
    this.callback = onHeartRate;

    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API is not supported in this browser.');
    }

    try {
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        this.isConnected = false;
        console.warn('Bluetooth HR Monitor disconnected.');
      });

      this.gattServer = await this.device.gatt.connect();
      const service = await this.gattServer.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value: DataView = event.target.value;
        const bpm = this.parseHeartRate(value);
        const zoneState = this.calculateZone(bpm, this.maxHr);

        if (this.callback) {
          this.callback(bpm, zoneState);
        }
      });

      this.isConnected = true;
    } catch (err: any) {
      console.error('Bluetooth HR connection error:', err);
      throw err;
    }
  }

  public disconnect(): void {
    if (this.gattServer && this.gattServer.connected) {
      this.gattServer.disconnect();
    }
    this.isConnected = false;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public calculateZone(bpm: number, maxHr: number = this.maxHr): HeartRateZoneState {
    const percentage = Math.round((bpm / maxHr) * 100);

    let zone: 1 | 2 | 3 | 4 | 5 = 1;
    let zoneName = 'Recovery';
    let colorHex = '#00f3ff'; // Zone 1 Cyan/Blue

    if (percentage < 60) {
      zone = 1;
      zoneName = 'Zone 1: Active Recovery';
      colorHex = '#00f3ff';
    } else if (percentage < 70) {
      zone = 2;
      zoneName = 'Zone 2: Aerobic Base';
      colorHex = '#00ff66'; // Green
    } else if (percentage < 80) {
      zone = 3;
      zoneName = 'Zone 3: Tempo';
      colorHex = '#ffee00'; // Yellow
    } else if (percentage < 90) {
      zone = 4;
      zoneName = 'Zone 4: Threshold';
      colorHex = '#ff7700'; // Orange
    } else {
      zone = 5;
      zoneName = 'Zone 5: Anaerobic Max';
      colorHex = '#ff0033'; // Strobe Red
    }

    return {
      bpm,
      maxHr,
      percentage,
      zone,
      zoneName,
      colorHex
    };
  }

  /**
   * Applies pulsing neon border glow on the game canvas based on active HR zone.
   */
  public static applyVisualBorderGlow(canvasEl: HTMLElement | null, zoneState: HeartRateZoneState): void {
    if (!canvasEl) return;
    canvasEl.style.borderColor = zoneState.colorHex;
    canvasEl.style.boxShadow = `0 0 25px ${zoneState.colorHex}, inset 0 0 15px ${zoneState.colorHex}`;
  }

  private parseHeartRate(data: DataView): number {
    const flags = data.getUint8(0);
    const rate16Bits = (flags & 0x1) !== 0;
    if (rate16Bits) {
      return data.getUint16(1, true);
    } else {
      return data.getUint8(1);
    }
  }
}
