export interface BossState {
  name: string;
  maxHp: number;
  currentHp: number;
  targetSpeedMs: number;
  triggerDistanceMeters: number;
  isDefeated: boolean;
  isActive: boolean;
}

export class BossRunMode {
  private activeBoss: BossState | null = null;

  public checkBossSpawns(currentDistanceMeters: number): BossState | null {
    if (this.activeBoss && this.activeBoss.isActive) {
      return this.activeBoss;
    }

    // Spawn Bosses at 1km, 2.5km, and 4km markers
    if (currentDistanceMeters >= 1000 && currentDistanceMeters < 1100 && !this.activeBoss) {
      this.activeBoss = {
        name: 'CYBER MECHA RUNNER',
        maxHp: 100,
        currentHp: 100,
        targetSpeedMs: 4.2,
        triggerDistanceMeters: 1000,
        isDefeated: false,
        isActive: true
      };
    } else if (currentDistanceMeters >= 2500 && currentDistanceMeters < 2600 && (!this.activeBoss || this.activeBoss.isDefeated)) {
      this.activeBoss = {
        name: 'SYNTH DRAGON V2',
        maxHp: 150,
        currentHp: 150,
        targetSpeedMs: 4.6,
        triggerDistanceMeters: 2500,
        isDefeated: false,
        isActive: true
      };
    }

    return this.activeBoss;
  }

  public updateBossBattle(playerSpeedMs: number, deltaSec: number): BossState | null {
    if (!this.activeBoss || !this.activeBoss.isActive || this.activeBoss.isDefeated) {
      return null;
    }

    // Damage Boss if Player speed exceeds Boss target speed
    if (playerSpeedMs > this.activeBoss.targetSpeedMs) {
      const damage = (playerSpeedMs - this.activeBoss.targetSpeedMs) * 15 * deltaSec;
      this.activeBoss.currentHp = Math.max(0, this.activeBoss.currentHp - damage);

      if (this.activeBoss.currentHp <= 0) {
        this.activeBoss.isDefeated = true;
        this.activeBoss.isActive = false;
        import('../audio/SFXEngine').then(({ sfxEngine }) => sfxEngine.playMilestone());
      }
    }

    return this.activeBoss;
  }

  public getActiveBoss(): BossState | null {
    return this.activeBoss;
  }
}
