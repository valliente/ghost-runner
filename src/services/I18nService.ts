export type SupportedLocale = 'en' | 'es' | 'ja' | 'de' | 'fr';

export interface TranslationDictionary {
  // Navigation & Menu
  app_title: string;
  start_run: string;
  free_run: string;
  select_track: string;
  cyber_garage: string;
  training_matrix: string;
  leaderboard: string;
  settings: string;
  close: string;
  race_ghost: string;
  quick_run: string;

  // HUD & Telemetry
  pace: string;
  distance: string;
  ghost_delta: string;
  heart_rate: string;
  cadence: string;
  slipstream_active: string;
  drafting_boost: string;
  target_pace: string;

  // Workouts & Intervals
  workout_complete: string;
  interval_warmup: string;
  interval_work: string;
  interval_rest: string;
  interval_cooldown: string;

  // Post Run Summary
  summary_title: string;
  total_time: string;
  avg_pace: string;
  elevation_gain: string;
  new_record: string;
}

export class I18nService {
  private static instance: I18nService | null = null;
  private static readonly STORAGE_KEY = 'ghost_runner_locale';

  private currentLocale: SupportedLocale = 'en';

  public static readonly TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
    en: {
      app_title: 'GHOST RUNNER',
      start_run: 'START RUN',
      free_run: 'FREE RUN',
      select_track: 'SELECT TRACK',
      cyber_garage: 'CYBER GARAGE',
      training_matrix: 'TRAINING MATRIX',
      leaderboard: 'LEADERBOARD',
      settings: 'SETTINGS',
      close: 'CLOSE',
      race_ghost: 'RACE GHOST',
      quick_run: 'QUICK RUN',
      pace: 'PACE',
      distance: 'DISTANCE',
      ghost_delta: 'GHOST DELTA',
      heart_rate: 'HEART RATE',
      cadence: 'CADENCE',
      slipstream_active: 'SLIPSTREAM ACTIVE',
      drafting_boost: 'DRAFTING BOOST',
      target_pace: 'TARGET PACE',
      workout_complete: 'WORKOUT COMPLETE',
      interval_warmup: 'WARMUP',
      interval_work: 'WORK',
      interval_rest: 'REST',
      interval_cooldown: 'COOLDOWN',
      summary_title: 'POST-RUN TELEMETRY // SUMMARY',
      total_time: 'TOTAL TIME',
      avg_pace: 'AVG PACE',
      elevation_gain: 'ELEVATION GAIN',
      new_record: 'NEW RECORD!'
    },
    es: {
      app_title: 'GHOST RUNNER',
      start_run: 'INICIAR CARRERA',
      free_run: 'CARRERA LIBRE',
      select_track: 'SELECCIONAR PISTA',
      cyber_garage: 'GARAJE CIBERNÉTICO',
      training_matrix: 'MATRIZ DE ENTRENAMIENTO',
      leaderboard: 'CLASIFICACIÓN',
      settings: 'AJUSTES',
      close: 'CERRAR',
      race_ghost: 'CORRER VS FANTASMA',
      quick_run: 'CARRERA RÁPIDA',
      pace: 'RITMO',
      distance: 'DISTANCIA',
      ghost_delta: 'DELTA FANTASMA',
      heart_rate: 'PULSO',
      cadence: 'CADENCIA',
      slipstream_active: 'REBUFO ACTIVO',
      drafting_boost: 'IMPULSO DE REBUFO',
      target_pace: 'RITMO OBJETIVO',
      workout_complete: 'ENTRENAMIENTO COMPLETADO',
      interval_warmup: 'CALENTAMIENTO',
      interval_work: 'TRABAJO',
      interval_rest: 'DESCANSO',
      interval_cooldown: 'ENFRIAMIENTO',
      summary_title: 'TELEMETRÍA POST-CARRERA // RESUMEN',
      total_time: 'TIEMPO TOTAL',
      avg_pace: 'RITMO MEDIO',
      elevation_gain: 'DESNIVEL POSITIVO',
      new_record: '¡NUEVO RÉCORD!'
    },
    ja: {
      app_title: 'ゴーストランナー',
      start_run: 'ラン開始',
      free_run: 'フリーラン',
      select_track: 'トラック選択',
      cyber_garage: 'サイバーガレージ',
      training_matrix: 'トレーニングマトリクス',
      leaderboard: 'リーダーボード',
      settings: '設定',
      close: '閉じる',
      race_ghost: 'ゴーストに対戦',
      quick_run: 'クイックラン',
      pace: 'ペース',
      distance: '距離',
      ghost_delta: 'ゴースト差',
      heart_rate: '心拍数',
      cadence: 'ピッチ',
      slipstream_active: 'スリップストリーム発動',
      drafting_boost: '加速ボーナス',
      target_pace: '目標ペース',
      workout_complete: 'トレーニング終了',
      interval_warmup: 'ウォームアップ',
      interval_work: '疾走',
      interval_rest: '休息',
      interval_cooldown: 'クールダウン',
      summary_title: 'ラン結果 // サマリー',
      total_time: '走行時間',
      avg_pace: '平均ペース',
      elevation_gain: '獲得標高',
      new_record: '新記録達成！'
    },
    de: {
      app_title: 'GHOST RUNNER',
      start_run: 'LAUF STARTEN',
      free_run: 'FREIER LAUF',
      select_track: 'STRECKE WÄHLEN',
      cyber_garage: 'CYBER-GARAGE',
      training_matrix: 'TRAININGS-MATRIX',
      leaderboard: 'BESTENLISTE',
      settings: 'EINSTELLUNGEN',
      close: 'SCHLIESSEN',
      race_ghost: 'GEGEN GHOST LAUFEN',
      quick_run: 'SCHNELLER LAUF',
      pace: 'TEMPO',
      distance: 'DISTANZ',
      ghost_delta: 'GHOST-ABSTAND',
      heart_rate: 'HERZFREQUENZ',
      cadence: 'SCHRITTFREQUENZ',
      slipstream_active: 'WINDSCHATTEN AKTIV',
      drafting_boost: 'TEMPO-BOOST',
      target_pace: 'ZIEL-TEMPO',
      workout_complete: 'WORKOUT BEENDET',
      interval_warmup: 'AUFWÄRMEN',
      interval_work: 'BELASTUNG',
      interval_rest: 'PAUSE',
      interval_cooldown: 'ABKÜHLEN',
      summary_title: 'LAUF-TELEMETRIE // ZUSAMMENFASSUNG',
      total_time: 'GESAMTZEIT',
      avg_pace: 'DURCHSCHN. TEMPO',
      elevation_gain: 'HÖHENMETER',
      new_record: 'NEUER REKORD!'
    },
    fr: {
      app_title: 'GHOST RUNNER',
      start_run: 'LANCER LA COURSE',
      free_run: 'COURSE LIBRE',
      select_track: 'CHOISIR PARCOURS',
      cyber_garage: 'GARAGE CYBER',
      training_matrix: 'MATRICE D\'ENTRAÎNEMENT',
      leaderboard: 'CLASSEMENT',
      settings: 'PARAMÈTRES',
      close: 'FERMER',
      race_ghost: 'DÉFIER LE GHOST',
      quick_run: 'DÉPART RAPIDE',
      pace: 'ALLURE',
      distance: 'DISTANCE',
      ghost_delta: 'ÉCART GHOST',
      heart_rate: 'FRÉQ. CARDIAQUE',
      cadence: 'CADENCE',
      slipstream_active: 'ASASPIRATION ACTIVE',
      drafting_boost: 'BOOST D\'ASPIRATION',
      target_pace: 'ALLURE CIBLE',
      workout_complete: 'ENTRAÎNEMENT TERMINÉ',
      interval_warmup: 'ÉCHAUFFEMENT',
      interval_work: 'EFFORT',
      interval_rest: 'RÉCUPÉRATION',
      interval_cooldown: 'RÉCUP FINALE',
      summary_title: 'TÉLÉMÉTRIE DE COURSE // RÉSUMÉ',
      total_time: 'TEMPS TOTAL',
      avg_pace: 'ALLURE MOYENNE',
      elevation_gain: 'DÉNIVELÉ POSITIF',
      new_record: 'NOUVEAU RECORD !'
    }
  };

  private constructor() {
    this.currentLocale = this.loadLocale();
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  private loadLocale(): SupportedLocale {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(I18nService.STORAGE_KEY) as SupportedLocale;
        if (saved && I18nService.TRANSLATIONS[saved]) {
          return saved;
        }
      } catch (e) {
        // fallback
      }
    }
    return this.detectSystemLocale();
  }

  public detectSystemLocale(): SupportedLocale {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const code = navigator.language.substring(0, 2).toLowerCase();
      if (code in I18nService.TRANSLATIONS) {
        return code as SupportedLocale;
      }
    }
    return 'en';
  }

  public setLocale(locale: SupportedLocale): void {
    if (I18nService.TRANSLATIONS[locale]) {
      this.currentLocale = locale;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(I18nService.STORAGE_KEY, locale);
        } catch (e) {
          // ignore
        }
      }
    }
  }

  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  public t(key: keyof TranslationDictionary): string {
    const dict = I18nService.TRANSLATIONS[this.currentLocale] || I18nService.TRANSLATIONS.en;
    return dict[key] || I18nService.TRANSLATIONS.en[key] || key;
  }
}

export const i18n = I18nService.getInstance();
