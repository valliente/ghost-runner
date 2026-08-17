export interface BossProfile {
  id: string;
  name: string;
  maxHp: number;
  triggerDistanceMeters: number;
  battleDurationSeconds: number;
  mechanic: 'surge_escape' | 'negative_split' | 'cadence_surge';
  targetSpeedMs: number;
  description: string;
}

export interface BossBattleState {
  boss: BossProfile | null;
  currentHp: number;
  isEncounterActive: boolean;
  timeRemainingSec: number;
  attackTelegraph: string | null;
  isVictory: boolean;
  isDefeated: boolean;
}

export class BossRunMode {
  public static readonly BOSSES: BossProfile[] = [
    {
      id: 'boss_overdrive_mech',
      name: 'OVERDRIVE MECH // TITAN-01',
      maxHp: 1000,
      triggerDistanceMeters: 1000,
      battleDurationSeconds: 60,
      mechanic: 'surge_escape',
      targetSpeedMs: 4.2,
      description: 'EMP Surge Blast charging! Sprint above 4.2 m/s to damage core!'
    },
    {
      id: 'boss_neon_phantom',
      name: 'NEON PHANTOM // MIRAGE-X',
      maxHp: 1500,
      triggerDistanceMeters: 2500,
      battleDurationSeconds: 90,
      mechanic: 'negative_split',
      targetSpeedMs: 4.5,
      description: 'Chrono-Mirror active! Accelerate into negative split to shatter illusion!'
    },
    {
      id: 'boss_void_glitcher',
      name: 'VOID GLITCHER // NULL-BYTE',
      maxHp: 2000,
      triggerDistanceMeters: 4000,
      battleDurationSeconds: 120,
      mechanic: 'cadence_surge',
      targetSpeedMs: 4.8,
      description: 'Laser Grid sweeping track! Hold rhythm cadence > 175 SPM to overload grid!'
    }
  ];

  private activeBoss: BossProfile | null = null;
  private currentHp: number = 0;
  private timeRemainingSec: number = 0;
  private completedBossIds: Set<string> = new Set();

  public update(
    currentDistanceMeters: number,
    playerSpeedMs: number,
    playerCadenceSpm: number = 165,
    deltaSec: number
  ): BossBattleState {
    // 1. Check for Boss Trigger if no active encounter
    if (!this.activeBoss) {
      for (const boss of BossRunMode.BOSSES) {
        if (!this.completedBossIds.has(boss.id) && currentDistanceMeters >= boss.triggerDistanceMeters && currentDistanceMeters <= boss.triggerDistanceMeters + 200) {
          this.activeBoss = boss;
          this.currentHp = boss.maxHp;
          this.timeRemainingSec = boss.battleDurationSeconds;
          break;
        }
      }
    }

    if (!this.activeBoss) {
      return {
        boss: null,
        currentHp: 0,
        isEncounterActive: false,
        timeRemainingSec: 0,
        attackTelegraph: null,
        isVictory: false,
        isDefeated: false
      };
    }

    this.timeRemainingSec = Math.max(0, this.timeRemainingSec - deltaSec);

    // 2. Damage calculations based on boss mechanic
    let damageRate = 0;
    let telegraph = null;

    if (this.activeBoss.mechanic === 'surge_escape') {
      if (playerSpeedMs >= this.activeBoss.targetSpeedMs) {
        damageRate = (playerSpeedMs - this.activeBoss.targetSpeedMs + 1) * 45;
        telegraph = '⚡ CORE VULNERABLE! SURGE ACTIVE!';
      } else {
        telegraph = `⚠️ EMP CHARGING! SPEED UP TO ${(this.activeBoss.targetSpeedMs * 3.6).toFixed(1)} KM/H!`;
      }
    } else if (this.activeBoss.mechanic === 'negative_split') {
      if (playerSpeedMs >= this.activeBoss.targetSpeedMs) {
        damageRate = 35;
        telegraph = '⚔️ ILLUSION CRACKING! MAINTAIN ATTACK PACE!';
      } else {
        telegraph = '⚠️ MIRAGE MATCHING SPEED! ACCELERATE!';
      }
    } else if (this.activeBoss.mechanic === 'cadence_surge') {
      if (playerCadenceSpm >= 175) {
        damageRate = 40;
        telegraph = '⚡ HIGH CADENCE HARMONY OVERLOADING NULL-GRID!';
      } else {
        telegraph = '⚠️ LASER GRID APPROACHING! INCREASE CADENCE TO 180+ SPM!';
      }
    }

    this.currentHp = Math.max(0, this.currentHp - damageRate * deltaSec);

    const isDefeated = this.currentHp <= 0;
    const isTimeout = this.timeRemainingSec <= 0 && !isDefeated;

    if (isDefeated) {
      this.completedBossIds.add(this.activeBoss.id);
      const defeatedBoss = this.activeBoss;
      this.activeBoss = null;
      return {
        boss: defeatedBoss,
        currentHp: 0,
        isEncounterActive: false,
        timeRemainingSec: 0,
        attackTelegraph: '💥 BOSS DESTROYED! CYBER RUNNER TRIUMPH!',
        isVictory: true,
        isDefeated: true
      };
    }

    if (isTimeout) {
      this.activeBoss = null;
      return {
        boss: null,
        currentHp: 0,
        isEncounterActive: false,
        timeRemainingSec: 0,
        attackTelegraph: '⚠️ BOSS ESCAPED! RE-ENGAGE ON NEXT RUN!',
        isVictory: false,
        isDefeated: false
      };
    }

    return {
      boss: this.activeBoss,
      currentHp: Math.round(this.currentHp),
      isEncounterActive: true,
      timeRemainingSec: Math.round(this.timeRemainingSec),
      attackTelegraph: telegraph,
      isVictory: false,
      isDefeated: false
    };
  }

  public reset(): void {
    this.activeBoss = null;
    this.currentHp = 0;
    this.timeRemainingSec = 0;
    this.completedBossIds.clear();
  }
}
