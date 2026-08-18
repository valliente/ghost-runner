import { describe, it, expect } from 'vitest';
import { P2PRaceService, type P2PMessage, type LivePeerTelemetry } from '../src/services/P2PRaceService';
import { SlipstreamEngine } from '../src/engine/SlipstreamEngine';

describe('P2PRaceService & Slipstream Drafting Mechanics', () => {
  it('should initialize P2PRaceService singleton and handle incoming telemetry packets', () => {
    const service = P2PRaceService.getInstance();
    expect(service).toBeDefined();

    let receivedData: LivePeerTelemetry | null = null;
    service.registerTelemetryListener((t) => {
      receivedData = t;
    });

    const mockMsg: P2PMessage = {
      type: 'telemetry',
      senderId: 'peer_shinobi_42',
      senderName: 'TokyoSprinter',
      timestamp: Date.now(),
      payload: {
        distanceMeters: 2450,
        speedMs: 4.5,
        paceMinKm: 3.7,
        latitude: 35.6895,
        longitude: 139.6917,
        cadenceSpm: 184,
        heartRateBpm: 168,
        avatarSkinId: 'shinobi',
        trailEffectId: 'plasma_fire',
        isFinished: false
      }
    };

    service.handleIncomingMessage(mockMsg);

    expect(receivedData).not.toBeNull();
    expect(receivedData!.runnerName).toBe('TokyoSprinter');
    expect(receivedData!.distanceMeters).toBe(2450);
    expect(receivedData!.cadenceSpm).toBe(184);

    const peers = service.getActivePeers();
    expect(peers.length).toBe(1);
  });

  it('should calculate slipstream drafting lock-on and efficiency speed bonus', () => {
    const slipstream = new SlipstreamEngine();

    // Player running at 4.0 m/s, 2 meters directly behind a ghost running at 4.0 m/s
    let state = slipstream.evaluate(1000, 4.0, 1002, 4.0, 'ghost_1', 0.5);
    expect(state.isDrafting).toBe(false); // First 0.5s: locking on
    expect(state.lockOnProgressPercent).toBeGreaterThan(0);

    // Continue drafting for another 1.2s (total 1.7s > 1.5s lock threshold)
    state = slipstream.evaluate(1004.8, 4.0, 1006.8, 4.0, 'ghost_1', 1.2);
    expect(state.isDrafting).toBe(true);
    expect(state.draftBonusPercent).toBeGreaterThanOrEqual(5.0);
    expect(state.speedMultiplier).toBeGreaterThan(1.0);
    expect(state.triggerAudioLock).toBe(true);
  });
});
