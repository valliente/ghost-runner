# Changelog

All notable changes to the Ghost Runner project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.103.0] - 2026-08-18

### 🌐 Cloud & Community Multiplayer
- **Supabase Cloud Sync**: Publish local run vectors and download community ghost challenges worldwide.
- **Deep-Linking & Peer QR Generation**: Instant course sharing via `ghostrunner://track/{id}` and pixel-art QR matrix scanning.
- **Global & Friend Leaderboards**: Segment ranking browser with one-click "Race Ghost" instant challenge launches.

### 🎮 Progression & Cyber Garage
- **Runner XP & Attribute Tree**: Level progression system awarding XP for distance, ghost victories, and elevation climbs with customizable stat allocation (Stamina, Speed, Cadence, Overdrive).
- **Cyber Garage Cosmetics**: Unlockable neon runner avatars (*Cyber Shinobi*, *Synth Valkyrie*, *Retro Mech*, *Neon Panther*) and speed particle trails (*Plasma Flame*, *Matrix Glyphs*, *Hyper Strobe*).
- **Retro Trophy Engine**: 15 arcade achievements with celebratory fanfare banners and sound triggers.
- **Multi-Stage Cyber Boss Battles**: Fight *Overdrive Mech*, *Neon Phantom*, and *Void Glitcher* with dynamic pace and cadence attack mechanics.

### 👟 Wearables & Dynamic Audio
- **Bluetooth RSC Foot Pod Support**: Direct Web Bluetooth pairing with Running Speed and Cadence sensors for instantaneous indoor treadmill velocity.
- **Companion Telemetry Bridge**: WebSocket & BroadcastChannel stream broadcasting live pace and distance feeds to smartwatches and secondary screens.
- **AI Coach Personas**: Choose between *Arcade Announcer*, *Drill Master*, and *Zen Guide* voice personas with customizable milestone intervals.
- **Procedural Synth Melodies**: Terrain slope-locked Dorian lead arpeggios that transpose dynamically during hill climbs.

### ⚡ Performance, Storage & Portability
- **LZ-String Vector Compression**: >70% IndexedDB storage footprint reduction with lossless UTF-16 compression.
- **Wasm Vector Math Bridge**: WebAssembly-accelerated coordinate interpolation and Minetti Grade Adjusted Pace calculations.
- **Android Edge-to-Edge Display**: Transparent system navigation with notch safe-area insets.
- **Tauri Windows Portable & Updater**: Lightweight standalone single-executable and automated patch updates.

### 🧪 Automated Testing
- Expanded Vitest test suite to 10 test suites (23 tests) covering cloud synchronization, lossless compression, progression calculations, and E2E race scenarios (100% pass rate).

---

## [1.102.0] - 2026-08-17

### 🤖 AI Pacing & Game Features
- **Dynamic AI Pacer Bots**: Configurable AI race strategies including *Negative Split* (conservative start + ramped finish), *Surge & Recover* (tactical interval attacks), and *Constant Cadence* (rigid metronome).
- **Live Route Segment Sprints**: Automated detection and arcade countdown banners for micro-segments with real-time PR delta comparisons.
- **Adaptive Cadence Metronome**: Dedicated Tone.js synthesized 80s percussion metronome with customizable SPM target rates.

### 🌐 Format Imports & Native Decoding
- **Binary FIT File Engine**: Direct browser/native decoding of raw Garmin/Wahoo `.fit` binary files.
- **Apple Health XML Converter**: Native parser for Apple HealthKit route exports with auto-detection.

### 🎨 Modular HUD & Neo-Tokyo Visuals
- **Customizable Cyberpunk HUD**: Modular widget toggles for analog Pace Gauge, Route Progress Bar, Heart Rate Zone meter, and Ghost Delta counters.
- **Neo-Tokyo Cityscape Parallax**: 4-layer parallax scene featuring illuminated skyline skyscrapers, high-speed monorail train, and reactive billboard messaging.
- **Split-Screen Synchronized Replay**: Side-by-side comparative race viewer with interactive telemetry curves.
- **Accessibility & Sunlight Mode**: High-contrast colorblind themes (Deuteranopia, Protanopia, Tritanopia, Monochrome) and enlarged high-legibility HUD text scale.

---

## [1.101.0] - 2026-08-16

### 🚀 Gameplay & Telemetry
- **Kalman Filter & Dead Reckoning**: Real-time noise smoothing on erratic GPS coordinate and speed streams.
- **Ghost Fleet System**: Simultaneous multi-opponent racing (Personal Best, 30-Day Average, Target Pace) with live mini-radar.
- **Cadence & Elevation Dynamics**: Grade Adjusted Pace (GAP) using Minetti biomechanical cost scaling.
- **Multi-Track Stem Mixer**: Procedural synth stems tied to athlete exertion zones.
