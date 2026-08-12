import { Geolocation } from '@capacitor/geolocation';
import type { TelemetryPoint } from '../engine/GhostEngine';
import { GPXParserService } from './GPXParserService';

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

  private callback?: GPSTrackerCallback;

  public async start(onPointUpdate?: GPSTrackerCallback): Promise<void> {
    this.callback = onPointUpdate;
    this.points = [];
    this.totalDistanceMeters = 0;
    this.lastPosition = null;
    this.startTime = Date.now();
    this.isTracking = true;

    try {
      // Request Android / iOS native location permissions
      await Geolocation.requestPermissions();
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
        (position, err) => {
          if (err || !position) {
            console.warn('GPSTracker: Watch position error:', err);
            return;
          }
          this.handleNewPosition(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.speed,
            position.timestamp
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
              pos.timestamp
            );
          },
          (err) => console.warn('Web Geolocation error:', err),
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

  private handleNewPosition(lat: number, lon: number, rawSpeed: number | null, timestampMs: number): void {
    if (!this.isTracking) return;

    const elapsedSeconds = (Date.now() - this.startTime) / 1000;

    let distDelta = 0;
    if (this.lastPosition) {
      distDelta = GPXParserService.haversineDistance(
        this.lastPosition.lat,
        this.lastPosition.lon,
        lat,
        lon
      );
    }
    this.totalDistanceMeters += distDelta;

    // Derived or raw speed in m/s
    let speed = rawSpeed !== null && rawSpeed > 0 ? rawSpeed : 3.5;
    if (this.lastPosition && distDelta > 0) {
      const timeDeltaSec = (timestampMs - this.lastPosition.timestamp) / 1000;
      if (timeDeltaSec > 0) {
        speed = distDelta / timeDeltaSec;
      }
    }

    const pace = speed > 0 ? (1000 / (speed * 60)) : 0;

    const point: TelemetryPoint = {
      timestamp: elapsedSeconds,
      latitude: lat,
      longitude: lon,
      speed: parseFloat(speed.toFixed(2)),
      distance: parseFloat(this.totalDistanceMeters.toFixed(1)),
      pace: parseFloat(pace.toFixed(2))
    };

    this.points.push(point);
    this.lastPosition = { lat, lon, timestamp: timestampMs };

    if (this.callback) {
      this.callback(point, this.totalDistanceMeters);
    }
  }

  public getPoints(): TelemetryPoint[] {
    return this.points;
  }

  public getTotalDistance(): number {
    return this.totalDistanceMeters;
  }
}
