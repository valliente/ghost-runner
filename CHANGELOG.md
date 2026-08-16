# Changelog

All notable changes to the Ghost Runner project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### 🧪 Automated Testing
- Integrated Vitest automated test suite covering Kalman GPS filtering, Ghost interpolation vectors, and activity exports with 100% pass rate.
