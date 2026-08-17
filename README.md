# Ghost Runner 🏃‍♂️👻

> **Retro 2D Hybrid Fitness Engine for PC & Mobile (v1.103)**

Ghost Runner is a retro 80s-inspired cyberpunk 2D side-scrolling fitness application. It combines real-time GPS telemetry tracking with Kalman filter smoothing, multi-format FIT/GPX/XML parsing, cloud ghost sharing, dynamic Phaser 2D pixel-art graphics, multi-track Tone.js synthwave audio, AI pacer bots, Cyber Garage cosmetics, and robotic voice coaching.

![Ghost Runner Overview](https://img.shields.io/badge/Platform-PC%20%7C%20Android-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Phaser%203%20%7C%20Tone.js%20%7C%20Capacitor%20%7C%20Tauri-pink?style=for-the-badge)
![Version](https://img.shields.io/badge/Release-v1.103.0-gold?style=for-the-badge)

---

## 🌟 Key Features (v1.103)

- 🌐 **Cloud Ghost Network & QR Sharing**: Publish tracks to Supabase, challenge community leaderboard ghosts, and generate peer QR codes.
- 🏎️ **Cyber Garage & XP Progression**: Unlock avatar skins (*Cyber Shinobi*, *Synth Valkyrie*, *Retro Mech*) and particle trails as you level up.
- 🏆 **Retro Trophies & Boss Battles**: 15 arcade achievements and multi-stage Cyber Boss Battles (*Overdrive Mech*, *Neon Phantom*, *Void Glitcher*).
- 👟 **Bluetooth RSC Foot Pod Support**: Pair Bluetooth Running Speed & Cadence foot pods for instant indoor treadmill speed.
- 📡 **Live Companion Telemetry Stream**: WebSocket & BroadcastChannel telemetry bridge for smartwatches and secondary screens.
- 🤖 **AI Pacer Bots & Coach Personas**: Choose between *Arcade Announcer*, *Drill Master*, and *Zen Guide* voice coaches.
- ⛰️ **3D Isometric Elevation Minimap**: Angled topography wireframe visualization with real-time elevation profile markers.
- ⚡ **Wasm Math & LZ-String Compression**: WebAssembly-accelerated physics and >70% database storage compression.
- 📱 **Android Edge-to-Edge Display**: Full transparent status bar and gesture navigation support.

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

# Run automated Vitest test suite (23 tests)
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
Output binaries will be saved in `src-tauri/target/release/bundle/nsis/GhostRunner-v1.103-Setup.exe`.

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
