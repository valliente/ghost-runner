import { Geolocation } from '@capacitor/geolocation';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
}

export class LocationService {
  private watchId: string | null = null;
  private onLocationCallback: ((location: LocationUpdate) => void) | null = null;

  public async startTracking(callback: (location: LocationUpdate) => void): Promise<void> {
    this.onLocationCallback = callback;
    try {
      await Geolocation.requestPermissions();
      this.watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (position, err) => {
        if (err || !position) {
          console.warn('Geolocation error:', err);
          return;
        }
        const update: LocationUpdate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0,
          timestamp: position.timestamp
        };
        if (this.onLocationCallback) {
          this.onLocationCallback(update);
        }
      });
    } catch (e) {
      console.warn('Capacitor Geolocation fallback to HTML5 Browser Geolocation API:', e);
      if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition((pos) => {
          if (this.onLocationCallback) {
            this.onLocationCallback({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              speed: pos.coords.speed || 0,
              timestamp: pos.timestamp
            });
          }
        });
      }
    }
  }

  public async stopTracking(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }
}
