import type { GhostVector } from '../engine/GhostEngine';

export interface GhostRecord {
  id: string;
  name: string;
  category: 'personal_best' | 'rival' | 'custom' | 'system';
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  avgPaceMinKm: number;
  vector: GhostVector;
  createdAt: number;
}

export interface RunRecord {
  id: string;
  trackName: string;
  date: string;
  timestamp: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  avgPaceMinKm: number;
  elevationGainMeters: number;
  ghostVector: GhostVector;
}

export interface PersonalRecord {
  distanceCategory: string; // '1k' | '5k' | '10k' | '21k'
  bestTimeSeconds: number;
  bestPaceMinKm: number;
  dateAchieved: string;
  runId: string;
}

export class GhostRepository {
  private static readonly DB_NAME = 'GhostRunnerDB';
  private static readonly DB_VERSION = 1;

  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Ghosts Object Store
        if (!db.objectStoreNames.contains('ghosts')) {
          const ghostStore = db.createObjectStore('ghosts', { keyPath: 'id' });
          ghostStore.createIndex('name', 'name', { unique: false });
          ghostStore.createIndex('totalDistanceMeters', 'totalDistanceMeters', { unique: false });
          ghostStore.createIndex('category', 'category', { unique: false });
        }

        // 2. Runs Object Store
        if (!db.objectStoreNames.contains('runs')) {
          const runStore = db.createObjectStore('runs', { keyPath: 'id' });
          runStore.createIndex('date', 'date', { unique: false });
          runStore.createIndex('totalDistanceMeters', 'totalDistanceMeters', { unique: false });
        }

        // 3. Personal Records Store
        if (!db.objectStoreNames.contains('personal_records')) {
          db.createObjectStore('personal_records', { keyPath: 'distanceCategory' });
        }

        // 4. Routes Store
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public static async saveGhost(ghost: Omit<GhostRecord, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
    const db = await this.getDB();
    const id = ghost.id || `ghost_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: GhostRecord = {
      ...ghost,
      id,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('ghosts', 'readwrite');
      const store = tx.objectStore('ghosts');
      const req = store.put(record);
      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  }

  public static async getGhostById(id: string): Promise<GhostRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('ghosts', 'readonly');
      const store = tx.objectStore('ghosts');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public static async listGhostsByDistance(minDistanceMeters: number, maxDistanceMeters: number): Promise<GhostRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('ghosts', 'readonly');
      const store = tx.objectStore('ghosts');
      const index = store.index('totalDistanceMeters');
      const range = IDBKeyRange.bound(minDistanceMeters, maxDistanceMeters);
      const req = index.getAll(range);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteGhost(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('ghosts', 'readwrite');
      const store = tx.objectStore('ghosts');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async saveRun(run: Omit<RunRecord, 'id' | 'timestamp'> & { id?: string }): Promise<string> {
    const db = await this.getDB();
    const id = run.id || `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: RunRecord = {
      ...run,
      id,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('runs', 'readwrite');
      const store = tx.objectStore('runs');
      const req = store.put(record);
      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  }

  public static async getAllRuns(): Promise<RunRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('runs', 'readonly');
      const store = tx.objectStore('runs');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
}
