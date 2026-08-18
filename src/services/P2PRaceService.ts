export interface LivePeerTelemetry {
  runnerId: string;
  runnerName: string;
  distanceMeters: number;
  speedMs: number;
  paceMinKm: number;
  latitude: number;
  longitude: number;
  cadenceSpm: number;
  heartRateBpm?: number;
  avatarSkinId?: string;
  trailEffectId?: string;
  isFinished: boolean;
  lastUpdatedTimestamp: number;
}

export type P2PMessageType = 'join' | 'ready' | 'telemetry' | 'finish' | 'chat';

export interface P2PMessage {
  type: P2PMessageType;
  senderId: string;
  senderName: string;
  timestamp: number;
  payload: any;
}

export class P2PRaceService {
  private static instance: P2PRaceService | null = null;

  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  public roomCode: string | null = null;
  public localRunnerId: string;
  public localRunnerName: string;
  public activePeers: Map<string, LivePeerTelemetry> = new Map();
  public isHost: boolean = false;
  private onTelemetryCallback: ((telemetry: LivePeerTelemetry) => void) | null = null;

  private constructor() {
    this.localRunnerId = `runner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.localRunnerName = 'CyberRacer';
  }

  public static getInstance(): P2PRaceService {
    if (!P2PRaceService.instance) {
      P2PRaceService.instance = new P2PRaceService();
    }
    return P2PRaceService.instance;
  }

  /**
   * Initializes host room or joins peer room via 6-character room code.
   */
  public async connect(roomCode: string, runnerName: string, isHost: boolean = false): Promise<boolean> {
    this.roomCode = roomCode.toUpperCase();
    this.localRunnerName = runnerName;
    this.isHost = isHost;

    if (typeof RTCPeerConnection === 'undefined') {
      // Node/Testing environment fallback
      return true;
    }

    try {
      const config: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      this.peerConnection = new RTCPeerConnection(config);

      if (this.isHost) {
        this.dataChannel = this.peerConnection.createDataChannel('ghost-race-sync', {
          ordered: false, // Low latency UDP-like transport
          maxRetransmits: 0
        });
        this.setupDataChannel(this.dataChannel);
      } else {
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannel(this.dataChannel);
        };
      }

      return true;
    } catch (e) {
      console.warn('WebRTC P2P initialization error:', e);
      return false;
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.broadcastMessage('join', { runnerName: this.localRunnerName });
    };

    channel.onmessage = (event) => {
      try {
        const msg: P2PMessage = JSON.parse(event.data);
        this.handleIncomingMessage(msg);
      } catch (e) {
        console.warn('Failed to parse P2P message payload:', e);
      }
    };
  }

  /**
   * Handles received WebRTC DataChannel telemetry packets.
   */
  public handleIncomingMessage(msg: P2PMessage): void {
    if (msg.senderId === this.localRunnerId) return;

    if (msg.type === 'telemetry') {
      const peerData: LivePeerTelemetry = {
        runnerId: msg.senderId,
        runnerName: msg.senderName,
        distanceMeters: msg.payload.distanceMeters || 0,
        speedMs: msg.payload.speedMs || 0,
        paceMinKm: msg.payload.paceMinKm || 5.0,
        latitude: msg.payload.latitude || 0,
        longitude: msg.payload.longitude || 0,
        cadenceSpm: msg.payload.cadenceSpm || 170,
        heartRateBpm: msg.payload.heartRateBpm,
        avatarSkinId: msg.payload.avatarSkinId || 'shinobi',
        trailEffectId: msg.payload.trailEffectId || 'cyan_grid',
        isFinished: msg.payload.isFinished || false,
        lastUpdatedTimestamp: Date.now()
      };

      this.activePeers.set(msg.senderId, peerData);
      if (this.onTelemetryCallback) {
        this.onTelemetryCallback(peerData);
      }
    }
  }

  /**
   * Broadcasts high-frequency live coordinate telemetry to all peers.
   */
  public broadcastTelemetry(telemetry: Omit<LivePeerTelemetry, 'runnerId' | 'runnerName' | 'lastUpdatedTimestamp'>): void {
    this.broadcastMessage('telemetry', telemetry);
  }

  /**
   * Sends arbitrary message envelope across DataChannel.
   */
  public broadcastMessage(type: P2PMessageType, payload: any): void {
    const packet: P2PMessage = {
      type,
      senderId: this.localRunnerId,
      senderName: this.localRunnerName,
      timestamp: Date.now(),
      payload
    };

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(packet));
    }
  }

  public registerTelemetryListener(cb: (telemetry: LivePeerTelemetry) => void): void {
    this.onTelemetryCallback = cb;
  }

  public getActivePeers(): LivePeerTelemetry[] {
    return Array.from(this.activePeers.values());
  }

  public disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.activePeers.clear();
  }
}

export const p2pRaceService = P2PRaceService.getInstance();
