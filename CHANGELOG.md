# Changelog

All notable changes to the Ghost Runner project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.104.0] - 2026-08-18

### 🏃‍♂️ Training Plans & Adaptive Workouts
- **Structured Interval & Workout Builder**: Create custom interval workouts (Warmup, Work, Rest, Cooldown, Repeats) with preset plans (*5K Tempo Crusher*, *VO2 Max Pyramids*, *Endurance Long Run*).
- **ACWR Fatigue-Based Adaptive Target Pacing**: Computes 7-day acute to 28-day chronic workload ratios (ACWR) to dynamically adjust target ghost speeds.

### 🌐 Real-Time P2P Ghost Racing & Slipstreaming
- **WebRTC DataChannel Telemetry Sync**: Low-latency peer-to-peer live multiplayer ghost coordinate sharing via 6-character room codes.
- **Ghost Slipstream & Aerodynamic Drafting**: Trailing within 0.5-4.5m of an opponent or ghost triggers cyber-drafting with up to a 12% speed and cadence efficiency bonus.

### 🎧 Audio & Visual Immersion
- **Spatial 3D Audio (HRTF Panning)**: Dynamic stereo/3D positioning for ghost footsteps, breathing, and flyby whooshes based on relative distance.
- **Multilingual Retro Voice Announcers**: Extended audio coach personas (*Retro Japanese Arcade*, *Cyber AI Synth*, *80s Track Coach*) with interval countdowns and boss attack warnings.
- **Volumetric Neon Lighting & Shadow Shaders**: WebGL shader casting neon rays from streetlights and projecting dynamic runner drop-shadows.
- **Dynamic Weather Engine v2**: Volumetric animated fog layers, ambient lightning flashes, and refractive raindrop lens impacts.

### 🖥️ UI & Native Mobile Enhancements
- **Custom HUD Gauge Themes**: Selectable visual themes (*Cyberpunk 2088*, *Outrun Sunset*, *Matrix Monolith*).
- **Live Sliding Split Times Drawer**: Per-kilometer split drawer with color-coded deltas and projected finish time estimation.
- **Training Matrix & Activity Heatmap**: Monthly workout frequency grid with streak tracking and one-tap historical ghost spawning.
- **Android Quick-Start Home Screen Widget**: Native Android AppWidget displaying weekly distance with instant one-tap quick run launches.
- **AMOLED Low-Power Ambient Display Mode**: Ultra-high-contrast pure black display with 15 FPS frame throttling and burn-in protection.
- **Internationalization (i18n)**: Full localization across English (EN), Spanish (ES), Japanese (JA), German (DE), and French (FR).

### ⚡ Performance & Database Integrity
- **Wasm SIMD Parallel Interpolation**: Vectorized 4-lane unrolled loop executing parallel multi-ghost coordinate evaluations.
- **Database Schema Migration & Full JSON Backups**: IndexedDB schema migration and lossless JSON database export and restore service.

### 🧪 Automated Testing
- Expanded Vitest automated test suite to 13 test suites (30 tests) covering interval builders, WebRTC message serialization, slipstream physics, and 100% dictionary translation parity.

---

## [1.103.0] - 2026-08-18

### 🌐 Cloud & Community Multiplayer
- **Supabase Cloud Sync**: Publish local run vectors and download community ghost challenges worldwide.
- **Deep-Linking & Peer QR Generation**: Instant course sharing via `ghostrunner://track/{id}` and pixel-art QR matrix scanning.
- **Global & Friend Leaderboards**: Segment ranking browser with one-click "Race Ghost" instant challenge launches.

### 🎮 Progression & Cyber Garage
- **Runner XP & Attribute Tree**: Level progression system awarding XP for distance, ghost victories, and elevation climbs with customizable stat allocation (Stamina, Speed, Cadence, Overdrive).
- **Cyber Garage Cosmetics**: Unlockable neon runner avatars and speed particle trails.
- **Retro Trophy Engine**: 15 arcade achievements with celebratory fanfare banners.
- **Multi-Stage Cyber Boss Battles**: Fight *Overdrive Mech*, *Neon Phantom*, and *Void Glitcher*.

---

## [1.102.0] - 2026-08-17

### 🤖 AI Pacing & Game Features
- **Dynamic AI Pacer Bots**: Configurable AI race strategies (*Negative Split*, *Surge & Recover*, *Constant Cadence*).
- **Live Route Segment Sprints**: Automated detection and arcade countdown banners for micro-segments.
- **Adaptive Cadence Metronome**: Dedicated Tone.js synthesized 80s percussion metronome.
