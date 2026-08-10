import GpxParser from 'gpxparser';
import type { TelemetryPoint, GhostVector } from '../engine/GhostEngine';

export class GPXParserService {
  /**
   * Parses raw GPX XML data into TelemetryPoint[] telemetry sequence using gpxparser library.
   * @param xmlText Raw GPX XML content string
   */
  public static parseGPX(xmlText: string): GhostVector {
    const gpx = new GpxParser();
    gpx.parse(xmlText);

    if (!gpx.tracks || gpx.tracks.length === 0 || !gpx.tracks[0].points || gpx.tracks[0].points.length === 0) {
      throw new Error('No valid track points found in GPX file.');
    }

    const track = gpx.tracks[0];
    const points: TelemetryPoint[] = [];

    let cumulativeDistance = 0;
    let firstTime: number | null = null;

    for (let i = 0; i < track.points.length; i++) {
      const pt = track.points[i];
      const lat = pt.lat;
      const lon = pt.lon;

      let timestampMs: number;
      if (pt.time) {
        timestampMs = new Date(pt.time).getTime();
      } else {
        timestampMs = i * 1000;
      }

      if (firstTime === null) {
        firstTime = timestampMs;
      }
      const elapsedSeconds = (timestampMs - firstTime) / 1000;

      // Distance calculation via gpxparser cumul array or Haversine fallback
      if (i > 0) {
        if (track.distance && track.distance.cumul && track.distance.cumul[i] !== undefined) {
          cumulativeDistance = track.distance.cumul[i];
        } else {
          const prevPt = points[i - 1];
          const distDelta = GPXParserService.haversineDistance(
            prevPt.latitude, prevPt.longitude, lat, lon
          );
          cumulativeDistance += distDelta;
        }
      }

      // Calculate speed and pace
      let speed = 3.5; // m/s default (~12.6 km/h)
      if (i > 0) {
        const prevPt = points[i - 1];
        const timeDelta = elapsedSeconds - prevPt.timestamp;
        const distDelta = cumulativeDistance - prevPt.distance;
        if (timeDelta > 0 && distDelta >= 0) {
          speed = distDelta / timeDelta;
        } else {
          speed = prevPt.speed;
        }
      }

      // Pace in min/km: 1000 / (speed * 60)
      const pace = speed > 0 ? (1000 / (speed * 60)) : 0;

      points.push({
        timestamp: elapsedSeconds,
        latitude: lat,
        longitude: lon,
        speed: speed,
        distance: cumulativeDistance,
        pace: parseFloat(pace.toFixed(2))
      });
    }

    const totalDistance = points.length > 0 ? points[points.length - 1].distance : 0;
    const totalDuration = points.length > 0 ? points[points.length - 1].timestamp : 0;

    return { points, totalDistance, totalDuration };
  }

  public static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
