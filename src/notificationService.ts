import { DailyReminder, Projection, SemesterCourse, UserProfile } from './types';
import { calculateProjectionGpa } from './storage';

export type NotificationSupportStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationDiagnostics {
  supported: boolean;
  permission: NotificationSupportStatus;
  isSecureContext: boolean;
  hasServiceWorker: boolean;
}

/**
 * Diagnostic check to understand exact device and browser notification capabilities
 */
export function getNotificationDiagnostics(): NotificationDiagnostics {
  const supported = typeof window !== 'undefined' && typeof Notification !== 'undefined';
  const permission: NotificationSupportStatus = supported ? Notification.permission : 'unsupported';
  const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
  const hasSW = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  return {
    supported,
    permission,
    isSecureContext: isSecure,
    hasServiceWorker: hasSW,
  };
}

/**
 * Check current notification permission status across browsers/devices
 */
export function getNotificationPermission(): NotificationSupportStatus {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission.
 * IMPORTANT: Notification.requestPermission() MUST be invoked synchronously in the user gesture!
 * Do NOT await any asynchronous calls prior to requestPermission, or modern browsers will drop the user activation.
 */
export async function requestNotificationPermission(): Promise<NotificationSupportStatus> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }

  try {
    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch {
        // Fallback for older callback syntax
        perm = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission(resolve);
        });
      }
    }

    // After permission prompt settles, ensure service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) => {
        console.warn('SW registration post-permission warning:', e);
      });
    }

    return perm;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  }
}

/**
 * Play a gentle, pleasant notification chime using Web Audio API (works without external audio assets)
 */
export function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Two-tone chime (E5 -> B5)
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(987.77, now + 0.12); // B5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    console.debug('Chime audio notice:', e);
  }
}

/**
 * Helper to safely retrieve an active ServiceWorkerRegistration without hanging indefinitely
 */
async function getActiveServiceWorker(timeoutMs: number = 1000): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // 1. Fast check if already registered
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.active) {
      return reg;
    }
  } catch (e) {
    console.warn('Error checking getRegistration:', e);
  }

  // 2. Race .ready with a timeout so execution NEVER freezes
  try {
    const readyReg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    return readyReg;
  } catch {
    return null;
  }
}

/**
 * Send notification reliably across Android (Chrome/PWA) and Desktop browsers
 */
export async function sendAppNotification(
  title: string,
  body: string,
  url: string = '/'
): Promise<{ success: boolean; method?: string; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not defined' };
  }

  if (typeof Notification === 'undefined') {
    return { success: false, error: 'Notifications API not supported in this browser' };
  }

  if (Notification.permission !== 'granted') {
    return { success: false, error: `Permission is '${Notification.permission}' (not granted)` };
  }

  // Play audio chime
  playNotificationChime();

  const notificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: `vgrade-reminder-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200] as unknown as number[],
    data: {
      url,
      timestamp: Date.now(),
    },
  };

  // 1. PRIMARY METHOD (Required on Android / PWAs): ServiceWorkerRegistration.showNotification
  const swReg = await getActiveServiceWorker(1200);
  if (swReg && 'showNotification' in swReg) {
    try {
      await swReg.showNotification(title, notificationOptions);
      return { success: true, method: 'serviceworker' };
    } catch (swErr) {
      console.warn('SW showNotification failed, trying constructor:', swErr);
    }
  }

  // 2. FALLBACK METHOD (Desktop browsers where new Notification() constructor is standard)
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return { success: true, method: 'notification-constructor' };
  } catch (notifErr) {
    console.warn('Notification constructor failed:', notifErr);
  }

  // 3. SERVICE WORKER MESSAGE POSTING FALLBACK
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: notificationOptions,
      });
      return { success: true, method: 'sw-message' };
    } catch (msgErr) {
      console.error('Post message to service worker failed:', msgErr);
    }
  }

  return {
    success: false,
    error: 'Notification dispatched but suppressed by device/OS notification manager or battery saver.',
  };
}

/**
 * Schedule a test notification with a delay (so user can lock their phone to test lock screen delivery)
 */
export function scheduleDelayedNotification(
  title: string,
  body: string,
  delaySeconds: number = 5,
  onScheduled?: () => void
) {
  if (onScheduled) onScheduled();

  const notificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: `vgrade-reminder-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200] as unknown as number[],
    data: { url: '/', timestamp: Date.now() },
  };

  // Tell service worker if available
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      title,
      options: notificationOptions,
      delayMs: delaySeconds * 1000,
    });
  }

  // Also run client setTimeout fallback
  setTimeout(() => {
    sendAppNotification(title, body).catch((e) => console.error('Delayed notification error:', e));
  }, delaySeconds * 1000);
}

/**
 * Calculate milliseconds until the next occurrence of HH:MM (today or tomorrow)
 */
export function getMsUntilTime(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const targetHour = parseInt(parts[0], 10);
  const targetMin = parseInt(parts[1], 10);
  if (isNaN(targetHour) || isNaN(targetMin)) return 0;

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMin, 0, 0);

  // If already passed today, target is tomorrow at that time
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return Math.max(1000, target.getTime() - now.getTime());
}

/**
 * Sync active reminders to Service Worker so it can schedule notifications in background
 */
export function syncRemindersWithServiceWorker(
  reminders: DailyReminder[],
  projections: Projection[],
  courses: SemesterCourse[],
  profile: UserProfile
) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const scheduled = reminders.map((r) => {
    const proj = projections.find((p) => p.id === r.projectionId) || projections[0];
    const { cgpa } = proj
      ? calculateProjectionGpa(proj, courses, profile)
      : { cgpa: profile.currentCgpa };
    const formattedCgpa = cgpa.toFixed(2);
    const body = `${r.message.trim() || 'Study well'} — projected CGPA ${formattedCgpa}.`;
    const delayMs = getMsUntilTime(r.time);

    return {
      id: r.id,
      title: 'VGrade Daily Reminder',
      body,
      time: r.time,
      delayMs,
    };
  });

  navigator.serviceWorker.ready
    .then((reg) => {
      if (reg && reg.active) {
        reg.active.postMessage({
          type: 'SYNC_SCHEDULED_REMINDERS',
          reminders: scheduled,
        });
      }
    })
    .catch((e) => console.debug('SW sync notice:', e));
}

/**
 * Standardize time string format (e.g. "7:30" -> "07:30")
 */
export function normalizeTimeStr(t: string): string {
  if (!t) return '';
  const parts = t.trim().split(':');
  if (parts.length < 2) return t;
  const h = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Check reminders against current time and fire notification at the set time
 */
export function checkAndTriggerReminders(
  reminders: DailyReminder[],
  projections: Projection[],
  courses: SemesterCourse[],
  profile: UserProfile,
  onTriggerInApp?: (message: string, formattedText: string) => void
) {
  if (reminders.length === 0) return;

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentMinutesTotal = currentHours * 60 + currentMinutes;
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  reminders.forEach((r) => {
    const parts = r.time.trim().split(':');
    if (parts.length < 2) return;
    const remHour = parseInt(parts[0], 10);
    const remMin = parseInt(parts[1], 10);
    if (isNaN(remHour) || isNaN(remMin)) return;

    const remMinutesTotal = remHour * 60 + remMin;
    const lastFiredKey = `vgrade_reminder_last_fired_${r.id}`;
    let lastFiredDate: string | null = null;
    try {
      lastFiredDate = localStorage.getItem(lastFiredKey);
    } catch {
      // Ignore localStorage errors
    }

    // If already fired today, do not fire again
    if (lastFiredDate === todayDateStr) {
      return;
    }

    // Check if the current time has reached or passed the reminder time today
    const diff = currentMinutesTotal - remMinutesTotal;
    // Fire if we are at the exact time or within 30 minutes after (in case device was asleep/locked)
    if (diff >= 0 && diff <= 30) {
      try {
        localStorage.setItem(lastFiredKey, todayDateStr);
      } catch {
        // Continue if localStorage is restricted
      }

      const proj = projections.find((p) => p.id === r.projectionId) || projections[0];
      const { cgpa } = proj
        ? calculateProjectionGpa(proj, courses, profile)
        : { cgpa: profile.currentCgpa };
      const formattedCgpa = cgpa.toFixed(2);
      const text = `${r.message.trim() || 'Study well'} — projected CGPA ${formattedCgpa}.`;

      // Trigger system notification
      sendAppNotification('VGrade Daily Reminder', text).catch((err) => {
        console.error('Error triggering daily reminder notification:', err);
      });

      // Also trigger in-app banner callback
      if (onTriggerInApp) {
        onTriggerInApp(r.message, text);
      }
    }
  });
}
