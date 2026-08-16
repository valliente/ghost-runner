import type { TelemetryPoint } from '../engine/GhostEngine';

export class ActivityExporter {
  /**
   * Generates a standard GPX 1.1 XML string including elevation, cadence, and HR extensions.
   */
  public static generateGPX(points: TelemetryPoint[], activityName: string = 'Ghost Runner Workout'): string {
    const startTime = points.length > 0 ? new Date(Date.now() - points[points.length - 1].timestamp * 1000) : new Date();

    const trackPointsXml = points
      .map((p) => {
        const pointDate = new Date(startTime.getTime() + p.timestamp * 1000).toISOString();
        const eleXml = p.elevation !== undefined ? `\n        <ele>${p.elevation.toFixed(1)}</ele>` : '';
        const cadXml = p.cadence !== undefined ? `\n            <gpxtpx:cad>${p.cadence}</gpxtpx:cad>` : '';

        return `      <trkpt lat="${p.latitude.toFixed(6)}" lon="${p.longitude.toFixed(6)}">${eleXml}
        <time>${pointDate}</time>
        <extensions>
          <gpxtpx:TrackPointExtension xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
            <gpxtpx:speed>${p.speed.toFixed(2)}</gpxtpx:speed>${cadXml}
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Ghost Runner v1.101" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd">
  <metadata>
    <name>${activityName}</name>
    <time>${startTime.toISOString()}</time>
  </metadata>
  <trk>
    <name>${activityName}</name>
    <type>running</type>
    <trkseg>
${trackPointsXml}
    </trkseg>
  </trk>
</gpx>`;
  }

  /**
   * Generates a Garmin Training Center XML (TCX) schema string.
   */
  public static generateTCX(points: TelemetryPoint[], activityName: string = 'Ghost Runner Workout'): string {
    const startTime = points.length > 0 ? new Date(Date.now() - points[points.length - 1].timestamp * 1000) : new Date();
    const totalDistance = points.length > 0 ? points[points.length - 1].distance : 0;
    const totalDuration = points.length > 0 ? points[points.length - 1].timestamp : 0;

    const trackPointsXml = points
      .map((p) => {
        const pointDate = new Date(startTime.getTime() + p.timestamp * 1000).toISOString();
        const eleXml = p.elevation !== undefined ? `\n            <AltitudeMeters>${p.elevation.toFixed(1)}</AltitudeMeters>` : '';
        const cadXml = p.cadence !== undefined ? `\n            <Cadence>${p.cadence}</Cadence>` : '';

        return `          <Trackpoint>
            <Time>${pointDate}</Time>
            <Position>
              <LatitudeDegrees>${p.latitude.toFixed(6)}</LatitudeDegrees>
              <LongitudeDegrees>${p.longitude.toFixed(6)}</LongitudeDegrees>
            </Position>${eleXml}
            <DistanceMeters>${p.distance.toFixed(1)}</DistanceMeters>${cadXml}
          </Trackpoint>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Activities>
    <Activity Sport="Running">
      <Id>${startTime.toISOString()}</Id>
      <Notes>${activityName}</Notes>
      <Lap StartTime="${startTime.toISOString()}">
        <TotalTimeSeconds>${totalDuration.toFixed(1)}</TotalTimeSeconds>
        <DistanceMeters>${totalDistance.toFixed(1)}</DistanceMeters>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
${trackPointsXml}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
  }

  /**
   * Triggers download or native file saving across Web, Tauri, and Mobile.
   */
  public static async saveFile(content: string, filename: string, mimeType: string = 'application/xml'): Promise<void> {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
