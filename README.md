# Ghost Runner 🏃‍♂️👻

> **Retro 2D Hybrid Fitness Engine for PC & Mobile (v1.102)**

Ghost Runner is a retro 80s-inspired cyberpunk 2D side-scrolling fitness application. It combines real-time GPS telemetry tracking with Kalman filter smoothing, multi-format FIT/GPX/XML parsing, dynamic Phaser 2D pixel-art graphics, multi-track Tone.js synthwave audio, AI pacer bots, and robotic voice coaching.

![Ghost Runner Overview](https://img.shields.io/badge/Platform-PC%20%7C%20Android-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Phaser%203%20%7C%20Tone.js%20%7C%20Capacitor%20%7C%20Tauri-pink?style=for-the-badge)
![Version](https://img.shields.io/badge/Release-v1.102.0-gold?style=for-the-badge)

---

## 🌟 Key Features (v1.102)

- 🤖 **Dynamic AI Pacer Bots**: Race against intelligent pacing algorithms (*Negative Split*, *Surge & Recover*, *Constant Cadence*).
- ⚡ **Live Route Segment Sprints**: Automated micro-sprint segment triggers with real-time PR delta countdowns.
- 🎵 **Adaptive Cadence Metronome**: Dedicated Tone.js synthesized rhythm assist with customizable SPM rates (120-220 SPM).
- 📁 **Binary FIT & HealthKit Imports**: Direct native decoding of Garmin/Wahoo `.fit` binaries and Apple Health XML workout routes.
- 🎨 **Modular Cyberpunk HUD & Neo-Tokyo Parallax**: Customizable widget dashboard and 4-layer Neo-Tokyo parallax skyline with reactive billboards.
- 📊 **Split-Screen Synchronized Replay**: Side-by-side comparative race viewer with interactive telemetry curves (Pace, Elevation, HR).
- 👁️ **Accessibility & Sunlight Mode**: High-contrast colorblind themes (Deuteranopia, Protanopia, Tritanopia, Monochrome) and large text HUD scaling.
- ⚡ **Web Worker Offloading & Object Pooling**: Zero frame drops with off-thread Kalman matrix math and sprite memory recycling.
- 🔋 **Adaptive Sensor Throttling**: Intelligent battery-saver GPS polling rates extending outdoor battery lifespan.

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
Output binaries will be saved in `src-tauri/target/release/bundle/nsis/GhostRunner-v1.102-Setup.exe`.

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
