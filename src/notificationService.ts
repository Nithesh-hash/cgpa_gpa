import { DailyReminder, Projection, SemesterCourse, UserProfile } from './types';
import { calculateProjectionGpa } from './storage';

export type NotificationSupportStatus = 'granted' | 'denied' | 'default' | 'unsupported';

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
 * Request notification permission with fallbacks for Promise and callback APIs
 */
export async function requestNotificationPermission(): Promise<NotificationSupportStatus> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }

  // Ensure service worker is actively registered
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
      console.warn('SW registration during permission request:', e);
    }
  }

  try {
    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch {
        // Fallback for older WebKit callback syntax
        perm = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission(resolve);
        });
      }
    }
    return perm;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Play a gentle, pleasant notification chime using Web Audio API (no external MP3 needed)
 */
export function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Pleasant two-tone chime (E5 -> B5)
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(987.77, now + 0.12); // B5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    // Audio might be muted by browser autoplay policy if no recent user gesture
    console.debug('Chime audio playback note:', e);
  }
}

/**
 * Send notification reliably across Android (Chrome/PWA) and Desktop browsers
 */
export async function sendAppNotification(
  title: string,
  body: string,
  url: string = '/'
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window undefined' };
  }

  if (typeof Notification === 'undefined') {
    return { success: false, error: 'Notifications not supported' };
  }

  if (Notification.permission !== 'granted') {
    return { success: false, error: 'Permission not granted' };
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

  // 1. PRIMARY METHOD (Crucial for Android & PWAs): ServiceWorkerRegistration.showNotification
  if ('serviceWorker' in navigator) {
    try {
      // Ensure registration is active
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return { success: true };
      }
    } catch (swErr) {
      console.warn('Service worker showNotification failed, trying fallback:', swErr);
    }
  }

  // 2. FALLBACK METHOD (For desktop browsers where constructor is permitted)
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return { success: true };
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
      return { success: true };
    } catch (msgErr) {
      console.error('Post message to service worker failed:', msgErr);
    }
  }

  return { success: false, error: 'Could not display system notification' };
}

/**
 * Check reminders against current time and fire notification if due
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
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${currentHours}:${currentMinutes}`;
  const todayDateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  reminders.forEach((r) => {
    if (r.time === timeStr) {
      const storageKey = `vgrade_fired_${r.id}_${todayDateStr}_${timeStr}`;
      try {
        if (sessionStorage.getItem(storageKey)) {
          // Already fired during this minute
          return;
        }
        sessionStorage.setItem(storageKey, 'true');
      } catch {
        // Continue if sessionStorage disabled
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
