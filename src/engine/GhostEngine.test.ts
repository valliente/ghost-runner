import { GhostEngine } from './GhostEngine';
import type { TelemetryPoint } from './GhostEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runGhostEngineTests() {
  console.log('Running GhostEngine unit tests...');

  const mockPoints: TelemetryPoint[] = [
    { timestamp: 0, latitude: 0, longitude: 0, speed: 4.0, distance: 0 },
    { timestamp: 10, latitude: 0, longitude: 0, speed: 4.0, distance: 40 },
    { timestamp: 20, latitude: 0, longitude: 0, speed: 6.0, distance: 100 }
  ];

  const engine = new GhostEngine(mockPoints);

  // Test 1: Start boundary
  const startPos = engine.getGhostPositionAtTime(0);
  assert(startPos.x === 0, 'Start distance should be 0');
  assert(startPos.speed === 4.0, 'Start speed should be 4.0');

  // Test 2: Midpoint interpolation at t = 5s (halfway between 0 and 40m -> 20m)
  const midPos = engine.getGhostPositionAtTime(5);
  assert(midPos.x === 20, `Midpoint distance should be 20m, got ${midPos.x}`);
  assert(midPos.speed === 4.0, 'Midpoint speed should be 4.0');

  // Test 3: Acceleration interpolation at t = 15s (halfway between 40m and 100m -> 70m)
  const accelPos = engine.getGhostPositionAtTime(15);
  assert(accelPos.x === 70, `Accel distance should be 70m, got ${accelPos.x}`);
  assert(accelPos.speed === 5.0, `Accel speed should be 5.0, got ${accelPos.speed}`);

  // Test 4: End boundary
  const endPos = engine.getGhostPositionAtTime(30);
  assert(endPos.x === 100, 'End distance should be capped at 100m');

  console.log('✅ All GhostEngine unit tests passed!');
}

runGhostEngineTests();
