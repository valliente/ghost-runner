import type { TelemetryPoint, GhostVector } from '../engine/GhostEngine';

export class GPXParser {
  /**
   * Parses XML string of a GPX file into a GhostVector telemetry sequence.
   * @param xmlText Raw GPX XML string content
   */
  public static parseGPX(xmlText: string): GhostVector {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const trkpts = xmlDoc.getElementsByTagName('trkpt');

    const points: TelemetryPoint[] = [];
    let cumulativeDistance = 0;
    let firstTime: number | null = null;

    for (let i = 0; i < trkpts.length; i++) {
      const pt = trkpts[i];
      const lat = parseFloat(pt.getAttribute('lat') || '0');
      const lon = parseFloat(pt.getAttribute('lon') || '0');

      const timeElem = pt.getElementsByTagName('time')[0];
      const timeStr = timeElem ? timeElem.textContent : null;
      const timestampMs = timeStr ? new Date(timeStr).getTime() : i * 1000;

      if (firstTime === null) {
        firstTime = timestampMs;
      }
      const elapsedSeconds = (timestampMs - firstTime) / 1000;

      if (i > 0) {
        const prevPt = points[i - 1];
        const distDelta = GPXParser.calculateHaversineDistance(
          prevPt.latitude, prevPt.longitude, lat, lon
        );
        cumulativeDistance += distDelta;
      }

      const speedElem = pt.getElementsByTagName('speed')[0];
      let speed = speedElem ? parseFloat(speedElem.textContent || '0') : 3.5;
      if (!speedElem && i > 0) {
        const prevPt = points[i - 1];
        const timeDelta = elapsedSeconds - prevPt.timestamp;
        const distDelta = cumulativeDistance - prevPt.distance;
        speed = timeDelta > 0 ? distDelta / timeDelta : prevPt.speed;
      }

      points.push({
        timestamp: elapsedSeconds,
        latitude: lat,
        longitude: lon,
        speed: speed,
        distance: cumulativeDistance
      });
    }

    const totalDistance = points.length > 0 ? points[points.length - 1].distance : 0;
    const totalDuration = points.length > 0 ? points[points.length - 1].timestamp : 0;

    return { points, totalDistance, totalDuration };
  }

  /**
   * Generates mock 2km synthwave run telemetry vector for instant demonstration.
   */
  public static generateMockGhostData(): GhostVector {
    const points: TelemetryPoint[] = [];
    let distance = 0;
    for (let t = 0; t <= 300; t += 2) { // 5-minute run track
      const baseSpeed = 3.8 + Math.sin(t / 20) * 0.7; // ~13.6 km/h pace
      distance += baseSpeed * 2;
      points.push({
        timestamp: t,
        latitude: 37.7749 + (t * 0.00001),
        longitude: -122.4194 + (t * 0.00001),
        speed: baseSpeed,
        distance: distance
      });
    }
    return {
      points,
      totalDistance: distance,
      totalDuration: 300
    };
  }

  private static calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
