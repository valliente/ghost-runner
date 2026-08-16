# Ghost Runner 🏃‍♂️👻

> **Retro 2D Hybrid Fitness Engine for PC & Mobile (v1.101)**

Ghost Runner is a retro 80s-inspired cyberpunk 2D side-scrolling fitness application. It combines real-time GPS telemetry tracking with Kalman filter smoothing, GPX/TCX workout parsing, dynamic Phaser 2D pixel-art graphics, multi-track Tone.js synthwave audio, and robotic voice coaching.

![Ghost Runner Overview](https://img.shields.io/badge/Platform-PC%20%7C%20Android-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Phaser%203%20%7C%20Tone.js%20%7C%20Capacitor%20%7C%20Tauri-pink?style=for-the-badge)
![Version](https://img.shields.io/badge/Release-v1.101.0-gold?style=for-the-badge)

---

## 🌟 Key Features (v1.101)

- 🏎️ **Ghost Fleet Engine**: Race multiple concurrent ghosts (Personal Best, 30-Day Average, Target Pace) with a live HUD mini-radar.
- 📡 **Kalman Filter & Dead Reckoning**: Eliminates noisy GPS jitter and uses geodetic dead reckoning during satellite dropouts.
- 🎵 **Multi-Track Synthwave Stem Mixer**: Procedural Web Audio synth stems (Drums, Bassline, 80s Arp, Ambient Pad) that automate based on your exertion zone.
- 🗣️ **Robotic Voice Announcer**: Real-time kilometer split pace and ghost proximity callouts using pitch-shifted Web Speech synthesis.
- ⛰️ **Elevation & Grade Adjusted Pace**: Computes Total Elevation Gain (TEG) and Grade Adjusted Pace (GAP) using Minetti biomechanical cost scaling.
- 📳 **Adaptive Haptics Metronome**: Custom vibration pulses for ghost overtakes, milestone impacts, and cadence rhythm assist.
- 💾 **Activity Exporter & Replay**: Serializes sessions into GPX 1.1 / TCX files and provides an interactive 2D top-down route replay with elevation scrubber.
- 📱 **Android Foreground Service & Notifications**: Live lock screen workout metrics and AMOLED battery-saving mode.
- 💻 **Tauri Desktop v2**: Frameless retro window, system tray, global hotkeys (`Space`, `M`, `R`, `S`), and `.gpx` file association.

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

# Run automated Vitest test suite
npm test
```

---

## 💻 Compiling PC `.exe` / App Bundle (Tauri)

```bash
# 1. Build web distribution
npm run build

# 2. Build production Windows installer (.exe / .msi)
npx tauri build
```
Output binaries will be saved in `src-tauri/target/release/bundle/nsis/GhostRunner-v1.101-Setup.exe`.

---

## 📱 Compiling Android APK (Capacitor)

```bash
# 1. Build web distribution & sync native assets
npm run build
npx cap sync android

# 2. Compile release APK using Gradle wrapper
cd android
./gradlew assembleRelease
# (On Windows PowerShell: .\gradlew.bat assembleRelease)
```
Output APK is located at `android/app/build/outputs/apk/release/app-release-unsigned.apk`.

---

## 🔧 Hardware & Device Troubleshooting

### 1. Bluetooth Low Energy (BLE) Heart Rate Monitors
- **Supported Sensors**: Polar H10, Garmin HRM-Pro/Dual, Wahoo TICKR, Scosche Rhythm+.
- **Setup**:
  1. Ensure Bluetooth is enabled on your PC/Phone.
  2. In Ghost Runner, click **CONNECT BLE HR**.
  3. Select your heart rate monitor from the Web Bluetooth dialog.
  4. The canvas border glow will dynamically reflect your exertion zone (Zone 1 Cyan to Zone 5 Strobe Red).

### 2. Android GPS & Background Battery Optimization
To ensure the GPS tracker and Foreground Service never get killed by Android Doze Mode:
1. Open Android **Settings > Apps > Ghost Runner**.
2. Go to **Battery > Battery Usage**.
3. Set background usage to **Unrestricted** (Don't optimize).
4. Verify **Location Permission** is set to **Allow all the time** (including Precise Location).

---

## 📜 License
MIT License. Built for retro cyberpunk fitness enthusiasts!
