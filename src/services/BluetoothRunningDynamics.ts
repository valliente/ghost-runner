export interface RunningDynamicsData {
  speedMs: number;
  cadenceSpm: number;
  strideLengthMeters?: number;
  totalDistanceMeters?: number;
  isRunning: boolean;
}

export class BluetoothRunningDynamics {
  private static readonly RSC_SERVICE_UUID = 0x1814;
  private static readonly RSC_MEASUREMENT_UUID = 0x2A53;

  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private listeners: ((data: RunningDynamicsData) => void)[] = [];

  public async connect(): Promise<boolean> {
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (!nav || !nav.bluetooth) {
      console.warn('Web Bluetooth API is not supported on this platform.');
      return false;
    }

    try {
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ services: [BluetoothRunningDynamics.RSC_SERVICE_UUID] }],
        optionalServices: ['battery_service']
      });

      if (!this.device || !this.device.gatt) return false;

      this.device.addEventListener('gattserverdisconnected', () => {
        console.warn('Bluetooth Foot Pod disconnected.');
        this.server = null;
        this.characteristic = null;
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(BluetoothRunningDynamics.RSC_SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(BluetoothRunningDynamics.RSC_MEASUREMENT_UUID);

      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const target = event.target;
        if (target && target.value) {
          const metrics = this.parseRSCData(target.value);
          this.notifyListeners(metrics);
        }
      });

      return true;
    } catch (e) {
      console.warn('Bluetooth Foot Pod connection error:', e);
      return false;
    }
  }

  public parseRSCData(dataView: DataView): RunningDynamicsData {
    const flags = dataView.getUint8(0);
    const strideLengthPresent = (flags & 0x01) !== 0;
    const totalDistancePresent = (flags & 0x02) !== 0;
    const isRunning = (flags & 0x04) !== 0;

    // Instantaneous Speed: 1/256 meters per second
    const rawSpeed = dataView.getUint16(1, true);
    const speedMs = parseFloat((rawSpeed / 256).toFixed(2));

    // Instantaneous Cadence: SPM (steps per minute)
    const cadenceSpm = dataView.getUint8(3);

    let offset = 4;
    let strideLengthMeters: number | undefined = undefined;
    if (strideLengthPresent && dataView.byteLength >= offset + 2) {
      const strideCm = dataView.getUint16(offset, true);
      strideLengthMeters = parseFloat((strideCm / 100).toFixed(2));
      offset += 2;
    }

    let totalDistanceMeters: number | undefined = undefined;
    if (totalDistancePresent && dataView.byteLength >= offset + 4) {
      const rawDist = dataView.getUint32(offset, true);
      totalDistanceMeters = parseFloat((rawDist / 10).toFixed(1));
    }

    return {
      speedMs,
      cadenceSpm,
      strideLengthMeters,
      totalDistanceMeters,
      isRunning
    };
  }

  public onMetrics(callback: (data: RunningDynamicsData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(data: RunningDynamicsData): void {
    this.listeners.forEach((l) => l(data));
  }

  public disconnect(): void {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.server = null;
    this.characteristic = null;
  }

  public isConnected(): boolean {
    return !!(this.server && this.server.connected);
  }
}

export const bluetoothFootPod = new BluetoothRunningDynamics();
