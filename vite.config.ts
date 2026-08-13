import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
          if (id.includes('node_modules/tone')) {
            return 'tone';
          }
          if (id.includes('node_modules/@capacitor')) {
            return 'capacitor';
          }
        }
      }
    }
  }
});
