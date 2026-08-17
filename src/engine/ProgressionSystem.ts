export interface RunnerProfile {
  level: number;
  currentXp: number;
  totalXp: number;
  totalDistanceMeters: number;
  totalRunsCompleted: number;
  ghostsDefeated: number;
  attributePointsAvailable: number;
  attributes: {
    stamina: number; // Level 1 to 50
    speed: number;
    cadence: number;
    overdrive: number;
  };
}

export interface RunReward {
  baseXp: number;
  ghostBonusXp: number;
  elevationBonusXp: number;
  consistencyBonusXp: number;
  totalXpAwarded: number;
  leveledUp: boolean;
  newLevel?: number;
}

export class ProgressionSystem {
  private static readonly STORAGE_KEY = 'ghost_runner_progression_profile';

  public static getProfile(): RunnerProfile {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load runner progression profile:', e);
    }

    return {
      level: 1,
      currentXp: 0,
      totalXp: 0,
      totalDistanceMeters: 0,
      totalRunsCompleted: 0,
      ghostsDefeated: 0,
      attributePointsAvailable: 0,
      attributes: {
        stamina: 1,
        speed: 1,
        cadence: 1,
        overdrive: 1
      }
    };
  }

  public static saveProfile(profile: RunnerProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save runner progression profile:', e);
    }
  }

  public static getXpForNextLevel(level: number): number {
    return Math.floor(800 * Math.pow(1.22, Math.max(0, level - 1)));
  }

  /**
   * Calculates and applies XP rewards after finishing a workout.
   */
  public static awardRunRewards(
    distanceMeters: number,
    _durationSec: number,
    beatGhost: boolean,
    elevationGainMeters: number = 0,
    paceConsistencyRatio: number = 0.9
  ): RunReward {
    const profile = this.getProfile();

    // 1. Base XP: 100 XP per km
    const baseXp = Math.floor((distanceMeters / 1000) * 100);

    // 2. Ghost Defeat Bonus
    const ghostBonusXp = beatGhost ? 150 : 0;

    // 3. Elevation Bonus: 2 XP per vertical meter
    const elevationBonusXp = Math.floor(elevationGainMeters * 2);

    // 4. Consistency Bonus
    const consistencyBonusXp = paceConsistencyRatio > 0.85 ? 50 : 0;

    const totalXp = baseXp + ghostBonusXp + elevationBonusXp + consistencyBonusXp;

    profile.totalDistanceMeters += distanceMeters;
    profile.totalRunsCompleted += 1;
    if (beatGhost) profile.ghostsDefeated += 1;
    profile.totalXp += totalXp;
    profile.currentXp += totalXp;

    let leveledUp = false;
    let nextLevelReq = this.getXpForNextLevel(profile.level);

    while (profile.currentXp >= nextLevelReq) {
      profile.currentXp -= nextLevelReq;
      profile.level += 1;
      profile.attributePointsAvailable += 2;
      leveledUp = true;
      nextLevelReq = this.getXpForNextLevel(profile.level);
    }

    this.saveProfile(profile);

    return {
      baseXp,
      ghostBonusXp,
      elevationBonusXp,
      consistencyBonusXp,
      totalXpAwarded: totalXp,
      leveledUp,
      newLevel: leveledUp ? profile.level : undefined
    };
  }

  public static allocatePoint(stat: 'stamina' | 'speed' | 'cadence' | 'overdrive'): boolean {
    const profile = this.getProfile();
    if (profile.attributePointsAvailable <= 0) return false;

    profile.attributes[stat] += 1;
    profile.attributePointsAvailable -= 1;
    this.saveProfile(profile);
    return true;
  }
}
