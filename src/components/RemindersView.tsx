import { useState, useEffect } from 'react';
import { DailyReminder, Projection, SemesterCourse, UserProfile } from '../types';
import { calculateProjectionGpa } from '../storage';
import {
  getNotificationPermission,
  getNotificationDiagnostics,
  requestNotificationPermission,
  sendAppNotification,
  scheduleDelayedNotification,
  NotificationSupportStatus,
  NotificationDiagnostics,
} from '../notificationService';
import {
  Bell,
  Info,
  X,
  CheckCircle,
  AlertTriangle,
  Send,
  Timer,
  Lock,
  Smartphone,
} from 'lucide-react';

interface RemindersViewProps {
  reminders: DailyReminder[];
  projections: Projection[];
  courses: SemesterCourse[];
  profile: UserProfile;
  onUpdateReminders: (reminders: DailyReminder[]) => void;
}

export function RemindersView({
  reminders,
  projections,
  courses,
  profile,
  onUpdateReminders,
}: RemindersViewProps) {
  const [newTime, setNewTime] = useState('07:30');
  const [newMessage, setNewMessage] = useState('');
  const [selectedProjId, setSelectedProjId] = useState(
    projections.find((p) => p.isDefault)?.id || projections[0]?.id || ''
  );
  const [showBatteryGuide, setShowBatteryGuide] = useState(false);
  const [diagnostics, setDiagnostics] = useState<NotificationDiagnostics>(getNotificationDiagnostics);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationSupportStatus>(getNotificationPermission);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [notificationStatusMsg, setNotificationStatusMsg] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  // Sync permission and diagnostics on mount or focus
  useEffect(() => {
    const refreshStatus = () => {
      setNotificationPermission(getNotificationPermission());
      setDiagnostics(getNotificationDiagnostics());
    };
    refreshStatus();
    window.addEventListener('focus', refreshStatus);
    return () => window.removeEventListener('focus', refreshStatus);
  }, []);

  // Request browser/device notification permission (immediate user gesture)
  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    setDiagnostics(getNotificationDiagnostics());

    if (perm === 'granted') {
      setNotificationStatusMsg({
        text: 'Notifications enabled! Sending a confirmation test alert to your device...',
        type: 'success',
      });
      // Send immediate confirmation notification
      await sendAppNotification(
        'VGrade Notifications Active',
        'Daily reminders will now trigger alerts with your latest projected CGPA!'
      );
      setTimeout(() => {
        setNotificationStatusMsg({
          text: 'Notifications active! Check your device notification tray.',
          type: 'success',
        });
      }, 600);
      setTimeout(() => setNotificationStatusMsg(null), 5000);
    } else if (perm === 'denied') {
      setNotificationStatusMsg({
        text: 'Notifications are blocked in browser settings. Please click the 🔒 lock icon in the address bar to allow.',
        type: 'warning',
      });
    } else {
      setNotificationStatusMsg({
        text: 'Notification permission was dismissed.',
        type: 'info',
      });
    }
  };

  // Immediate Test Notification
  const handleInstantTest = async () => {
    let currentPerm = notificationPermission;
    if (currentPerm !== 'granted') {
      currentPerm = await requestNotificationPermission();
      setNotificationPermission(currentPerm);
      setDiagnostics(getNotificationDiagnostics());
    }

    const defaultProj = projections.find((p) => p.id === selectedProjId) || projections[0];
    const { cgpa } = defaultProj
      ? calculateProjectionGpa(defaultProj, courses, profile)
      : { cgpa: profile.currentCgpa };
    const text = `Study well — projected CGPA ${cgpa.toFixed(2)}.`;

    if (currentPerm === 'granted') {
      const result = await sendAppNotification('VGrade Reminder', text);
      if (result.success) {
        setNotificationStatusMsg({
          text: `✅ Alert dispatched (${result.method || 'active'})! Check your notification tray.`,
          type: 'success',
        });
        setTimeout(() => setNotificationStatusMsg(null), 5000);
      } else {
        setNotificationStatusMsg({
          text: `⚠️ Could not display: ${result.error || 'check Windows Focus Assist or phone notification settings'}.`,
          type: 'warning',
        });
      }
    } else {
      setNotificationStatusMsg({
        text: '⚠️ Notifications blocked by browser. Please allow notifications in site permissions.',
        type: 'warning',
      });
    }
  };

  // 5-second delayed test (so user can lock phone or switch apps to test background delivery)
  const handleDelayed5sTest = async () => {
    let currentPerm = notificationPermission;
    if (currentPerm !== 'granted') {
      currentPerm = await requestNotificationPermission();
      setNotificationPermission(currentPerm);
      setDiagnostics(getNotificationDiagnostics());
      if (currentPerm !== 'granted') return;
    }

    const defaultProj = projections.find((p) => p.id === selectedProjId) || projections[0];
    const { cgpa } = defaultProj
      ? calculateProjectionGpa(defaultProj, courses, profile)
      : { cgpa: profile.currentCgpa };
    const text = `Study well — projected CGPA ${cgpa.toFixed(2)}.`;

    setCountdownSeconds(5);
    setNotificationStatusMsg({
      text: '⏱️ Test scheduled in 5 seconds! Lock your phone screen now to test lockscreen delivery.',
      type: 'info',
    });

    let sec = 5;
    const interval = setInterval(() => {
      sec -= 1;
      if (sec > 0) {
        setCountdownSeconds(sec);
      } else {
        clearInterval(interval);
        setCountdownSeconds(null);
        setNotificationStatusMsg({
          text: '✅ 5-second test fired! Check your lockscreen or notification shade.',
          type: 'success',
        });
        setTimeout(() => setNotificationStatusMsg(null), 6000);
      }
    }, 1000);

    scheduleDelayedNotification('VGrade Daily Reminder', text, 5);
  };

  // Trigger test for a specific reminder
  const handleTriggerTest = async (rem: DailyReminder) => {
    let currentPerm = notificationPermission;
    if (currentPerm !== 'granted') {
      currentPerm = await requestNotificationPermission();
      setNotificationPermission(currentPerm);
      setDiagnostics(getNotificationDiagnostics());
    }

    const proj = projections.find((p) => p.id === rem.projectionId) || projections[0];
    const { cgpa } = proj
      ? calculateProjectionGpa(proj, courses, profile)
      : { cgpa: profile.currentCgpa };
    const text = `${rem.message.trim() || 'Reminder'} — projected CGPA ${cgpa.toFixed(2)}.`;

    if (currentPerm === 'granted') {
      const result = await sendAppNotification('VGrade Reminder', text);
      if (result.success) {
        setNotificationStatusMsg({
          text: '✅ Notification sent! Check your notification tray.',
          type: 'success',
        });
        setTimeout(() => setNotificationStatusMsg(null), 4000);
      } else {
        setNotificationStatusMsg({
          text: `⚠️ Could not display: ${result.error || 'check device notification settings'}.`,
          type: 'warning',
        });
      }
    } else {
      setNotificationStatusMsg({
        text: '⚠️ Notifications blocked by browser. Tap 🔒 in address bar to allow.',
        type: 'warning',
      });
      alert(`[VGrade Reminder Preview]\n\n${text}\n\n(Please allow notification permissions in your browser to receive system alerts)`);
    }
  };

  const handleAddReminder = () => {
    if (!newTime) {
      alert('Please select a reminder time.');
      return;
    }
    const newRem: DailyReminder = {
      id: `rem-${Date.now()}`,
      time: newTime,
      message: newMessage.trim() || 'Study well',
      projectionId: selectedProjId || projections[0]?.id || '',
    };
    onUpdateReminders([...reminders, newRem]);
    setNewMessage('');

    // If permission not granted yet, suggest enabling it
    if (notificationPermission !== 'granted') {
      handleRequestPermission();
    }
  };

  const handleRemoveReminder = (id: string) => {
    onUpdateReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="pb-16 text-slate-900 dark:text-slate-100">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Reminders
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
          A line in your own words, every day at a time you choose, with the projected CGPA it belongs to.
        </p>
      </div>

      {/* NOTIFICATION STATUS & DIAGNOSTICS CARD */}
      <div className="mb-6 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400'
                  : notificationPermission === 'denied'
                  ? 'bg-red-500/10 text-red-600 dark:bg-red-400/20 dark:text-red-400'
                  : 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Notification Status:{' '}
                <span
                  className={
                    notificationPermission === 'granted'
                      ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                      : notificationPermission === 'denied'
                      ? 'text-red-500 font-extrabold'
                      : 'text-amber-600 dark:text-amber-400 font-extrabold'
                  }
                >
                  {notificationPermission === 'granted'
                    ? 'Active (Allowed) ✓'
                    : notificationPermission === 'denied'
                    ? 'Blocked ✕'
                    : 'Permission Needed'}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {notificationPermission === 'granted'
                  ? 'Ready to alert your phone / computer'
                  : notificationPermission === 'denied'
                  ? 'Blocked in browser site settings'
                  : 'Click enable to allow alerts'}
              </p>
            </div>
          </div>

          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs shadow-xs active:scale-95 transition-all"
            >
              Enable
            </button>
          )}
        </div>

        {/* Warning if Blocked in Browser */}
        {notificationPermission === 'denied' && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>How to unblock notifications:</span>
            </p>
            <ol className="list-decimal pl-4 space-y-0.5 opacity-90">
              <li>Tap or click the <strong>🔒 lock / tune icon</strong> in your browser's address bar.</li>
              <li>Tap <strong>Permissions</strong> or <strong>Site Settings</strong>.</li>
              <li>Change <strong>Notifications</strong> to <strong>Allow</strong>, then refresh.</li>
            </ol>
          </div>
        )}

        {/* Insecure context warning (if accessed via non-localhost HTTP on mobile) */}
        {!diagnostics.isSecureContext && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
            <p className="font-bold">⚠️ Insecure HTTP connection detected</p>
            <p className="opacity-85 mt-0.5">
              Modern mobile browsers block notifications on plain HTTP IP addresses. Access via localhost or deploy to HTTPS.
            </p>
          </div>
        )}

        {/* Quick Test Buttons */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2">
          <button
            onClick={handleInstantTest}
            className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-all"
          >
            <Send className="w-3.5 h-3.5 text-blue-500" />
            <span>Instant Test</span>
          </button>

          <button
            onClick={handleDelayed5sTest}
            disabled={countdownSeconds !== null}
            className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Timer className="w-3.5 h-3.5 text-amber-500" />
            <span>{countdownSeconds !== null ? `Lock now! (${countdownSeconds}s)` : 'Test in 5s (Lock)'}</span>
          </button>
        </div>
      </div>

      {/* Notification status message toast */}
      {notificationStatusMsg && (
        <div
          className={`mb-5 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fade-in ${
            notificationStatusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : notificationStatusMsg.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}
        >
          {notificationStatusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : notificationStatusMsg.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">{notificationStatusMsg.text}</span>
          <button
            onClick={() => setNotificationStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-4 mb-6">
        {reminders.map((rem) => {
          const proj = projections.find((p) => p.id === rem.projectionId) || projections[0];
          const projName = proj ? proj.name : 'Selected projection';
          const { cgpa } = proj
            ? calculateProjectionGpa(proj, courses, profile)
            : { cgpa: profile.currentCgpa };
          const formattedCgpa = cgpa.toFixed(2);

          return (
            <div
              key={rem.id}
              className="bg-slate-50/90 dark:bg-slate-800/80 rounded-[28px] p-6 border border-slate-100 dark:border-slate-700/60 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {rem.time}
                </span>
                <button
                  onClick={() => handleRemoveReminder(rem.id)}
                  className="text-xs font-bold text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>

              <p className="text-base font-extrabold text-slate-900 dark:text-white mb-3">
                {rem.message}
              </p>

              {/* Sub-card: what it will say */}
              <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 mb-3">
                <p className="text-[11px] text-slate-400 font-medium mb-1">
                  Daily · what it will say
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {rem.message} — projected CGPA {formattedCgpa}.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  From {projName}, recalculated when it fires
                </p>
                <button
                  onClick={() => handleTriggerTest(rem)}
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Test this alert</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Reminder Card (Dashed Border) */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[28px] p-6 bg-slate-50/30 dark:bg-slate-800/20 mb-6">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-3">New reminder</h3>

        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="col-span-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full text-center py-3 px-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
            />
          </div>
          <div className="col-span-3">
            <input
              type="text"
              placeholder="Your message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Which projection selector */}
        <div className="mb-5">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
            Which projection
          </label>
          <div className="flex flex-wrap gap-2">
            {projections.map((p) => {
              const isSelected = p.id === selectedProjId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjId(p.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-white text-slate-700 border border-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleAddReminder}
          className="w-full py-3.5 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-extrabold text-sm transition-all active:scale-[0.99]"
        >
          Add reminder
        </button>
      </div>

      {/* Footnotes & Battery Settings Guidance */}
      <div className="space-y-3 text-xs text-slate-400 leading-relaxed px-1">
        <p>The notification states the number and nothing else about it. No comparison to yesterday.</p>

        <p>Your phone's battery settings can stop background reminders from waking the screen.</p>

        <button
          onClick={() => setShowBatteryGuide(true)}
          className="text-xs font-bold text-slate-900 dark:text-white underline inline-flex items-center gap-1 hover:opacity-80"
        >
          <Info className="w-3.5 h-3.5" />
          <span>How to keep them running (Android & iOS)</span>
        </button>
      </div>

      {/* Battery Optimization Guide Modal */}
      {showBatteryGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-900 dark:text-white" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Keep Reminders Running
                </h3>
              </div>
              <button
                onClick={() => setShowBatteryGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              <p>
                Android and iOS battery managers aggressively suspend web background tasks when the phone is locked or asleep.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  <span>Android Users (Chrome / PWA):</span>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>
                    Long-press the <strong>VGrade</strong> icon &rarr; tap <strong>App Info</strong>.
                  </li>
                  <li>
                    Go to <strong>Battery</strong> &rarr; change from <em>"Optimized"</em> to <strong>"Unrestricted"</strong>.
                  </li>
                  <li>
                    Go to <strong>Notifications</strong> &rarr; ensure <strong>"Allow all notifications"</strong> is enabled.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">PWA Installation (Recommended):</p>
                <p className="text-[11px]">
                  Installing VGrade to your home screen gives it native background scheduling priority on your phone.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBatteryGuide(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs shadow-sm active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
