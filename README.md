# Ghost Runner 🏃‍♂️👻

> **Retro 2D Hybrid Fitness Engine for PC & Mobile (v1.104)**

Ghost Runner is a retro 80s-inspired cyberpunk 2D side-scrolling fitness application. It combines real-time GPS telemetry tracking with Kalman filter smoothing, multi-format FIT/GPX/XML parsing, cloud ghost sharing, dynamic Phaser 2D pixel-art graphics, multi-track Tone.js synthwave audio, AI pacer bots, Cyber Garage cosmetics, structured interval workouts, WebRTC P2P multiplayer racing, and robotic voice coaching.

![Ghost Runner Overview](https://img.shields.io/badge/Platform-PC%20%7C%20Android-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Phaser%203%20%7C%20Tone.js%20%7C%20Capacitor%20%7C%20Tauri-pink?style=for-the-badge)
![Version](https://img.shields.io/badge/Release-v1.104.0-gold?style=for-the-badge)

---

## 🌟 Key Features (v1.104)

- 🏃‍♂️ **Structured Interval Workouts**: Workout Plan builder with step types (Warmup, Work, Rest, Cooldown, Repeats) and preset plans (*5K Tempo Crusher*, *VO2 Max Pyramids*, *Endurance Long Run*).
- 📈 **ACWR Adaptive Fatigue Target Pacing**: 7-day acute to 28-day chronic workload ratio analysis for intelligent pace adaptation and overreaching injury prevention.
- 🏎️ **Live WebRTC P2P Ghost Racing & Slipstreaming**: Low-latency coordinate exchange with 2-4m aerodynamic drafting and cadence boost mechanics.
- 🎧 **Spatial 3D Audio & Multilingual Announcers**: HRTF 3D ghost panning with Japanese Arcade, Cyber AI, and 80s Track Coach voice soundboards.
- 💡 **Volumetric Neon Lighting & Dynamic Weather v2**: Real-time shader light rays, dynamic ground shadows, volumetric fog layers, and thunder lightning flashes.
- 📱 **AMOLED Ambient Display & Android Widget**: 15 FPS pure-black battery saving mode and native Android Quick-Start home screen widget.
- 🌍 **Full Internationalization (i18n)**: English (EN), Spanish (ES), Japanese (JA), German (DE), and French (FR).
- ⚡ **Wasm SIMD Parallel Interpolation**: 4-lane parallel vector math acceleration for multi-ghost race tracks.

---

## 🛠️ Local Development & Build Commands

### Prerequisites
- Node.js (v20+ recommended, Node 22 supported)
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

# Run automated Vitest test suite (30 tests across 13 suites)
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
Output binaries will be saved in `src-tauri/target/release/bundle/nsis/GhostRunner-v1.104-Setup.exe`.

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

### 1. Bluetooth Low Energy (BLE) Sensors
- **Supported Sensors**: Heart rate monitors (Polar H10, Garmin HRM-Pro, Wahoo TICKR) and RSC Foot Pods (Stryd, Zwift RunPod, Garmin Foot Pod).
- **Setup**: In Ghost Runner, click **CONNECT BLE HR** or pair in Settings.

### 2. Android GPS & Background Battery Optimization
To ensure the GPS tracker and Foreground Service never get killed by Android Doze Mode:
1. Open Android **Settings > Apps > Ghost Runner**.
2. Go to **Battery > Battery Usage**.
3. Set background usage to **Unrestricted** (Don't optimize).
4. Verify **Location Permission** is set to **Allow all the time** (including Precise Location).

---

## 📜 License
MIT License. Built for retro cyberpunk fitness enthusiasts!
