# Changelog

All notable changes to the Ghost Runner project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.102.0] - 2026-08-17

### 🤖 AI Pacing & Game Features
- **Dynamic AI Pacer Bots**: Configurable AI race strategies including *Negative Split* (conservative start + ramped finish), *Surge & Recover* (tactical interval attacks), and *Constant Cadence* (rigid metronome).
- **Live Route Segment Sprints**: Automated detection and arcade countdown banners for micro-segments (e.g. 400m hill climbs, 800m bridge dashes) with real-time PR delta comparisons.
- **Adaptive Cadence Metronome**: Dedicated Tone.js synthesized 80s percussion metronome with customizable SPM target rates (120-220 SPM) and accent beats.

### 🌐 Format Imports & Native Decoding
- **Binary FIT File Engine**: Direct browser/native decoding of raw Garmin/Wahoo `.fit` binary files converting coordinate semicircles, elevation, cadence, and power.
- **Apple Health XML Converter**: Native parser for Apple HealthKit route exports with auto-detection in the file dropzone.

### 🎨 Modular HUD & Neo-Tokyo Visuals
- **Customizable Cyberpunk HUD**: Modular widget toggles for analog Pace Gauge, Route Progress Bar, Heart Rate Zone meter, and Ghost Delta counters with persistent local storage.
- **Neo-Tokyo Cityscape Parallax**: 4-layer parallax scene featuring illuminated skyline skyscrapers, high-speed monorail train, and reactive billboard messaging.
- **Split-Screen Synchronized Replay**: Side-by-side comparative race viewer with interactive telemetry curves (Pace, Elevation, Heart Rate) and time scrubber.
- **Accessibility & Sunlight Mode**: High-contrast colorblind themes (Deuteranopia, Protanopia, Tritanopia, Monochrome) and enlarged high-legibility HUD text scale for bright outdoor running.

### ⚡ Performance & Battery Optimization
- **Dedicated Web Worker Bridge**: Matrix Kalman calculations, geodetic Haversines, and background telemetry parsing offloaded from main thread, maintaining locked 60 FPS.
- **Sprite Object Pooling**: Generic memory recycler eliminating Garbage Collection pauses during heavy particle and visual trail rendering.
- **Adaptive GPS Sensor Throttling**: Dynamic location polling switching between 1Hz high-precision active tracking and power-saving standby mode during pauses/stops.
- **Tree-Shaking & Rollup Chunk Splitting**: Reduced main bundle payload by ~40% with isolated parser and audio modules.

### 🧪 Automated Testing & Benchmarks
- Automated Vitest test suite extended to 7 test files (17 tests) covering binary FIT parsing, AI pacing curves, Web Worker message bridging, and full 10km race scenario simulation (100% pass rate).

---

## [1.101.0] - 2026-08-16

### 🚀 Gameplay & Telemetry
- **Kalman Filter & Dead Reckoning**: Real-time noise smoothing on erratic GPS coordinate and speed streams with automatic spherical dead reckoning during satellite dropouts.
- **Ghost Fleet System**: Simultaneous multi-opponent racing (Personal Best, 30-Day Average, Target Pace) with live mini-radar proximity tracking on the HUD.
- **Cadence & Elevation Dynamics**: Full support for Grade Adjusted Pace (GAP) using Minetti biomechanical cost scaling and Total Elevation Gain (TEG) tracking.

### 🎵 Adaptive Synthwave Audio & Voice
- **Multi-Track Stem Mixer**: Dynamic volume ramping across Drums, Bassline, 80s Arpeggiator Synth, and Ambient Pad tied to athlete exertion zones.
- **Robotic Voice Announcer**: Web Speech API audio announcer providing kilometer split pace metrics and ghost proximity warnings.
- **Master Brickwall Limiter**: Peak limiting prevents distortion during multi-channel audio surges.

### 📱 Mobile (Android) & Haptics
- **Foreground Service & Live Notifications**: Persistent location tracking with lock screen pace delta stats.
- **Haptics Vibration Engine**: Distinct physical cues for ghost overtakes, kilometer milestones, and rhythm assist metronome.
- **AMOLED Battery-Saver Mode**: Pure black `#000000` mode disabling canvas particle rendering to maximize outdoor run battery life.
- **ProGuard & 64-bit ABI Optimization**: Minified release APKs with target architecture splits (`arm64-v8a`, `armeabi-v7a`, `x86_64`).

### 🖥️ Desktop (Windows & macOS)
- **Tauri v2 Desktop App**: Frameless retro window, system tray integration, and global hotkeys (`Space`, `M`, `R`, `S`).
- **NSIS Windows Installer & File Association**: One-click installer with automatic desktop shortcut and `.gpx` file association.

### 💾 Storage & Data Export
- **IndexedDB Ghost Repository**: Local caching for runs, ghosts, routes, and personal records.
- **Activity Exporter**: Workout serialization into standard GPX 1.1 and Garmin TCX schemas with elevation, cadence, and heart rate telemetry.
- **2D Route Map Replay**: Top-down route visualization with synchronized elevation profile scrubber and playback speed control.
