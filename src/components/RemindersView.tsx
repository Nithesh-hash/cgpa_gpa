import { useState, useEffect } from 'react';
import { DailyReminder, Projection, SemesterCourse, UserProfile } from '../types';
import { calculateProjectionGpa } from '../storage';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendAppNotification,
  NotificationSupportStatus,
} from '../notificationService';
import { Bell, Info, X, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [notificationStatusMsg, setNotificationStatusMsg] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  // Sync permission on mount or focus
  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
    const onFocus = () => setNotificationPermission(getNotificationPermission());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Request browser/device notification permission
  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);

    if (perm === 'granted') {
      setNotificationStatusMsg({
        text: 'Notifications enabled! Sending a quick confirmation alert...',
        type: 'success',
      });
      // Send immediate confirmation notification
      await sendAppNotification(
        'VGrade Notifications Active',
        'Daily reminders will now trigger alerts with your latest projected CGPA!'
      );
      setTimeout(() => {
        setNotificationStatusMsg({
          text: 'Notifications are working! Check your device notification bar.',
          type: 'success',
        });
      }, 500);
      setTimeout(() => setNotificationStatusMsg(null), 5000);
    } else if (perm === 'denied') {
      setNotificationStatusMsg({
        text: 'Notifications are blocked in your browser. Tap the settings/lock icon 🔒 near the address bar and select "Allow notifications".',
        type: 'warning',
      });
    } else {
      setNotificationStatusMsg({
        text: 'Notifications not enabled. You can enable them anytime.',
        type: 'info',
      });
    }
  };

  // Trigger test notification
  const handleTriggerTest = async (rem: DailyReminder) => {
    let currentPerm = notificationPermission;
    if (currentPerm !== 'granted') {
      currentPerm = await requestNotificationPermission();
      setNotificationPermission(currentPerm);
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
          text: '✅ Notification sent! Check your device notification tray.',
          type: 'success',
        });
        setTimeout(() => setNotificationStatusMsg(null), 4000);
      } else {
        setNotificationStatusMsg({
          text: `⚠️ Could not display notification (${result.error || 'check device notification settings'}).`,
          type: 'warning',
        });
      }
    } else {
      setNotificationStatusMsg({
        text: '⚠️ Notifications are blocked in browser. Please allow notifications in site settings.',
        type: 'warning',
      });
      alert(`[VGrade Reminder Preview]\n\n${text}\n\n(To receive system alerts, please allow notification permissions in your browser)`);
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
      {/* Title matching Screenshot 2 */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Reminders
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
          A line in your own words, every day at a time you choose, with the projected CGPA it belongs to.
        </p>
      </div>

      {/* Permission banner if not granted */}
      {notificationPermission !== 'granted' && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/20 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Notifications Not Active
              </p>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 truncate">
                Enable permissions to receive daily alarms on your device.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="text-xs font-black text-amber-900 dark:text-amber-100 bg-amber-200/70 hover:bg-amber-300 dark:bg-amber-800/80 dark:hover:bg-amber-700 px-3 py-1.5 rounded-xl shrink-0 transition-colors shadow-xs"
          >
            Enable
          </button>
        </div>
      )}

      {/* Notification status message */}
      {notificationStatusMsg && (
        <div
          className={`mb-4 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 shadow-sm animate-fade-in ${
            notificationStatusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : notificationStatusMsg.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
          }`}
        >
          {notificationStatusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
                  <span>Test notification</span>
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

        <p>Your phone's battery settings can stop reminders from arriving.</p>

        <button
          onClick={() => setShowBatteryGuide(true)}
          className="text-xs font-bold text-slate-900 dark:text-white underline inline-flex items-center gap-1 hover:opacity-80"
        >
          <Info className="w-3.5 h-3.5" />
          <span>How to keep them running</span>
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

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-1">Android Users (Chrome / PWA):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Long-press the <strong>VGrade</strong> (or Chrome) app icon &rarr; tap <strong>App Info</strong>.
                  </li>
                  <li>
                    Go to <strong>Battery</strong> &rarr; change from <em>"Optimized"</em> to <strong>"Unrestricted"</strong>.
                  </li>
                  <li>
                    Go to <strong>Notifications</strong> &rarr; ensure <strong>"Allow all notifications"</strong> is enabled.
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-1">PWA Installation:</p>
                <p>
                  Installing VGrade to your home screen gives it native Android background persistence and highest notification priority.
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
