import type { GhostVector, TelemetryPoint } from '../engine/GhostEngine';

export interface CloudGhostRecord {
  id: string;
  name: string;
  creator: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceMinKm: number;
  elevationGain: number;
  points: TelemetryPoint[];
  createdAt: string;
  tags: string[];
  likes: number;
}

export class CloudGhostService {
  private static readonly STORAGE_KEY = 'ghost_cloud_sync_cache';
  private static readonly SUPABASE_ENDPOINT = 'https://mock-supabase.ghostrunner.app/rest/v1';

  /**
   * Initializes or loads cached cloud ghost library.
   */
  private static getLocalCache(): CloudGhostRecord[] {
    try {
      const cached = localStorage.getItem(CloudGhostService.STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Failed to parse local cloud ghost cache:', e);
    }

    // Default seeded community ghosts
    const seededGhosts: CloudGhostRecord[] = [
      {
        id: 'cloud_tokyo_cyber_5k',
        name: 'Neo-Tokyo Midnight 5K',
        creator: 'Kenshiro_88',
        distanceMeters: 5000,
        durationSeconds: 1200,
        avgPaceMinKm: 4.0,
        elevationGain: 45,
        points: this.generateSyntheticPoints(5000, 1200, 4.0),
        createdAt: '2026-08-15T12:00:00Z',
        tags: ['5k', 'flat', 'sub-20'],
        likes: 142
      },
      {
        id: 'cloud_shinjuku_hill_dash',
        name: 'Shinjuku Skyway Sprint 3K',
        creator: 'AkiraSpeed',
        distanceMeters: 3000,
        durationSeconds: 690,
        avgPaceMinKm: 3.83,
        elevationGain: 80,
        points: this.generateSyntheticPoints(3000, 690, 3.83),
        createdAt: '2026-08-16T18:30:00Z',
        tags: ['3k', 'climb', 'hard'],
        likes: 98
      },
      {
        id: 'cloud_cyber_marathon_prep_10k',
        name: 'Cyberbay Expressway 10K',
        creator: 'Valkyrie_Runner',
        distanceMeters: 10000,
        durationSeconds: 2700,
        avgPaceMinKm: 4.5,
        elevationGain: 30,
        points: this.generateSyntheticPoints(10000, 2700, 4.5),
        createdAt: '2026-08-17T09:15:00Z',
        tags: ['10k', 'endurance', 'tempo'],
        likes: 310
      }
    ];

    this.saveLocalCache(seededGhosts);
    return seededGhosts;
  }

  private static saveLocalCache(records: CloudGhostRecord[]): void {
    try {
      localStorage.setItem(CloudGhostService.STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save cloud ghost cache to local storage:', e);
    }
  }

  /**
   * Publishes a local ghost trajectory to the community cloud.
   */
  public static async publishGhost(
    name: string,
    creator: string,
    vector: GhostVector,
    tags: string[] = ['custom']
  ): Promise<{ success: boolean; id: string; shareUrl: string }> {
    const id = `ghost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const avgPace = vector.totalDistance > 0 ? (vector.totalDuration / 60) / (vector.totalDistance / 1000) : 4.5;

    const newRecord: CloudGhostRecord = {
      id,
      name,
      creator: creator.trim() || 'Anonymous Runner',
      distanceMeters: vector.totalDistance,
      durationSeconds: vector.totalDuration,
      avgPaceMinKm: parseFloat(avgPace.toFixed(2)),
      elevationGain: 25,
      points: vector.points,
      createdAt: new Date().toISOString(),
      tags,
      likes: 0
    };

    const cache = this.getLocalCache();
    cache.unshift(newRecord);
    this.saveLocalCache(cache);

    // Try posting to Supabase if endpoint configured
    try {
      if (typeof fetch !== 'undefined' && this.SUPABASE_ENDPOINT.startsWith('http')) {
        await fetch(`${this.SUPABASE_ENDPOINT}/ghost_tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        }).catch(() => null);
      }
    } catch (e) {
      // offline fallback
    }

    const shareUrl = `ghostrunner://track/${id}`;
    return { success: true, id, shareUrl };
  }

  /**
   * Fetches community ghost tracks from cloud / cache.
   */
  public static async fetchCommunityGhosts(searchQuery?: string): Promise<CloudGhostRecord[]> {
    const records = this.getLocalCache();
    if (!searchQuery || searchQuery.trim().length === 0) {
      return records;
    }

    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.creator.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  /**
   * Downloads a community ghost record by ID into a playable GhostVector.
   */
  public static async downloadGhost(id: string): Promise<GhostVector> {
    const cache = this.getLocalCache();
    const match = cache.find((r) => r.id === id);

    if (match) {
      return {
        points: match.points,
        totalDistance: match.distanceMeters,
        totalDuration: match.durationSeconds
      };
    }

    // Fallback: If not found, create a standard 5k ghost
    const fallbackPoints = this.generateSyntheticPoints(5000, 1350, 4.5);
    return {
      points: fallbackPoints,
      totalDistance: 5000,
      totalDuration: 1350
    };
  }

  /**
   * Upvotes a community ghost track.
   */
  public static likeGhost(id: string): number {
    const cache = this.getLocalCache();
    const match = cache.find((r) => r.id === id);
    if (match) {
      match.likes += 1;
      this.saveLocalCache(cache);
      return match.likes;
    }
    return 0;
  }

  private static generateSyntheticPoints(distance: number, duration: number, paceMinKm: number): TelemetryPoint[] {
    const points: TelemetryPoint[] = [];
    const speedMs = 1000 / (paceMinKm * 60);
    const stepSec = 2.0;

    let distAcc = 0;
    let lat = 35.6895;
    let lon = 139.6917;

    for (let t = 0; t <= duration; t += stepSec) {
      const stepDist = speedMs * stepSec;
      distAcc += stepDist;
      lat += (stepDist / 111139) * 0.7;
      lon += (stepDist / 111139) * 0.7;

      points.push({
        timestamp: t,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lon.toFixed(6)),
        speed: parseFloat(speedMs.toFixed(2)),
        distance: parseFloat(Math.min(distance, distAcc).toFixed(1)),
        pace: parseFloat(paceMinKm.toFixed(2)),
        elevation: 15 + Math.sin(t / 40) * 10
      });
      if (distAcc >= distance) break;
    }
    return points;
  }
}
