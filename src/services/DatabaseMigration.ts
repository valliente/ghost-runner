import { GhostRepository, type GhostRecord, type RunRecord } from './GhostRepository';

export interface DatabaseBackupPayload {
  schemaVersion: number;
  exportedAt: string;
  ghosts: GhostRecord[];
  runs: RunRecord[];
  meta: {
    appVersion: string;
    totalRuns: number;
    totalGhosts: number;
  };
}

export class DatabaseMigration {
  public static readonly CURRENT_SCHEMA_VERSION = 2;

  /**
   * Applies schema migrations when database version changes.
   */
  public static applyMigrations(db: IDBDatabase, oldVersion: number, newVersion: number): void {
    console.log(`Migrating IndexedDB schema from v${oldVersion} to v${newVersion}...`);

    // Migration v1 -> v2: Add workouts & training_loads stores if missing
    if (oldVersion < 2) {
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains('training_loads')) {
        const loadStore = db.createObjectStore('training_loads', { keyPath: 'id' });
        loadStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    }
  }

  /**
   * Serializes all IndexedDB stores into an encrypted or formatted JSON backup.
   */
  public static async exportFullDatabaseJSON(): Promise<string> {
    const runs = await GhostRepository.getAllRuns();
    const ghosts = await GhostRepository.listGhostsByDistance(0, 1000000);

    const backup: DatabaseBackupPayload = {
      schemaVersion: DatabaseMigration.CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      ghosts,
      runs,
      meta: {
        appVersion: '1.104.0',
        totalRuns: runs.length,
        totalGhosts: ghosts.length
      }
    };

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Restores and merges full database backup payload.
   */
  public static async restoreDatabaseFromJSON(jsonString: string): Promise<{ success: boolean; importedRuns: number; importedGhosts: number }> {
    try {
      const payload: DatabaseBackupPayload = JSON.parse(jsonString);
      if (!payload.schemaVersion || !Array.isArray(payload.runs)) {
        throw new Error('Invalid database backup format.');
      }

      let importedRuns = 0;
      let importedGhosts = 0;

      // Import runs
      for (const run of payload.runs) {
        await GhostRepository.saveRun(run);
        importedRuns++;
      }

      // Import ghosts
      if (Array.isArray(payload.ghosts)) {
        for (const ghost of payload.ghosts) {
          await GhostRepository.saveGhost(ghost);
          importedGhosts++;
        }
      }

      return { success: true, importedRuns, importedGhosts };
    } catch (e) {
      console.warn('Database restore failed:', e);
      return { success: false, importedRuns: 0, importedGhosts: 0 };
    }
  }
}
