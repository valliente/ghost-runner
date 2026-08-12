import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ghostrunner.app',
  appName: 'Ghost Runner',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      // Background location continuous tracking configuration
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
