# Ghost Runner

> **Hybrid 2D Fitness Engine for PC & Mobile (v1.104)**

Ghost Runner is a 2D side-scrolling fitness application combining real-time GPS telemetry tracking with Kalman filter smoothing, multi-format FIT/GPX/XML parsing, cloud ghost sharing, dynamic Phaser 2D graphics, multi-track Tone.js audio synthesis, AI pacer bots, structured interval workouts, WebRTC P2P multiplayer racing, and voice coaching.

![Platform](https://img.shields.io/badge/Platform-PC%20%7C%20Android-blue)
![Stack](https://img.shields.io/badge/Stack-Phaser%203%20%7C%20Tone.js%20%7C%20Capacitor%20%7C%20Tauri-blue)
![Version](https://img.shields.io/badge/Release-v1.104.0-green)

---

## Core Features (v1.104)

- **Structured Interval Workouts**: Workout plan engine with configurable phases (Warmup, Work, Rest, Cooldown, Repeats) and analytical preset profiles.
- **ACWR Adaptive Fatigue Target Pacing**: 7-day acute to 28-day chronic workload ratio analysis for intelligent pace adaptation and overreaching prevention.
- **WebRTC P2P Ghost Racing & Slipstreaming**: Low-latency coordinate exchange with aerodynamic drafting and cadence boost mechanics.
- **Spatial 3D Audio & Announcer Soundboards**: HRTF 3D ghost panning with synthesized soundboards.
- **Volumetric Lighting & Dynamic Weather**: Real-time shader light rays, dynamic ground shadows, volumetric fog layers, and environmental effects.
- **AMOLED Ambient Display & Android Integration**: Low-draw 15 FPS pure-black mode and native Android quick-start home screen widget.
- **Full Internationalization (i18n)**: English (EN), Spanish (ES), Japanese (JA), German (DE), and French (FR).
- **WASM SIMD Parallel Interpolation**: 4-lane parallel vector math acceleration for multi-ghost race telemetry.

---

## Development & Build Commands

### Prerequisites
- Node.js 20+
- Rust & Cargo (for Tauri desktop build)
- Android Studio & JDK 21 (for Android `.apk` compilation)

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

## Compiling Desktop Executable (Tauri)

```bash
# 1. Build web distribution
npm run build

# 2. Build production Windows installer (.exe / .msi)
npx tauri build
```
Output binaries are generated in `src-tauri/target/release/bundle/nsis/GhostRunner-v1.104-Setup.exe`.

---

## Compiling Android APK (Capacitor)

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

## Hardware & Sensor Integration

### 1. Bluetooth Low Energy (BLE) Sensors
- **Supported Sensors**: Heart rate monitors (Polar H10, Garmin HRM-Pro, Wahoo TICKR) and RSC Foot Pods (Stryd, Zwift RunPod, Garmin Foot Pod).
- **Setup**: In Ghost Runner, select **Connect BLE HR** or pair in Settings.

### 2. Android GPS & Background Execution
To ensure background telemetry tracking persists:
1. Open Android **Settings > Apps > Ghost Runner**.
2. Navigate to **Battery > Battery Usage**.
3. Set background usage to **Unrestricted**.
4. Verify **Location Permission** is set to **Allow all the time** with Precise Location enabled.

---

## License

MIT License. Distributed under open-source terms.
