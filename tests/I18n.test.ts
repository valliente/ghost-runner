import { describe, it, expect } from 'vitest';
import { I18nService, type SupportedLocale } from '../src/services/I18nService';

describe('I18nService Internationalization Engine', () => {
  const service = I18nService.getInstance();
  const locales: SupportedLocale[] = ['en', 'es', 'ja', 'de', 'fr'];

  it('should have complete dictionary parity across all supported languages', () => {
    const enKeys = Object.keys(I18nService.TRANSLATIONS.en);
    expect(enKeys.length).toBeGreaterThanOrEqual(20);

    locales.forEach((loc) => {
      const dict = I18nService.TRANSLATIONS[loc];
      expect(dict).toBeDefined();

      enKeys.forEach((key) => {
        expect(dict).toHaveProperty(key);
        expect((dict as any)[key]).toBeTruthy();
      });
    });
  });

  it('should switch locale and return localized translation strings', () => {
    service.setLocale('ja');
    expect(service.t('start_run')).toBe('ラン開始');
    expect(service.t('slipstream_active')).toBe('スリップストリーム発動');

    service.setLocale('es');
    expect(service.t('start_run')).toBe('INICIAR CARRERA');
    expect(service.t('summary_title')).toBe('TELEMETRÍA POST-CARRERA // RESUMEN');

    service.setLocale('de');
    expect(service.t('start_run')).toBe('LAUF STARTEN');
    expect(service.t('cadence')).toBe('SCHRITTFREQUENZ');

    service.setLocale('fr');
    expect(service.t('start_run')).toBe('LANCER LA COURSE');
    expect(service.t('workout_complete')).toBe('ENTRAÎNEMENT TERMINÉ');

    // Reset to English
    service.setLocale('en');
    expect(service.t('start_run')).toBe('START RUN');
  });
});
