export interface CompanionTelemetryPayload {
  elapsedSeconds: number;
  distanceMeters: number;
  speedMs: number;
  paceMinKm: number;
  ghostDeltaSeconds: number;
  heartRateBpm?: number;
  cadenceSpm?: number;
  timestamp: number;
}

export class TelemetryBroadcast {
  private static readonly BROADCAST_CHANNEL_NAME = 'ghost_runner_telemetry_feed';
  private channel: BroadcastChannel | null = null;
  private socket: WebSocket | null = null;
  private isBroadcasting: boolean = false;
  private listeners: ((payload: CompanionTelemetryPayload) => void)[] = [];

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(TelemetryBroadcast.BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<CompanionTelemetryPayload>) => {
        this.notifyListeners(event.data);
      };
    }
  }

  /**
   * Starts broadcasting live telemetry updates to local network / companion displays.
   */
  public start(serverUrl?: string): void {
    this.isBroadcasting = true;

    if (serverUrl && typeof WebSocket !== 'undefined') {
      try {
        this.socket = new WebSocket(serverUrl);
        this.socket.onopen = () => console.log('Companion WebSocket telemetry server connected');
        this.socket.onerror = (e) => console.warn('Companion WebSocket error:', e);
      } catch (e) {
        console.warn('Failed to connect companion WebSocket:', e);
      }
    }
  }

  /**
   * Broadcasts a telemetry snapshot to companion screens.
   */
  public broadcast(payload: CompanionTelemetryPayload): void {
    if (!this.isBroadcasting) return;

    // 1. BroadcastChannel for local tablets/monitors/browsers
    if (this.channel) {
      this.channel.postMessage(payload);
    }

    // 2. WebSocket for remote WearOS watch / treadmill display
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  public onCompanionUpdate(callback: (payload: CompanionTelemetryPayload) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(payload: CompanionTelemetryPayload): void {
    this.listeners.forEach((l) => l(payload));
  }

  public stop(): void {
    this.isBroadcasting = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const telemetryBroadcast = new TelemetryBroadcast();
