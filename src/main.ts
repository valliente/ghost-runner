import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { RunnerScene } from './scenes/RunnerScene';
import { AdaptiveAudioEngine } from './audio/AdaptiveAudio';
import { GPXParserService } from './services/GPXParserService';
import { GhostEngine } from './engine/GhostEngine';
import './style.css';

// Initialize Phaser 3 Game Configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, RunnerScene]
};

const game = new Phaser.Game(config);
const audioEngine = new AdaptiveAudioEngine();

// UI Dashboard DOM Elements
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const gpxInput = document.getElementById('gpx-input') as HTMLInputElement;

const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
const speedVal = document.getElementById('speed-val') as HTMLSpanElement;

const hudTime = document.getElementById('hud-time') as HTMLDivElement;
const hudDist = document.getElementById('hud-dist') as HTMLDivElement;
const hudPace = document.getElementById('hud-pace') as HTMLDivElement;
const hudDelta = document.getElementById('hud-delta') as HTMLDivElement;
const hudBpm = document.getElementById('hud-bpm') as HTMLDivElement;

let runnerScene: RunnerScene | null = null;

// Bind Phaser scene once ready
game.events.on(Phaser.Core.Events.READY, () => {
  runnerScene = game.scene.getScene('RunnerScene') as RunnerScene;

  // Bind live frame-by-frame metrics callback from Phaser game loop
  runnerScene.setOnMetricsUpdate((metrics) => {
    // 1. Time Elapsed
    hudTime.textContent = formatTime(metrics.elapsedSeconds);

    // 2. Distance in KM
    hudDist.textContent = `${metrics.playerDistanceKm.toFixed(2)} km`;

    // 3. Current Pace
    hudPace.textContent = formatPace(metrics.playerPaceMinKm);

    // 4. Pace Delta vs Ghost
    const deltaInfo = formatPaceDelta(metrics.paceDeltaSecKm);
    hudDelta.textContent = deltaInfo.text;
    hudDelta.className = deltaInfo.isAhead ? 'hud-value val-cyan' : 'hud-value val-pink';

    // 5. Procedural Synthwave Audio Adaptation
    const audioState = audioEngine.updateTempoAndTone(metrics.paceRatio);
    hudBpm.textContent = `${Math.round(audioState.bpm)} BPM`;
  });
});

// Button Handlers
btnStart.addEventListener('click', async () => {
  await audioEngine.startMusic();
  if (runnerScene) {
    runnerScene.startRun();
  }
});

btnPause.addEventListener('click', () => {
  audioEngine.stopMusic();
  if (runnerScene) {
    runnerScene.pauseRun();
  }
});

btnReset.addEventListener('click', () => {
  audioEngine.stopMusic();
  if (runnerScene) {
    runnerScene.resetRun();
  }
  resetHudDisplay();
});

// Pace Controller Slider Handler
speedSlider.addEventListener('input', () => {
  const speedMs = parseFloat(speedSlider.value);
  const kmh = (speedMs * 3.6).toFixed(1);
  const paceMinKm = speedMs > 0 ? (1000 / (speedMs * 60)) : 0;
  speedVal.textContent = `${formatPace(paceMinKm)} (${kmh} km/h)`;

  if (runnerScene) {
    runnerScene.setPlayerSpeed(speedMs);
  }
});

// Custom GPX File Upload Handler
gpxInput.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const xmlText = evt.target?.result as string;
      if (xmlText) {
        try {
          const ghostVector = GPXParserService.parseGPX(xmlText);
          const engine = new GhostEngine(ghostVector);
          if (runnerScene) {
            runnerScene.setGhostEngine(engine);
            alert(`Parsed custom GPX file successfully!\nTrack Points: ${ghostVector.points.length}\nDistance: ${(ghostVector.totalDistance / 1000).toFixed(2)} km`);
          }
        } catch (err: any) {
          alert(`Error parsing GPX file: ${err?.message || err}`);
        }
      }
    };
    reader.readAsText(file);
  }
});

// Window File Drag-and-Drop Listener (HTML5 & Tauri PC app support)
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0];
    if (file.name.endsWith('.gpx')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const xmlText = evt.target?.result as string;
        if (xmlText) {
          try {
            const vector = GPXParserService.parseGPX(xmlText);
            const engine = new GhostEngine(vector);
            if (runnerScene) {
              runnerScene.setGhostEngine(engine);
              alert(`Dragged GPX track loaded: ${file.name} (${(vector.totalDistance / 1000).toFixed(2)} km)`);
            }
          } catch (err: any) {
            alert(`Error parsing dropped GPX: ${err?.message || err}`);
          }
        }
      };
      reader.readAsText(file);
    }
  }
});
// Android Native Back Button Handler
try {
  import('@capacitor/app').then(({ App }) => {
    App.addListener('backButton', ({ canGoBack }) => {
      if (runnerScene && runnerScene.getGameState() === 'RUNNING') {
        runnerScene.pauseRun();
        alert('Run paused via Android Back Button.');
      } else if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });
  }).catch(() => {});
} catch (e) {
  // Ignored in non-Capacitor web environment
}

function formatTime(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatPace(paceMinKm: number): string {
  if (!paceMinKm || !isFinite(paceMinKm) || paceMinKm <= 0) return '0:00 /km';
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

function formatPaceDelta(deltaSecKm: number): { text: string; isAhead: boolean } {
  const absSec = Math.abs(Math.round(deltaSecKm));
  const mins = Math.floor(absSec / 60);
  const secs = absSec % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')} /km`;
  if (deltaSecKm <= 0) {
    return { text: `-${timeStr} ahead`, isAhead: true };
  } else {
    return { text: `+${timeStr} behind`, isAhead: false };
  }
}

function resetHudDisplay() {
  hudTime.textContent = '00:00';
  hudDist.textContent = '0.00 km';
  hudPace.textContent = '4:10 /km';
  hudDelta.textContent = '0:00 /km';
  hudBpm.textContent = '120 BPM';
}
