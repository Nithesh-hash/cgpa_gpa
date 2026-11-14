import { useState, useEffect } from 'react';
import { DailyReminder, Projection, SemesterCourse, UserProfile } from '../types';
import { calculateProjectionGpa } from '../storage';
import {
  getNotificationPermission,
  requestNotificationPermission,
  NotificationSupportStatus,
} from '../notificationService';
import {
  Bell,
  Info,
  X,
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
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationSupportStatus>(getNotificationPermission);

  // Sync permission on mount or focus
  useEffect(() => {
    const refreshStatus = () => {
      setNotificationPermission(getNotificationPermission());
    };
    refreshStatus();
    window.addEventListener('focus', refreshStatus);
    return () => window.removeEventListener('focus', refreshStatus);
  }, []);

  // Request browser/device notification permission (clean, no test notification)
  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
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

    // If the chosen time has already passed today, mark it as fired for today
    // so it doesn't trigger immediately, but fires tomorrow at the set time
    const now = new Date();
    const parts = newTime.split(':');
    const remHour = parseInt(parts[0], 10);
    const remMin = parseInt(parts[1], 10);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const remMins = remHour * 60 + remMin;
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (remMins < currentMins) {
      try {
        localStorage.setItem(`vgrade_reminder_last_fired_${newRem.id}`, todayDateStr);
      } catch {
        // Ignore
      }
    }

    onUpdateReminders([...reminders, newRem]);
    setNewMessage('');

    // If permission not granted yet, ask for it
    if (notificationPermission !== 'granted') {
      handleRequestPermission();
    }
  };

  const handleRemoveReminder = (id: string) => {
    try {
      localStorage.removeItem(`vgrade_reminder_last_fired_${id}`);
    } catch {
      // Ignore
    }
    onUpdateReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="pb-16 text-slate-900 dark:text-slate-100">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reminders
        </h1>
        <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-1 leading-snug">
          A line in your own words, every day at a time you choose, with the projected CGPA it belongs to.
        </p>
      </div>

      {/* Permission banner (only if not yet granted) */}
      {notificationPermission !== 'granted' && (
        <div className="mb-6 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Enable Notifications
              </p>
              <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                Allow notifications to receive alerts at your scheduled time.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-xs active:scale-95 transition-all shrink-0"
          >
            Enable
          </button>
        </div>
      )}

      {notificationPermission === 'denied' && (
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
          Notifications are currently blocked in your browser site settings. Tap the lock icon in the address bar to allow notifications for VGrade.
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
                <span className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white tracking-tight">
                  {rem.time}
                </span>
                <button
                  onClick={() => handleRemoveReminder(rem.id)}
                  className="text-xs font-semibold text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>

              <p className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                {rem.message}
              </p>

              {/* Sub-card: what it will say */}
              <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 mb-2">
                <p className="text-[11px] text-slate-400 font-normal mb-1">
                  Daily · what it will say
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {rem.message} — projected CGPA <span className="tabular-nums">{formattedCgpa}</span>.
                </p>
              </div>

              <p className="text-xs font-normal text-slate-400">
                From {projName}, recalculated when it fires
              </p>
            </div>
          );
        })}
      </div>

      {/* New Reminder Card (Dashed Border) */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[28px] p-6 bg-slate-50/30 dark:bg-slate-800/20 mb-6">
        <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-3">New reminder</h3>

        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="col-span-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full text-center py-3 px-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold tabular-nums text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
            />
          </div>
          <div className="col-span-3">
            <input
              type="text"
              placeholder="Your message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-normal text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
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
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all shadow-xs ${
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
          className="w-full py-3.5 rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold text-sm transition-all active:scale-[0.99]"
        >
          Add reminder
        </button>
      </div>

      {/* Footnotes & Battery Settings Guidance */}
      <div className="space-y-3 text-xs font-normal text-slate-400 leading-relaxed px-1">
        <p>The notification states the number and nothing else about it. No comparison to yesterday.</p>

        <p>Your phone's battery settings can stop background reminders from waking the screen.</p>

        <button
          onClick={() => setShowBatteryGuide(true)}
          className="text-xs font-semibold text-slate-900 dark:text-white underline inline-flex items-center gap-1 hover:opacity-80"
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
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
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
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
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
                <p className="font-semibold text-slate-900 dark:text-white">PWA Installation (Recommended):</p>
                <p className="text-[11px]">
                  Installing VGrade to your home screen gives it native background scheduling priority on your phone.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBatteryGuide(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-sm active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}