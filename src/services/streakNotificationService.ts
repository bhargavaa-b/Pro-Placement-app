/**
 * Streak Retention Phone Notification Service
 * Enforces the 24-hour streak rule: If the user hasn't opened or practiced
 * in 16+ hours (within 8 hours prior to the 24h reset), fire high-urgency
 * push notifications to their phone with vibration and direct practice actions.
 */

export interface StreakNotificationStatus {
  permission: NotificationPermission | 'unsupported';
  notificationsEnabled: boolean;
  hoursSinceLastActive: number;
  hoursRemainingBeforeReset: number;
  isIn8HourDangerWindow: boolean;
  isExpired: boolean;
  lastActiveTimestamp: number;
  lastNotifiedCycleKey: string | null;
}

const STORAGE_KEY_ENABLED = 'pp_phone_notifications_enabled';
const STORAGE_KEY_LAST_NOTIFIED = 'pp_last_notified_streak_cycle';
const STORAGE_KEY_LAST_ACTIVE = 'pp_last_active_timestamp';

export class StreakNotificationService {
  private static instance: StreakNotificationService;
  private checkIntervalId: number | null = null;
  private listeners: Array<(status: StreakNotificationStatus) => void> = [];

  private constructor() {
    this.initServiceWorker();
  }

  public static getInstance(): StreakNotificationService {
    if (!StreakNotificationService.instance) {
      StreakNotificationService.instance = new StreakNotificationService();
    }
    return StreakNotificationService.instance;
  }

  /**
   * Register service worker if supported
   */
  public async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return registration;
    } catch (err) {
      console.warn('Failed to register /sw.js for phone notifications:', err);
      return null;
    }
  }

  /**
   * Check if notifications are supported on this device/browser
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current browser notification permission
   */
  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Whether user has enabled streak phone notifications in app settings
   */
  public isEnabled(): boolean {
    if (!this.isSupported()) return false;
    const pref = localStorage.getItem(STORAGE_KEY_ENABLED);
    return pref === 'true' && Notification.permission === 'granted';
  }

  /**
   * Request phone notification permissions and register service worker
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
        await this.initServiceWorker();
        this.notifyListeners();
        return true;
      } else {
        localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
        this.notifyListeners();
        return false;
      }
    } catch (err) {
      console.warn('Notification permission request error:', err);
      return false;
    }
  }

  /**
   * Toggle notifications preference
   */
  public async setEnabled(enabled: boolean): Promise<boolean> {
    if (enabled) {
      return await this.requestPermission();
    } else {
      localStorage.setItem(STORAGE_KEY_ENABLED, 'false');
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Record that the candidate just used the app / completed a practice action
   */
  public recordActivity(): void {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, String(now));
      this.notifyListeners();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Retrieve the timestamp of the candidate's last activity
   */
  public getLastActiveTimestamp(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // Ignore
    }
    // Default to right now if not set yet
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, String(now));
    return now;
  }

  /**
   * Calculate exact time remaining in the 24-hour streak window
   */
  public getStatus(streakDays = 1): StreakNotificationStatus {
    const lastActive = this.getLastActiveTimestamp();
    const now = Date.now();
    const elapsedMs = Math.max(0, now - lastActive);
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const SIXTEEN_HOURS_MS = 16 * 60 * 60 * 1000; // 8 hours prior to 24h

    const hoursSinceLastActive = elapsedMs / (1000 * 60 * 60);
    const remainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - elapsedMs);
    const hoursRemainingBeforeReset = remainingMs / (1000 * 60 * 60);

    // Danger window is between 16 and 24 hours (i.e. within 8 hours prior to reset)
    const isIn8HourDangerWindow = elapsedMs >= SIXTEEN_HOURS_MS && elapsedMs < TWENTY_FOUR_HOURS_MS;
    const isExpired = elapsedMs >= TWENTY_FOUR_HOURS_MS;

    return {
      permission: this.getPermission(),
      notificationsEnabled: this.isEnabled(),
      hoursSinceLastActive: Math.round(hoursSinceLastActive * 10) / 10,
      hoursRemainingBeforeReset: Math.round(hoursRemainingBeforeReset * 10) / 10,
      isIn8HourDangerWindow,
      isExpired,
      lastActiveTimestamp: lastActive,
      lastNotifiedCycleKey: localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED),
    };
  }

  /**
   * Show a native rich notification on user's phone or desktop
   */
  public async deliverNotification(
    title: string,
    body: string,
    tag = 'streak-retention-reminder',
    url = '/?tab=dsa'
  ): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      // Try service worker first (best on mobile phones / PWAs)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && typeof (registration as any).showNotification === 'function') {
          await (registration as any).showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/icon.svg',
            tag,
            renotify: true,
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 300],
            data: { url },
            actions: [
              { action: 'practice', title: '⚡ Solve DSA' },
              { action: 'arcade', title: '🎮 Byte Runner' },
            ],
          });
          return true;
        }
      }

      // Fallback to standard Window Notification
      const notif = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag,
        requireInteraction: true,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Failed to deliver notification:', err);
      return false;
    }
  }

  /**
   * Test the phone notification immediately so user/judges can verify it
   */
  public async sendTestNotification(streakDays = 5): Promise<boolean> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;

    return await this.deliverNotification(
      `🔥 Test Streak Alert — Pro Placement`,
      `⚡ Verified! Your phone is configured to receive streak warnings 8 hours before the 24-hour deadline. Current streak: ${streakDays} days.`,
      `test-streak-${Date.now()}`
    );
  }

  /**
   * Simulate a 16-hour inactivity state (8 hours remaining before 24h reset)
   * Designed for testing and hackathon judges to verify the real-world notification!
   */
  public async simulate16hInactivityAndCheck(streakDays = 5): Promise<StreakNotificationStatus> {
    // Set last active to 16.5 hours ago (7.5 hours left before 24h reset)
    const simulatedLastActive = Date.now() - 16.5 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, String(simulatedLastActive));
    localStorage.removeItem(STORAGE_KEY_LAST_NOTIFIED); // clear notification lock

    const status = this.getStatus(streakDays);
    this.notifyListeners();

    // Trigger the notification
    if (this.isEnabled()) {
      await this.deliverNotification(
        `🔥 Streak Warning: 7.5h Left to Continue Streak!`,
        `⚡ Urgency Alert: You haven't practiced on Pro Placement in 16.5 hours! Less than 8 hours remain to protect your ${streakDays}-day streak.`,
        `simulated-streak-${Date.now()}`
      );
    }

    return status;
  }

  /**
   * Reset simulation back to active right now
   */
  public resetToActiveNow(): void {
    this.recordActivity();
    localStorage.removeItem(STORAGE_KEY_LAST_NOTIFIED);
    this.notifyListeners();
  }

  /**
   * Automated check running every minute
   * If inactivity is >= 16 hours and < 24 hours (within 8 hours prior to 24h),
   * fire the phone notification once per cycle!
   */
  public checkAndNotify(streakDays = 1): void {
    const status = this.getStatus(streakDays);
    if (!status.isIn8HourDangerWindow || !status.notificationsEnabled) {
      return;
    }

    // Ensure we notify only once for this 24-hour cycle window
    const cycleDayKey = new Date(status.lastActiveTimestamp).toISOString().slice(0, 10);
    const alreadyNotified = localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED);

    if (alreadyNotified !== cycleDayKey) {
      const remainingHours = Math.max(1, Math.round(status.hoursRemainingBeforeReset));
      this.deliverNotification(
        `🔥 Streak Freeze Warning: ${remainingHours}h Left to Save Streak!`,
        `⚡ You haven't used Pro Placement in ${status.hoursSinceLastActive} hours. Practice before the 24-hour limit to keep your ${streakDays}d streak alive!`,
        `streak-warning-${cycleDayKey}`
      );
      localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED, cycleDayKey);
    }
  }

  /**
   * Start recurring background timer in foreground tab
   */
  public startWatcher(streakDays = 1): () => void {
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId);
    }

    // Run immediately on start
    this.checkAndNotify(streakDays);

    // Check every 60 seconds
    this.checkIntervalId = window.setInterval(() => {
      this.checkAndNotify(streakDays);
      this.notifyListeners();
    }, 60000);

    return () => {
      if (this.checkIntervalId !== null) {
        clearInterval(this.checkIntervalId);
        this.checkIntervalId = null;
      }
    };
  }

  /**
   * Subscribe to status updates
   */
  public subscribe(listener: (status: StreakNotificationStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.warn('Listener error:', err);
      }
    });
  }
}

export const streakNotificationService = StreakNotificationService.getInstance();
