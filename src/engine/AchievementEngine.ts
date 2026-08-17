export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface RunCheckStats {
  distanceMeters: number;
  durationSeconds: number;
  avgPaceMinKm: number;
  elevationGainMeters: number;
  maxSpeedMs: number;
  avgCadenceSpm: number;
  beatGhost: boolean;
  isNight: boolean;
  isRain: boolean;
}

export class AchievementEngine {
  private static readonly STORAGE_KEY = 'ghost_achievements_unlocked';

  public static readonly ALL_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_stride', title: 'First Stride', description: 'Complete your first workout run.', icon: '👟', xpReward: 100 },
    { id: 'sub20_5k', title: 'Sub-20 5K', description: 'Break the 20-minute barrier on a 5km course.', icon: '⚡', xpReward: 500 },
    { id: 'night_stride', title: 'Night Stride', description: 'Complete a neon night run under the cyber moon.', icon: '🌙', xpReward: 150 },
    { id: 'elevation_conqueror', title: 'Elevation Conqueror', description: 'Climb over 100m total elevation gain in one session.', icon: '⛰️', xpReward: 300 },
    { id: 'streak_master', title: 'Streak Master', description: 'Log runs across multiple active days.', icon: '🔥', xpReward: 250 },
    { id: 'ghost_hunter', title: 'Ghost Hunter', description: 'Defeat a ghost vector in a real-time race.', icon: '👻', xpReward: 200 },
    { id: 'nitro_overdrive', title: 'Nitro Overdrive', description: 'Hit top running velocity exceeding 5.5 m/s.', icon: '🚀', xpReward: 350 },
    { id: 'half_marathoner', title: 'Half Marathoner', description: 'Conquer a continuous 21.1 km long-distance run.', icon: '🏅', xpReward: 1000 },
    { id: 'cadence_master', title: 'Cadence Master', description: 'Maintain high rhythmic efficiency above 180 SPM.', icon: '🥁', xpReward: 250 },
    { id: 'century_runner', title: 'Century Runner', description: 'Accumulate 100+ km of career telemetry distance.', icon: '👑', xpReward: 1500 },
    { id: 'cyber_collector', title: 'Cyber Collector', description: 'Equip an unlocked avatar skin in the Cyber Garage.', icon: '🤖', xpReward: 150 },
    { id: 'boss_slayer', title: 'Boss Slayer', description: 'Defeat an arcade Cyber Boss in battle mode.', icon: '⚔️', xpReward: 600 },
    { id: 'rain_runner', title: 'Rain Runner', description: 'Complete a workout during neon rain weather.', icon: '🌧️', xpReward: 200 },
    { id: 'pacer_beater', title: 'Pacer Slayer', description: 'Outpace the AI Pacer Bot across a full route.', icon: '🎯', xpReward: 300 },
    { id: 'cloud_racer', title: 'Cloud Racer', description: 'Download and challenge a peer cloud ghost track.', icon: '🌐', xpReward: 200 }
  ];

  public static getUnlockedIds(): string[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [];
  }

  public static saveUnlockedIds(ids: string[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('Failed to save unlocked achievements:', e);
    }
  }

  /**
   * Evaluates workout metrics against achievement rules and triggers celebratory banners.
   */
  public static evaluateRun(stats: RunCheckStats): Achievement[] {
    const unlocked = new Set(this.getUnlockedIds());
    const newlyUnlocked: Achievement[] = [];

    const unlock = (id: string) => {
      if (!unlocked.has(id)) {
        unlocked.add(id);
        const ach = this.ALL_ACHIEVEMENTS.find((a) => a.id === id);
        if (ach) {
          newlyUnlocked.push(ach);
          this.triggerBanner(ach);
        }
      }
    };

    if (stats.distanceMeters >= 1000) unlock('first_stride');
    if (stats.distanceMeters >= 5000 && stats.avgPaceMinKm > 0 && stats.avgPaceMinKm < 4.0) unlock('sub20_5k');
    if (stats.isNight) unlock('night_stride');
    if (stats.elevationGainMeters >= 100) unlock('elevation_conqueror');
    if (stats.beatGhost) unlock('ghost_hunter');
    if (stats.maxSpeedMs >= 5.5) unlock('nitro_overdrive');
    if (stats.distanceMeters >= 21097) unlock('half_marathoner');
    if (stats.avgCadenceSpm >= 180) unlock('cadence_master');
    if (stats.isRain) unlock('rain_runner');

    if (newlyUnlocked.length > 0) {
      this.saveUnlockedIds(Array.from(unlocked));
    }

    return newlyUnlocked;
  }

  /**
   * Displays an 8-bit arcade celebratory banner at the top of the screen.
   */
  public static triggerBanner(ach: Achievement): void {
    if (typeof document === 'undefined') return;

    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.top = '20px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.background = 'linear-gradient(135deg, #160a2c, #050014)';
    banner.style.border = '2px solid #ffd700';
    banner.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.6)';
    banner.style.borderRadius = '8px';
    banner.style.padding = '12px 24px';
    banner.style.zIndex = '99999';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.gap = '14px';
    banner.style.fontFamily = 'monospace';
    banner.style.color = '#fff';
    banner.style.animation = 'fadeInDown 0.4s ease';

    banner.innerHTML = `
      <div style="font-size: 2rem;">${ach.icon}</div>
      <div>
        <div style="color: #ffd700; font-size: 0.75rem; font-weight: bold; letter-spacing: 1px;">TROPHY UNLOCKED!</div>
        <div style="font-size: 1.1rem; font-weight: bold; color: #00f3ff;">${ach.title}</div>
        <div style="font-size: 0.75rem; color: #8b949e;">${ach.description} (+${ach.xpReward} XP)</div>
      </div>
    `;

    document.body.appendChild(banner);

    setTimeout(() => {
      if (banner.parentNode) {
        banner.style.opacity = '0';
        banner.style.transition = 'opacity 0.5s ease';
        setTimeout(() => banner.remove(), 500);
      }
    }, 4500);
  }
}
