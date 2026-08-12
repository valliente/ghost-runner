import type { GhostVector } from '../engine/GhostEngine';

export interface SavedRun {
  id: string;
  name: string;
  date: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  avgPaceMinKm: number;
  ghostVector: GhostVector;
}

export interface UserSettings {
  targetPaceMinKm: number;
  audioVolume: number;
  enableCRTShader: boolean;
  enableAudioAlerts: boolean;
  enableNitroBoost: boolean;
  stravaAccessToken?: string;
}

const RUNS_KEY = 'ghost_runner_saved_runs';
const SETTINGS_KEY = 'ghost_runner_user_settings';

export class StorageService {
  /**
   * Loads user preferences from LocalStorage with defaults.
   */
  public static getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('StorageService: Error loading user settings:', e);
    }
    return {
      targetPaceMinKm: 4.5,
      audioVolume: 0.8,
      enableCRTShader: true,
      enableAudioAlerts: true,
      enableNitroBoost: true
    };
  }

  /**
   * Persists user settings to LocalStorage.
   */
  public static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('StorageService: Error saving settings:', e);
    }
  }

  /**
   * Retrieves all completed runs and ghost vectors.
   */
  public static getSavedRuns(): SavedRun[] {
    try {
      const data = localStorage.getItem(RUNS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('StorageService: Error loading saved runs:', e);
    }
    return [];
  }

  /**
   * Saves a new completed run session.
   */
  public static saveRun(run: Omit<SavedRun, 'id'>): SavedRun {
    const runs = StorageService.getSavedRuns();
    const newRun: SavedRun = {
      ...run,
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
    runs.unshift(newRun);
    try {
      localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
    } catch (e) {
      console.error('StorageService: Error saving run:', e);
    }
    return newRun;
  }

  /**
   * Deletes a saved run by ID.
   */
  public static deleteRun(id: string): void {
    const runs = StorageService.getSavedRuns().filter(r => r.id !== id);
    try {
      localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
    } catch (e) {
      console.error('StorageService: Error deleting run:', e);
    }
  }
}
