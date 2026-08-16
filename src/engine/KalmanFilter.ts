/**
 * 1D Kalman Filter for scalar tracking (e.g. speed, elevation, accuracy).
 */
export class KalmanFilter1D {
  private q: number; // Process noise covariance
  private r: number; // Measurement noise covariance
  private x: number; // Value estimate
  private p: number; // Estimation error covariance
  private k: number; // Kalman gain

  constructor(processNoise: number = 0.05, measurementNoise: number = 0.8, initialValue: number = 0) {
    this.q = processNoise;
    this.r = measurementNoise;
    this.x = initialValue;
    this.p = 1.0;
    this.k = 0;
  }

  public update(measurement: number): number {
    // Prediction update
    this.p = this.p + this.q;

    // Measurement update
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;

    return this.x;
  }

  public getValue(): number {
    return this.x;
  }

  public reset(initialValue: number = 0): void {
    this.x = initialValue;
    this.p = 1.0;
    this.k = 0;
  }
}

export interface FilteredGPSState {
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
}

/**
 * 2D Kalman Filter specialized for smoothing noisy GPS coordinates and velocity streams.
 */
export class GPSKalmanFilter {
  private latFilter: KalmanFilter1D;
  private lonFilter: KalmanFilter1D;
  private speedFilter: KalmanFilter1D;
  private isInitialized: boolean = false;

  constructor(processNoise: number = 0.00001, measurementNoise: number = 0.0001) {
    this.latFilter = new KalmanFilter1D(processNoise, measurementNoise);
    this.lonFilter = new KalmanFilter1D(processNoise, measurementNoise);
    this.speedFilter = new KalmanFilter1D(0.1, 0.5);
  }

  /**
   * Updates state with new raw GPS measurement and returns filtered state.
   */
  public filter(lat: number, lon: number, speed: number, accuracyMeters: number = 5.0): FilteredGPSState {
    if (!this.isInitialized) {
      this.latFilter.reset(lat);
      this.lonFilter.reset(lon);
      this.speedFilter.reset(speed);
      this.isInitialized = true;
      return { latitude: lat, longitude: lon, speed, accuracy: accuracyMeters };
    }

    const smoothedLat = this.latFilter.update(lat);
    const smoothedLon = this.lonFilter.update(lon);
    const smoothedSpeed = Math.max(0, this.speedFilter.update(speed));

    return {
      latitude: smoothedLat,
      longitude: smoothedLon,
      speed: smoothedSpeed,
      accuracy: accuracyMeters
    };
  }

  public reset(): void {
    this.isInitialized = false;
  }
}
