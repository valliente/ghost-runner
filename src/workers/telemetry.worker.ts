/**
 * Dedicated Web Worker for offloading GPS Kalman matrix filtering,
 * Haversine geodetic distance calculations, and heavy telemetry processing.
 */

interface WorkerRequest {
  id: string;
  type: 'FILTER_GPS' | 'CALC_HAVERSINE' | 'SMOOTH_SPEED';
  payload: any;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

// 1D Kalman state
class WorkerKalman1D {
  private q: number;
  private r: number;
  private x: number;
  private p: number = 1.0;

  constructor(processNoise = 0.05, measurementNoise = 0.8, initialValue = 0) {
    this.q = processNoise;
    this.r = measurementNoise;
    this.x = initialValue;
  }

  public update(measurement: number): number {
    this.p = this.p + this.q;
    const k = this.p / (this.p + this.r);
    this.x = this.x + k * (measurement - this.x);
    this.p = (1 - k) * this.p;
    return this.x;
  }
}

const latFilter = new WorkerKalman1D(0.00001, 0.0001);
const lonFilter = new WorkerKalman1D(0.00001, 0.0001);
const speedFilter = new WorkerKalman1D(0.1, 0.5);

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'FILTER_GPS': {
        const { lat, lon, speed, accuracy } = payload;
        const smoothedLat = latFilter.update(lat);
        const smoothedLon = lonFilter.update(lon);
        const smoothedSpeed = Math.max(0, speedFilter.update(speed));

        const response: WorkerResponse = {
          id,
          success: true,
          result: {
            latitude: smoothedLat,
            longitude: smoothedLon,
            speed: smoothedSpeed,
            accuracy: accuracy || 5.0
          }
        };
        self.postMessage(response);
        break;
      }

      case 'CALC_HAVERSINE': {
        const { lat1, lon1, lat2, lon2 } = payload;
        const dist = haversine(lat1, lon1, lat2, lon2);
        self.postMessage({ id, success: true, result: dist });
        break;
      }

      case 'SMOOTH_SPEED': {
        const { rawSpeed } = payload;
        const smoothed = speedFilter.update(rawSpeed);
        self.postMessage({ id, success: true, result: smoothed });
        break;
      }

      default:
        self.postMessage({ id, success: false, error: `Unknown worker action: ${type}` });
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || String(err) });
  }
};
