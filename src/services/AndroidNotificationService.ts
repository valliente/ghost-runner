export class AndroidNotificationService {
  private static isPermissionGranted: boolean = false;
  private static activeNotification: Notification | null = null;
  private static lastUpdateTimestamp: number = 0;

  /**
   * Requests Android / Web notification permissions.
   */
  public static async requestPermissions(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this environment.');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.isPermissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.isPermissionGranted = permission === 'granted';
      return this.isPermissionGranted;
    }

    return false;
  }

  /**
   * Updates real-time workout stats in the Android notification tray / Lock Screen.
   * @param distanceKm Current distance in kilometers
   * @param paceMinKm Current pace in min/km
   * @param paceDeltaSec Time delta in seconds relative to Ghost
   * @param isRunning Run state flag
   */
  public static async updateWorkoutNotification(
    distanceKm: number,
    paceMinKm: number,
    paceDeltaSec: number,
    isRunning: boolean
  ): Promise<void> {
    const now = Date.now();
    // Throttle notifications update to at most once per 2.5 seconds
    if (now - this.lastUpdateTimestamp < 2500) return;
    this.lastUpdateTimestamp = now;

    if (!this.isPermissionGranted) {
      const granted = await this.requestPermissions();
      if (!granted) return;
    }

    const mins = Math.floor(paceMinKm);
    const secs = Math.round((paceMinKm - mins) * 60);
    const paceStr = `${mins}:${secs.toString().padStart(2, '0')}/km`;

    const absDelta = Math.abs(Math.round(paceDeltaSec));
    const deltaMins = Math.floor(absDelta / 60);
    const deltaSecs = absDelta % 60;
    const deltaStr = paceDeltaSec <= 0 ? `-${deltaMins}:${deltaSecs.toString().padStart(2, '0')} Ahead` : `+${deltaMins}:${deltaSecs.toString().padStart(2, '0')} Behind`;

    const title = isRunning ? '⚡ Ghost Runner: Active Session' : '⏸️ Ghost Runner: Paused';
    const body = `Dist: ${distanceKm.toFixed(2)} km | Pace: ${paceStr} | Ghost: ${deltaStr}`;

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/favicon.svg',
          tag: 'ghost-runner-live-workout',
          silent: true
        } as any);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        if (this.activeNotification) {
          this.activeNotification.close();
        }
        this.activeNotification = new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: 'ghost-runner-live-workout',
          silent: true
        });
      }
    } catch (e) {
      console.warn('AndroidNotificationService: Error displaying notification', e);
    }
  }

  /**
   * Clears active workout notification from the tray.
   */
  public static async clearNotification(): Promise<void> {
    if (this.activeNotification) {
      this.activeNotification.close();
      this.activeNotification = null;
    }
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag: 'ghost-runner-live-workout' });
      notifications.forEach((n) => n.close());
    }
  }
}
