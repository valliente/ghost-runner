import { GhostEngine, type GhostVector } from './GhostEngine';

export interface GhostEntity {
  id: string;
  name: string;
  colorHex: string;
  colorNum: number;
  engine: GhostEngine;
  currentDistance: number;
  currentSpeed: number;
  deltaMeters: number; // Positive = ghost ahead, negative = ghost behind
  relativePaceRatio: number;
}

export class GhostFleetEngine {
  private fleet: GhostEntity[] = [];

  constructor() {
    this.fleet = [];
  }

  public addGhost(id: string, name: string, colorHex: string, colorNum: number, vector: GhostVector): void {
    this.fleet.push({
      id,
      name,
      colorHex,
      colorNum,
      engine: new GhostEngine(vector),
      currentDistance: 0,
      currentSpeed: 0,
      deltaMeters: 0,
      relativePaceRatio: 1.0
    });
  }

  public clearFleet(): void {
    this.fleet = [];
  }

  /**
   * Updates all ghosts in the fleet for the given elapsed time and player distance.
   */
  public updateFleet(elapsedSeconds: number, playerDistanceMeters: number, playerSpeedMs: number): GhostEntity[] {
    for (const ghost of this.fleet) {
      const state = ghost.engine.getGhostPositionAtTime(elapsedSeconds);
      ghost.currentDistance = state.x;
      ghost.currentSpeed = state.speed;
      ghost.deltaMeters = ghost.currentDistance - playerDistanceMeters;
      ghost.relativePaceRatio = ghost.currentSpeed > 0 ? playerSpeedMs / ghost.currentSpeed : 1.0;
    }
    return this.fleet;
  }

  public getFleet(): GhostEntity[] {
    return this.fleet;
  }

  /**
   * Generates a default 3-opponent Ghost Fleet (Personal Best, 30-Day Avg, Target Pace).
   */
  public static createDefaultFleet(): GhostFleetEngine {
    const fleetEngine = new GhostFleetEngine();

    // 1. Personal Best (Magenta - Aggressive 3:55 /km)
    const pbPoints = [];
    let pbDist = 0;
    for (let t = 0; t <= 1200; t += 3) {
      const speed = 4.25 + Math.sin(t / 25) * 0.4;
      pbDist += speed * 3;
      pbPoints.push({ timestamp: t, latitude: 0, longitude: 0, speed, distance: pbDist });
    }
    fleetEngine.addGhost('ghost_pb', 'Personal Record', '#ff007f', 0xff007f, {
      points: pbPoints,
      totalDistance: pbDist,
      totalDuration: 1200
    });

    // 2. 30-Day Average (Cyan - Steady 4:20 /km)
    const avgPoints = [];
    let avgDist = 0;
    for (let t = 0; t <= 1300; t += 3) {
      const speed = 3.85 + Math.cos(t / 30) * 0.3;
      avgDist += speed * 3;
      avgPoints.push({ timestamp: t, latitude: 0, longitude: 0, speed, distance: avgDist });
    }
    fleetEngine.addGhost('ghost_avg', '30-Day Avg', '#00f3ff', 0x00f3ff, {
      points: avgPoints,
      totalDistance: avgDist,
      totalDuration: 1300
    });

    // 3. Target Goal (Gold - 4:05 /km)
    const goalPoints = [];
    let goalDist = 0;
    for (let t = 0; t <= 1225; t += 3) {
      const speed = 4.08;
      goalDist += speed * 3;
      goalPoints.push({ timestamp: t, latitude: 0, longitude: 0, speed, distance: goalDist });
    }
    fleetEngine.addGhost('ghost_target', 'Target Goal', '#ffd700', 0xffd700, {
      points: goalPoints,
      totalDistance: goalDist,
      totalDuration: 1225
    });

    return fleetEngine;
  }
}
