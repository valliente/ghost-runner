export interface FilteredGPSResult {
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
}

export class WorkerBridge {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, { resolve: (res: any) => void; reject: (err: any) => void }> = new Map();
  private requestCounter: number = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      this.worker = new Worker(new URL('../workers/telemetry.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event: MessageEvent) => {
        const { id, success, result, error } = event.data;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          this.pendingRequests.delete(id);
          if (success) {
            pending.resolve(result);
          } else {
            pending.reject(new Error(error));
          }
        }
      };
      this.worker.onerror = (err) => {
        console.warn('WorkerBridge encountered an error, falling back to sync execution:', err);
      };
    } catch (e) {
      console.warn('Web Worker initialization failed, sync fallback active:', e);
      this.worker = null;
    }
  }

  private sendRequest<T>(type: 'FILTER_GPS' | 'CALC_HAVERSINE' | 'SMOOTH_SPEED', payload: any): Promise<T> {
    const id = `req_${++this.requestCounter}_${Date.now()}`;

    if (!this.worker) {
      // Synchronous fallback
      return this.syncFallback<T>(type, payload);
    }

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage({ id, type, payload });
    });
  }

  private syncFallback<T>(type: string, payload: any): Promise<T> {
    if (type === 'CALC_HAVERSINE') {
      const { lat1, lon1, lat2, lon2 } = payload;
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Promise.resolve((R * c) as unknown as T);
    }

    if (type === 'FILTER_GPS') {
      return Promise.resolve({
        latitude: payload.lat,
        longitude: payload.lon,
        speed: payload.speed,
        accuracy: payload.accuracy || 5.0
      } as unknown as T);
    }

    return Promise.resolve(payload as unknown as T);
  }

  public filterGPS(lat: number, lon: number, speed: number, accuracy: number = 5.0): Promise<FilteredGPSResult> {
    return this.sendRequest<FilteredGPSResult>('FILTER_GPS', { lat, lon, speed, accuracy });
  }

  public computeHaversine(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
    return this.sendRequest<number>('CALC_HAVERSINE', { lat1, lon1, lat2, lon2 });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

export const workerBridge = new WorkerBridge();
