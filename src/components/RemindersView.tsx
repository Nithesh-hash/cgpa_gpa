import { useState, useEffect } from 'react';
import { DailyReminder, Projection, SemesterCourse, UserProfile } from '../types';
import { calculateProjectionGpa } from '../storage';
import { Bell, Info, X } from 'lucide-react';

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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notificationStatusMsg, setNotificationStatusMsg] = useState('');

  // Request browser/device notification permission
  const handleRequestPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Notifications are not supported in this browser or environment.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      setNotificationStatusMsg('Notifications allowed! Reminders will now display alert banners.');
      setTimeout(() => setNotificationStatusMsg(''), 4000);
    } else {
      setNotificationStatusMsg('Notifications permission was not granted.');
    }
  };

  // Trigger test notification
  const handleTriggerTest = (rem: DailyReminder) => {
    const proj = projections.find((p) => p.id === rem.projectionId) || projections[0];
    const { cgpa } = proj ? calculateProjectionGpa(proj, courses, profile) : { cgpa: profile.currentCgpa };
    const text = `${rem.message.trim() || 'Reminder'} — projected CGPA ${cgpa.toFixed(2)}.`;

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('VGrade Reminder', {
        body: text,
        icon: '/favicon.ico',
      });
    } else {
      alert(`[VGrade Notification Preview]\n\n${text}`);
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
  };

  const handleRemoveReminder = (id: string) => {
    onUpdateReminders(reminders.filter((r) => r.id !== id));
  };

  // Background check for matching reminder time (every 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;

      reminders.forEach((r) => {
        if (r.time === timeStr && now.getSeconds() < 30) {
          const proj = projections.find((p) => p.id === r.projectionId) || projections[0];
          const { cgpa } = proj
            ? calculateProjectionGpa(proj, courses, profile)
            : { cgpa: profile.currentCgpa };
          const body = `${r.message} — projected CGPA ${cgpa.toFixed(2)}.`;

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('VGrade Daily Reminder', { body, icon: '/favicon.ico' });
          }
        }
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [reminders, projections, courses, profile]);

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
      {notificationPermission !== 'granted' && typeof Notification !== 'undefined' && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs text-amber-800 dark:text-amber-200 font-medium">
              Enable notifications to receive daily alarms.
            </span>
          </div>
          <button
            onClick={handleRequestPermission}
            className="text-xs font-bold text-amber-900 dark:text-amber-100 underline shrink-0 px-2 py-1"
          >
            Enable
          </button>
        </div>
      )}

      {notificationStatusMsg && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold">
          {notificationStatusMsg}
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
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline"
                >
                  Test notification
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

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Which projection
        </p>

        {/* Projection selector pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {projections.map((p) => {
            const isSelected = p.id === selectedProjId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjId(p.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Add reminder button */}
        <button
          onClick={handleAddReminder}
          className="w-full py-3.5 rounded-2xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-sm transition-all active:scale-[0.99]"
        >
          Add reminder
        </button>
      </div>

      {/* Guidance footnote */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
        <p>The notification states the number and nothing else about it. No comparison to yesterday.</p>
        <p>
          Your phone's battery settings can stop reminders from arriving.{' '}
          <button
            onClick={() => setShowBatteryGuide(true)}
            className="font-bold text-slate-800 dark:text-slate-200 underline"
          >
            How to keep them running
          </button>
        </p>
      </div>

      {/* Battery Optimization Modal */}
      {showBatteryGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-pink-500" />
                Keep Reminders Running
              </h3>
              <button
                onClick={() => setShowBatteryGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                Android aggressively kills background timers and alarms when screens are off unless
                battery optimization is disabled for VGrade.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 font-medium">
                <p className="font-bold text-slate-900 dark:text-white">Recommended Settings:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>App Info → Battery</strong>: Set to <em>"Unrestricted"</em> instead of
                    "Optimized".
                  </li>
                  <li>
                    <strong>Notifications</strong>: Ensure <em>"Allow all notifications"</em> is
                    enabled.
                  </li>
                  <li>
                    <strong>Samsung / OneUI</strong>: Add VGrade to <em>"Never sleeping apps"</em>.
                  </li>
                  <li>
                    <strong>Xiaomi / MIUI</strong>: Set Battery Saver to <em>"No restrictions"</em>{' '}
                    and enable AutoStart.
                  </li>
                  <li>
                    <strong>OnePlus / OxygenOS</strong>: Disable <em>"Sleep standby optimization"</em>.
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-slate-400">
                Reminders are stored locally and recalculate dynamically using your latest default
                or selected projection.
              </p>
            </div>

            <button
              onClick={() => setShowBatteryGuide(false)}
              className="mt-5 w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

