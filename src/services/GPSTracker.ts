import { Geolocation } from '@capacitor/geolocation';
import type { TelemetryPoint } from '../engine/GhostEngine';
import { GPXParserService } from './GPXParserService';
import { GPSKalmanFilter } from '../engine/KalmanFilter';
import { DeadReckoning } from '../engine/DeadReckoning';

export interface GPSTrackerCallback {
  (point: TelemetryPoint, totalDistanceMeters: number): void;
}

export class GPSTracker {
  private watchId: string | null = null;
  private isTracking: boolean = false;
  private startTime: number = 0;

  private points: TelemetryPoint[] = [];
  private totalDistanceMeters: number = 0;
  private lastPosition: { lat: number; lon: number; timestamp: number } | null = null;
  private currentHeading: number = 0; // Bearing in radians

  private kalmanFilter: GPSKalmanFilter = new GPSKalmanFilter();
  private callback?: GPSTrackerCallback;

  public async start(onPointUpdate?: GPSTrackerCallback): Promise<void> {
    this.callback = onPointUpdate;
    this.points = [];
    this.totalDistanceMeters = 0;
    this.lastPosition = null;
    this.currentHeading = 0;
    this.startTime = Date.now();
    this.isTracking = true;
    this.kalmanFilter.reset();

    try {
      // Request Android / iOS native location permissions
      await Geolocation.requestPermissions();
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
        (position, err) => {
          if (err || !position) {
            console.warn('GPSTracker: Watch position error, attempting dead reckoning fallback:', err);
            this.applyDeadReckoningStep();
            return;
          }
          this.handleNewPosition(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.speed,
            position.timestamp,
            position.coords.accuracy
          );
        }
      );
    } catch (e) {
      console.warn('GPSTracker: Falling back to HTML5 Web Geolocation:', e);
      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            this.handleNewPosition(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.speed,
              pos.timestamp,
              pos.coords.accuracy
            );
          },
          (err) => {
            console.warn('Web Geolocation error:', err);
            this.applyDeadReckoningStep();
          },
          { enableHighAccuracy: true }
        );
        this.watchId = id.toString();
      }
    }
  }

  public async stop(): Promise<TelemetryPoint[]> {
    this.isTracking = false;
    if (this.watchId) {
      try {
        await Geolocation.clearWatch({ id: this.watchId });
      } catch (e) {
        if ('geolocation' in navigator) {
          navigator.geolocation.clearWatch(parseInt(this.watchId, 10));
        }
      }
      this.watchId = null;
    }
    return this.points;
  }

  private handleNewPosition(
    lat: number,
    lon: number,
    rawSpeed: number | null,
    timestampMs: number,
    accuracy: number = 5.0
  ): void {
    if (!this.isTracking) return;

    // Apply Kalman Filter smoothing on noisy GPS coordinates
    const filteredState = this.kalmanFilter.filter(lat, lon, rawSpeed || 3.5, accuracy);
    const smoothedLat = filteredState.latitude;
    const smoothedLon = filteredState.longitude;

    const elapsedSeconds = (Date.now() - this.startTime) / 1000;

    let distDelta = 0;
    if (this.lastPosition) {
      distDelta = GPXParserService.haversineDistance(
        this.lastPosition.lat,
        this.lastPosition.lon,
        smoothedLat,
        smoothedLon
      );
      this.currentHeading = DeadReckoning.calculateBearing(
        this.lastPosition.lat,
        this.lastPosition.lon,
        smoothedLat,
        smoothedLon
      );
    }
    this.totalDistanceMeters += distDelta;

    // Derived or smoothed speed in m/s
    let speed = filteredState.speed > 0 ? filteredState.speed : 3.5;
    if (this.lastPosition && distDelta > 0) {
      const timeDeltaSec = (timestampMs - this.lastPosition.timestamp) / 1000;
      if (timeDeltaSec > 0) {
        speed = distDelta / timeDeltaSec;
      }
    }

    const pace = speed > 0 ? 1000 / (speed * 60) : 0;

    const point: TelemetryPoint = {
      timestamp: elapsedSeconds,
      latitude: parseFloat(smoothedLat.toFixed(6)),
      longitude: parseFloat(smoothedLon.toFixed(6)),
      speed: parseFloat(speed.toFixed(2)),
      distance: parseFloat(this.totalDistanceMeters.toFixed(1)),
      pace: parseFloat(pace.toFixed(2))
    };

    this.points.push(point);
    this.lastPosition = { lat: smoothedLat, lon: smoothedLon, timestamp: timestampMs };

    if (this.callback) {
      this.callback(point, this.totalDistanceMeters);
    }
  }

  private applyDeadReckoningStep(): void {
    if (!this.isTracking || this.points.length === 0) return;

    const lastPoint = this.points[this.points.length - 1];
    const now = Date.now();
    const elapsedSinceLastPoint = (now - this.startTime) / 1000 - lastPoint.timestamp;

    if (elapsedSinceLastPoint > 1.0 && elapsedSinceLastPoint < 15.0) {
      const deadPoint = DeadReckoning.extrapolate(lastPoint, this.currentHeading, 1.0);
      this.totalDistanceMeters = deadPoint.distance;
      this.points.push(deadPoint);
      this.lastPosition = { lat: deadPoint.latitude, lon: deadPoint.longitude, timestamp: now };

      if (this.callback) {
        this.callback(deadPoint, this.totalDistanceMeters);
      }
    }
  }

  public getPoints(): TelemetryPoint[] {
    return this.points;
  }

  public getTotalDistance(): number {
    return this.totalDistanceMeters;
  }
}
