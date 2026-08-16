import type { GhostVector, TelemetryPoint } from '../engine/GhostEngine';
import { GPXParserService } from './GPXParserService';

export class HealthKitParser {
  /**
   * Parses Apple Health XML export route data into GhostVector.
   */
  public static parseHealthXML(xmlText: string): GhostVector {
    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error('Apple Health XML string is empty.');
    }

    const domParser = new DOMParser();
    const xmlDoc = domParser.parseFromString(xmlText, 'text/xml');
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`Corrupted Apple Health XML: ${parserError.textContent}`);
    }

    // Check for <Location> tags (Apple Health export route points)
    const locationNodes = xmlDoc.getElementsByTagName('Location');
    if (locationNodes.length === 0) {
      // Fallback check for <trkpt> (GPX embedded inside XML)
      const trkptNodes = xmlDoc.getElementsByTagName('trkpt');
      if (trkptNodes.length > 0) {
        return GPXParserService.parseGPX(xmlText);
      }
      throw new Error('No valid <Location> GPS points found in Apple Health XML.');
    }

    const points: TelemetryPoint[] = [];
    let cumulativeDistance = 0;
    let firstTime: number | null = null;

    for (let i = 0; i < locationNodes.length; i++) {
      const node = locationNodes[i];
      const lat = parseFloat(node.getAttribute('latitude') || '0');
      const lon = parseFloat(node.getAttribute('longitude') || '0');
      const altitude = parseFloat(node.getAttribute('altitude') || '0');
      const speedAttr = node.getAttribute('speed');
      const rawSpeed = speedAttr ? parseFloat(speedAttr) : 3.5;

      const timeAttr = node.getAttribute('time') || node.getAttribute('date');
      const timestampMs = timeAttr ? new Date(timeAttr).getTime() : i * 1000;

      if (firstTime === null) {
        firstTime = timestampMs;
      }
      const elapsedSeconds = (timestampMs - firstTime) / 1000;

      let distDelta = 0;
      if (i > 0) {
        const prevPt = points[i - 1];
        distDelta = GPXParserService.haversineDistance(prevPt.latitude, prevPt.longitude, lat, lon);
        cumulativeDistance += distDelta;
      }

      let speed = rawSpeed > 0 ? rawSpeed : 3.5;
      if (i > 0 && distDelta > 0) {
        const timeDelta = elapsedSeconds - points[i - 1].timestamp;
        if (timeDelta > 0) {
          speed = distDelta / timeDelta;
        }
      }

      const pace = speed > 0 ? 1000 / (speed * 60) : 0;

      points.push({
        timestamp: elapsedSeconds,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lon.toFixed(6)),
        speed: parseFloat(speed.toFixed(2)),
        distance: parseFloat(cumulativeDistance.toFixed(1)),
        pace: parseFloat(pace.toFixed(2)),
        elevation: parseFloat(altitude.toFixed(1))
      });
    }

    const totalDistance = points.length > 0 ? points[points.length - 1].distance : 0;
    const totalDuration = points.length > 0 ? points[points.length - 1].timestamp : 0;

    return {
      points,
      totalDistance,
      totalDuration
    };
  }
}
