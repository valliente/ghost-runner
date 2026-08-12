export type HeartRateCallback = (bpm: number) => void;

export class BluetoothHR {
  private device: any = null;
  private gattServer: any = null;
  private isConnected: boolean = false;
  private callback?: HeartRateCallback;

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
        if (this.callback) {
          this.callback(bpm);
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
