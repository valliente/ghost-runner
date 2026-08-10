import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { RunnerScene } from './scenes/RunnerScene';
import { AdaptiveAudioEngine } from './audio/AdaptiveAudio';
import { GPXParser } from './services/GPXParser';
import { GhostEngine } from './engine/GhostEngine';
import './style.css';

// Build UI HTML structure
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header>
    <h1>Ghost Runner</h1>
    <p>Retro 2D Adaptive Fitness Engine</p>
  </header>

  <div id="game-container"></div>

  <div class="controls-panel">
    <div class="btn-group">
      <button id="btn-start" class="btn">Start Run</button>
      <button id="btn-pause" class="btn btn-pink">Pause</button>
      <button id="btn-reset" class="btn">Reset</button>
      <label class="btn btn-pink" style="display:inline-block; cursor:pointer;">
        Load GPX
        <input type="file" id="gpx-input" accept=".gpx" style="display:none;" />
      </label>
    </div>

    <div class="slider-group">
      <label for="speed-slider">Pace Simulator:</label>
      <input type="range" id="speed-slider" min="1.0" max="8.0" step="0.1" value="4.0" />
      <span id="speed-val" style="font-family:monospace; color:#00f3ff;">14.4 km/h</span>
    </div>
  </div>

  <div class="hud-bar">
    <div class="hud-item">AUDIO TEMPO: <span id="tempo-val" class="val-cyan">1.00x</span></div>
    <div class="hud-item">PACING RATIO: <span id="pacing-val" class="val-pink">100%</span></div>
  </div>
`;

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

// UI Elements
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const gpxInput = document.getElementById('gpx-input') as HTMLInputElement;
const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
const speedVal = document.getElementById('speed-val') as HTMLSpanElement;
const tempoVal = document.getElementById('tempo-val') as HTMLSpanElement;
const pacingVal = document.getElementById('pacing-val') as HTMLSpanElement;

let runnerScene: RunnerScene | null = null;

// Wait for Phaser scene initialization
game.events.on(Phaser.Core.Events.READY, () => {
  runnerScene = game.scene.getScene('RunnerScene') as RunnerScene;

  // Listen to pace update callback from Phaser physics update loop
  runnerScene.setOnPaceUpdate((_playerSpeed, _ghostSpeed, ratio) => {
    const tempo = audioEngine.updateTempoFromPaceDelta(ratio);
    tempoVal.textContent = `${tempo.toFixed(2)}x`;
    pacingVal.textContent = `${(ratio * 100).toFixed(0)}%`;
  });
});

// Button Controls
btnStart.addEventListener('click', async () => {
  await audioEngine.init();
  await audioEngine.loadSynthwaveTrack();
  audioEngine.startMusic();
  audioEngine.triggerSFX('boost');
  if (runnerScene) {
    runnerScene.startRun();
  }
});

btnPause.addEventListener('click', () => {
  audioEngine.stopMusic();
  audioEngine.triggerSFX('button');
  if (runnerScene) {
    runnerScene.pauseRun();
  }
});

btnReset.addEventListener('click', () => {
  audioEngine.stopMusic();
  audioEngine.triggerSFX('button');
  if (runnerScene) {
    runnerScene.resetRun();
  }
});

// Pace Simulator Slider
speedSlider.addEventListener('input', () => {
  const speedMs = parseFloat(speedSlider.value);
  const speedKmh = (speedMs * 3.6).toFixed(1);
  speedVal.textContent = `${speedKmh} km/h`;
  if (runnerScene) {
    runnerScene.setPlayerSpeed(speedMs);
  }
});

// GPX Telemetry File Upload
gpxInput.addEventListener('change', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const xmlText = evt.target?.result as string;
      if (xmlText) {
        const ghostVector = GPXParser.parseGPX(xmlText);
        const engine = new GhostEngine(ghostVector);
        if (runnerScene) {
          runnerScene.setGhostEngine(engine);
          audioEngine.triggerSFX('checkpoint');
          alert(`Loaded Ghost GPX telemetry! ${ghostVector.points.length} data points, ${(ghostVector.totalDistance / 1000).toFixed(2)} km.`);
        }
      }
    };
    reader.readAsText(file);
  }
});
