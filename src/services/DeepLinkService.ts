import { App } from '@capacitor/app';

export interface DeepLinkMatch {
  action: 'track' | 'race' | 'profile';
  id: string;
}

export class DeepLinkService {
  private static listeners: ((match: DeepLinkMatch) => void)[] = [];
  private static isInitialized = false;

  public static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Check Capacitor App URL Open events on mobile
    try {
      App.addListener('appUrlOpen', (event) => {
        const match = this.parseDeepLink(event.url);
        if (match) {
          this.notifyListeners(match);
        }
      });
    } catch (e) {
      // Running on web or desktop
    }

    // Check window URL query parameters (e.g. ?track=xxx or ?race=xxx)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get('track') || params.get('race');
      if (trackParam) {
        setTimeout(() => {
          this.notifyListeners({ action: 'track', id: trackParam });
        }, 500);
      }
    }
  }

  public static parseDeepLink(url: string): DeepLinkMatch | null {
    if (!url) return null;

    try {
      // 1. Check custom scheme: ghostrunner://track/{id} or ghostrunner://race/{id}
      if (url.startsWith('ghostrunner://')) {
        const path = url.replace('ghostrunner://', '');
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const action = parts[0] === 'race' ? 'race' : 'track';
          return { action, id: parts[1] };
        }
      }

      // 2. Check standard HTTPS deep link: https://ghostrunner.app/track/{id}
      const parsed = new URL(url);
      const pathnameParts = parsed.pathname.split('/').filter(Boolean);
      if (pathnameParts.length >= 2 && (pathnameParts[0] === 'track' || pathnameParts[0] === 'race')) {
        return {
          action: pathnameParts[0] as 'track' | 'race',
          id: pathnameParts[1]
        };
      }
    } catch (e) {
      console.warn('DeepLinkService parse error:', e);
    }
    return null;
  }

  public static onDeepLink(callback: (match: DeepLinkMatch) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static notifyListeners(match: DeepLinkMatch): void {
    this.listeners.forEach((listener) => {
      try {
        listener(match);
      } catch (err) {
        console.error('DeepLink listener error:', err);
      }
    });
  }

  public static generateShareLink(trackId: string): string {
    return `https://ghostrunner.app/track/${trackId}`;
  }
}
