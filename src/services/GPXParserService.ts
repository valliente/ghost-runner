import GpxParser from 'gpxparser';
import type { TelemetryPoint, GhostVector } from '../engine/GhostEngine';

export class GPXParserService {
  /**
   * Parses raw GPX XML data into TelemetryPoint[] telemetry sequence with elevation, grade, and cadence.
   * @param xmlText Raw GPX XML content string
   */
  public static parseGPX(xmlText: string): GhostVector {
    if (!xmlText || typeof xmlText !== 'string' || xmlText.trim().length === 0) {
      throw new Error('GPX XML string is empty or invalid.');
    }

    // 1. Basic XML schema validation
    const domParser = new DOMParser();
    const xmlDoc = domParser.parseFromString(xmlText, 'text/xml');
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`Corrupted GPX XML structure: ${parserError.textContent}`);
    }

    const gpx = new GpxParser();
    try {
      gpx.parse(xmlText);
    } catch (e: any) {
      throw new Error(`GPX parsing failed: ${e?.message || e}`);
    }

    const trkptNodes = xmlDoc.getElementsByTagName('trkpt');
    if ((!gpx.tracks || gpx.tracks.length === 0 || !gpx.tracks[0].points || gpx.tracks[0].points.length === 0) && trkptNodes.length === 0) {
      throw new Error('No valid track points (<trkpt>) found in GPX file.');
    }

    const points: TelemetryPoint[] = [];
    let cumulativeDistance = 0;
    let totalElevationGain = 0;
    let firstTime: number | null = null;
    let previousElevation: number | null = null;

    const trackPointsCount = trkptNodes.length;

    for (let i = 0; i < trackPointsCount; i++) {
      const node = trkptNodes[i];
      const lat = parseFloat(node.getAttribute('lat') || '0');
      const lon = parseFloat(node.getAttribute('lon') || '0');

      // Elevation
      const eleNode = node.getElementsByTagName('ele')[0];
      const elevation = eleNode && eleNode.textContent ? parseFloat(eleNode.textContent) : 0;

      // Timestamp
      const timeNode = node.getElementsByTagName('time')[0];
      const timeStr = timeNode ? timeNode.textContent : null;
      const timestampMs = timeStr ? new Date(timeStr).getTime() : i * 1000;

      if (firstTime === null) {
        firstTime = timestampMs;
      }
      const elapsedSeconds = (timestampMs - firstTime) / 1000;

      // Cadence (supports <cad>, <gpxtpx:cad>, etc.)
      let cadence: number | undefined = undefined;
      const cadNode = node.getElementsByTagName('cad')[0] ||
                      node.getElementsByTagName('gpxtpx:cad')[0] ||
                      node.getElementsByTagName('ns3:cad')[0];
      if (cadNode && cadNode.textContent) {
        cadence = parseInt(cadNode.textContent, 10);
      }

      // Distance & Elevation Gain
      let distDelta = 0;
      if (i > 0) {
        const prevPt = points[i - 1];
        distDelta = GPXParserService.haversineDistance(prevPt.latitude, prevPt.longitude, lat, lon);
        cumulativeDistance += distDelta;

        if (previousElevation !== null) {
          const eleDelta = elevation - previousElevation;
          if (eleDelta > 0) {
            totalElevationGain += eleDelta;
          }
        }
      }
      previousElevation = elevation;

      // Calculate speed and pace
      let speed = 3.5;
      if (i > 0) {
        const prevPt = points[i - 1];
        const timeDelta = elapsedSeconds - prevPt.timestamp;
        if (timeDelta > 0 && distDelta >= 0) {
          speed = distDelta / timeDelta;
        } else {
          speed = prevPt.speed;
        }
      }

      const pace = speed > 0 ? 1000 / (speed * 60) : 0;

      // Grade calculation (%) and Grade Adjusted Pace (GAP)
      let grade = 0;
      let gradeAdjustedPace = pace;
      if (i > 0 && distDelta > 0) {
        const eleDelta = elevation - (points[i - 1].elevation || 0);
        grade = (eleDelta / distDelta) * 100; // grade percentage
        // Minetti cost factor: adjustment factor based on grade
        const gradeFactor = 1 + (0.033 * grade) + (0.0043 * grade * grade);
        gradeAdjustedPace = pace * (gradeFactor > 0 ? (1 / gradeFactor) : 1);
      }

      points.push({
        timestamp: elapsedSeconds,
        latitude: lat,
        longitude: lon,
        speed: parseFloat(speed.toFixed(2)),
        distance: parseFloat(cumulativeDistance.toFixed(1)),
        pace: parseFloat(pace.toFixed(2)),
        elevation: parseFloat(elevation.toFixed(1)),
        cadence,
        grade: parseFloat(grade.toFixed(1)),
        gradeAdjustedPace: parseFloat(gradeAdjustedPace.toFixed(2))
      });
    }

    const totalDistance = points.length > 0 ? points[points.length - 1].distance : 0;
    const totalDuration = points.length > 0 ? points[points.length - 1].timestamp : 0;

    return {
      points,
      totalDistance,
      totalDuration,
      totalElevationGain: parseFloat(totalElevationGain.toFixed(1))
    };
  }

  public static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
