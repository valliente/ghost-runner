import { describe, it, expect } from 'vitest';
import { ActivityExporter } from '../src/services/ActivityExporter';
import type { TelemetryPoint } from '../src/engine/GhostEngine';

describe('ActivityExporter', () => {
  const samplePoints: TelemetryPoint[] = [
    { timestamp: 0, latitude: 37.7749, longitude: -122.4194, speed: 3.5, distance: 0, elevation: 15.0, cadence: 170 },
    { timestamp: 10, latitude: 37.7751, longitude: -122.4192, speed: 3.6, distance: 35.5, elevation: 16.5, cadence: 172 },
    { timestamp: 20, latitude: 37.7753, longitude: -122.4190, speed: 3.7, distance: 72.0, elevation: 18.0, cadence: 175 }
  ];

  it('should generate valid GPX 1.1 XML structure with track points and extensions', () => {
    const gpx = ActivityExporter.generateGPX(samplePoints, 'Morning Synth Run');
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('<trkpt lat="37.774900" lon="-122.419400">');
    expect(gpx).toContain('<ele>15.0</ele>');
    expect(gpx).toContain('<gpxtpx:cad>170</gpxtpx:cad>');
    expect(gpx).toContain('<gpxtpx:speed>3.50</gpxtpx:speed>');
  });

  it('should generate valid TCX XML structure with Trackpoint and Cadence', () => {
    const tcx = ActivityExporter.generateTCX(samplePoints, 'Morning Synth Run');
    expect(tcx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(tcx).toContain('<TrainingCenterDatabase');
    expect(tcx).toContain('<Activity Sport="Running">');
    expect(tcx).toContain('<AltitudeMeters>15.0</AltitudeMeters>');
    expect(tcx).toContain('<Cadence>170</Cadence>');
    expect(tcx).toContain('<DistanceMeters>72.0</DistanceMeters>');
  });
});
