# Ghost Runner 🏃‍♂️👻

> **Retro 2D Hybrid Fitness Engine for PC & Mobile**

Ghost Runner is a retro 80s-inspired cyberpunk 2D side-scrolling fitness application. It combines real-time GPS telemetry tracking, GPX workout parsing, dynamic Phaser 2D pixel-art graphics, and zero-dependency procedural synthwave audio loops using Tone.js.

![Ghost Runner Overview](https://img.shields.io/badge/Platform-PC%20%7C%20Android-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Phaser%203%20%7C%20Tone.js%20%7C%20Capacitor%20%7C%20Tauri-pink?style=for-the-badge)

---

## 🌟 Key Features

- 🏎️ **Ghost Telemetry Engine**: Frame-by-frame linear vector interpolation of previous runs or GPX time-series data.
- 🎵 **Adaptive Synthwave Audio**: Zero-external-dependency Web Audio synthesizers (Bass, PolySynth Lead, Drums). The `Tone.Transport.bpm` and low-pass filter frequency dynamically adjust based on your live pace delta against the ghost.
- 📊 **Real-Time HUD & Analytics Dashboard**: Live metrics for current pace (`min/km`), total distance, elapsed duration, pace delta (`ahead`/`behind`), and 1km split times.
- 👹 **Arcade Boss Run Mode**: Boss fights spawn at distance markers requiring sustained speed intervals to defeat.
- ⚡ **Nitro Boost**: Maintaining pace 15% faster than target for 30 seconds triggers a Nitro Sprint multiplier and cyan visual aura.
- 📍 **GPS & GPX Support**: Native `@capacitor/geolocation` support for Android continuous tracking and drag-and-drop `.gpx` file parsing.
- 📱 **Cross-Platform Desktop & Mobile**: Desktop PC app powered by **Tauri** and Android app powered by **Capacitor**.

---

## 📁 Repository Architecture

```
ghost-runner/
├── android/                   # Capacitor Android Native Project & AndroidStudio workspace
├── src-tauri/                 # Tauri Rust desktop windowing configuration
├── src/
│   ├── engine/
│   │   ├── GhostEngine.ts     # Telemetry interpolation & vector mathematical modeling
│   │   ├── BossRunMode.ts    # Arcade Boss battle state & HP tracking
│   │   └── GhostEngine.test.ts
│   ├── audio/
│   │   ├── AdaptiveAudio.ts   # Tone.js procedural synthwave audio loop & filter modulation
│   │   └── SFXEngine.ts       # 8-bit retro sound effects for game events
│   ├── scenes/
│   │   ├── BootScene.ts       # Procedural 16x16 pixel-art texture generator
│   │   └── RunnerScene.ts     # Phaser 3 2D side-scroller, parallax track & state machine
│   ├── services/
│   │   ├── GPXParserService.ts# GPX XML parser & Haversine distance calculator
│   │   ├── GPSTracker.ts      # Real-time GPS location tracker
│   │   ├── StorageService.ts  # LocalStorage persistence for ghosts & user settings
│   │   ├── StravaService.ts   # Strava OAuth API integration
│   │   └── BluetoothHR.ts     # Web Bluetooth Heart Rate Monitor service
│   ├── shaders/
│   │   └── CRTShader.ts       # GLSL post-processing CRT scanline & bloom pipeline
│   ├── ui/
│   │   ├── MainMenu.ts        # Retro track selection modal
│   │   └── PostRunSummary.ts  # Analytics summary modal & SVG pace comparison chart
│   ├── style.css              # Cyberpunk UI aesthetics & responsive breakpoints
│   └── main.ts                # Application entry point
├── capacitor.config.ts
├── tauri.conf.json
├── package.json
└── README.md
```

---

## 🛠️ Local Development & Build Commands

### Prerequisites
- Node.js (v18+)
- Rust & Cargo (for Tauri desktop build)
- Android Studio & JDK 17 (for Android `.apk` compilation)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/valliente/ghost-runner.git
cd ghost-runner

# Install dependencies
npm install

# Start Vite local dev server
npm run dev
```

---

## 📱 Compiling Android `.apk` (Capacitor)

```bash
# 1. Build Vite web distribution
npm run build

# 2. Sync distribution assets to native Android project
npx cap sync android

# 3. Open Android Studio to build APK or bundle
npx cap open android
```
*In Android Studio:* Go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

---

## 💻 Compiling PC `.exe` / App Bundle (Tauri)

```bash
# Run Tauri desktop app in dev mode
npx tauri dev

# Build production Windows executable (.exe / .msi)
npx tauri build
```
Output binaries will be saved in `src-tauri/target/release/bundle/`.

---

## 📜 License
MIT License. Built for retro fitness enthusiasts!
