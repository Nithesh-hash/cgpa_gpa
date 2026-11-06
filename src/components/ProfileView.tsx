import { useState } from 'react';
import { UserProfile, SemesterCourse, Projection, DailyReminder } from '../types';
import { calculateSemesterCredits } from '../storage';
import { RemindersView } from './RemindersView';
import {
  BookOpen,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Bell,
  Pencil,
  Check,
  ShieldCheck,
  Download,
  Smartphone,
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  courses: SemesterCourse[];
  projections: Projection[];
  reminders: DailyReminder[];
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateCourses: (courses: SemesterCourse[]) => void;
  onUpdateReminders: (reminders: DailyReminder[]) => void;
  onClearAllData: () => void;
}

export function ProfileView({
  profile,
  courses,
  projections,
  reminders,
  onUpdateProfile,
  onUpdateCourses,
  onUpdateReminders,
  onClearAllData,
}: ProfileViewProps) {
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallClick = async () => {
    const deferredPrompt = (window as unknown as { deferredPrompt?: { prompt: () => void; userChoice: Promise<{ outcome: string }> } }).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      (window as unknown as { deferredPrompt?: unknown }).deferredPrompt = null;
    } else {
      setShowInstallModal(true);
    }
  };

  // Course draft / edit state for courses modal
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState('3');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const totalSemesterCredits = calculateSemesterCredits(courses);

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    if (field === 'currentCgpa') {
      const num = parseFloat(value);
      onUpdateProfile({ ...profile, currentCgpa: isNaN(num) ? 0 : num });
    } else if (field === 'earnedCredits') {
      const num = parseFloat(value);
      onUpdateProfile({ ...profile, earnedCredits: isNaN(num) ? 0 : num });
    } else {
      onUpdateProfile({ ...profile, [field]: value });
    }
  };

  const handleStartEditCourse = (course: SemesterCourse) => {
    setEditingCourseId(course.id);
    setNewCourseName(course.name);
    setNewCourseCredits(String(course.credits));
  };

  const handleCancelEditCourse = () => {
    setEditingCourseId(null);
    setNewCourseName('');
    setNewCourseCredits('3');
  };

  const handleSaveCourse = () => {
    if (!newCourseName.trim()) {
      alert('Please enter a course name');
      return;
    }
    const cred = parseFloat(newCourseCredits);
    const parsedCred = isNaN(cred) ? 3 : cred;

    if (editingCourseId) {
      onUpdateCourses(
        courses.map((c) =>
          c.id === editingCourseId
            ? {
                ...c,
                name: newCourseName.trim(),
                credits: parsedCred,
              }
            : c
        )
      );
      handleCancelEditCourse();
    } else {
      const newCourse: SemesterCourse = {
        id: `course-${Date.now()}`,
        name: newCourseName.trim(),
        credits: parsedCred,
        type: 'Theory',
        grading: 'Relative',
        marks: { cat1: null, cat2: null, internals: null, fat: null },
        cutoffs: { S: null, A: null, B: null, C: null, D: null },
      };
      onUpdateCourses([...courses, newCourse]);
      setNewCourseName('');
      setNewCourseCredits('3');
    }
  };

  const handleDeleteCourse = (id: string) => {
    if (courses.length <= 1) {
      alert('You must retain at least one course.');
      return;
    }
    if (editingCourseId === id) {
      handleCancelEditCourse();
    }
    onUpdateCourses(courses.filter((c) => c.id !== id));
  };

  return (
    <div className="pb-16 text-slate-900 dark:text-slate-100">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Profile
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Everything here is editable.
        </p>
      </div>

      {/* Profile Form Fields */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Niku"
            value={profile.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Registration number (Optional)
          </label>
          <input
            type="text"
            placeholder="Leave empty or enter Reg No"
            value={profile.regNo}
            onChange={(e) => handleFieldChange('regNo', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold uppercase text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            School (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. SCORE"
            value={profile.school}
            onChange={(e) => handleFieldChange('school', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Department / Branch (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Software Engineering"
            value={profile.branch}
            onChange={(e) => handleFieldChange('branch', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* CGPA & Earned Credits Cards - Two Separate Cards matching Reference */}
      <div className="grid grid-cols-2 gap-3.5 mb-2">
        <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-[28px] p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Current CGPA
          </label>
          <input
            type="number"
            step="0.01"
            value={profile.currentCgpa || ''}
            onChange={(e) => handleFieldChange('currentCgpa', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-3xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white shadow-sm"
          />
        </div>

        <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-[28px] p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Earned credits
          </label>
          <input
            type="number"
            step="0.5"
            value={profile.earnedCredits || ''}
            onChange={(e) => handleFieldChange('earnedCredits', e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-3xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white shadow-sm"
          />
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-400 mb-6 leading-relaxed">
        From VTOP. Update anytime.
      </p>

      {/* Action Rows */}
      <div className="space-y-3 mb-6">
        {/* Semester Courses Row */}
        <button
          onClick={() => setShowCoursesModal(true)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 transition-all text-left shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                This semester's courses
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                {courses.length} courses · {totalSemesterCredits} credits
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Daily Reminders Row - integrated inside Profile section */}
        <button
          onClick={() => setShowRemindersModal(true)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 transition-all text-left shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Reminders
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                {reminders.length > 0
                  ? `${reminders.length} reminder${reminders.length > 1 ? 's' : ''} set · ${reminders[0].time}`
                  : 'Set custom study alarms with projected CGPA'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* About VGrade Row */}
        <button
          onClick={() => setShowAboutModal(true)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 transition-all text-left shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                About VGrade and developer
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Terms & version
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Install Web App Row */}
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100 transition-all text-left shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-white shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Install VGrade Web App
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Add to home screen for fast offline access
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Local Storage Privacy Disclaimer Card */}
      <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3.5 mb-4 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">100% Private · Stored Locally</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            All your data is kept exclusively on this device in your browser's local storage. Nothing is stored on or sent to any external server or database. Nobody other than you has access to your records.
          </p>
        </div>
      </div>

      {/* Clear All Data Card */}
      <div
        onClick={() => setShowClearConfirm(true)}
        className="p-6 rounded-[28px] bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 cursor-pointer hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all"
      >
        <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Clear all data</p>
        <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed">
          Reset all data to start fresh.
        </p>
      </div>

      {/* SEMESTER COURSES MANAGER MODAL */}
      {showCoursesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Semester Courses
                </h3>
                <p className="text-xs text-slate-400">
                  {courses.length} courses · {totalSemesterCredits} total credits
                </p>
              </div>
              <button
                onClick={() => setShowCoursesModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Courses scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    editingCourseId === c.id
                      ? 'bg-slate-100 dark:bg-slate-700/80 border-slate-900 dark:border-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {c.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                      {c.credits} cr
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEditCourse(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                      title="Edit course"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit course sub-form */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 space-y-2.5 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {editingCourseId ? 'Edit course details' : 'Add course'}
                </p>
                {editingCourseId && (
                  <button
                    type="button"
                    onClick={handleCancelEditCourse}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Course name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Credits"
                  value={newCourseCredits}
                  onChange={(e) => setNewCourseCredits(e.target.value)}
                  className="px-3 py-2 text-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCourse}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all"
              >
                {editingCourseId ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Course Changes
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add to semester
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowCoursesModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                About VGrade
              </h3>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>VGrade</strong> is an intelligent GPA, CGPA, What-If Projection, and Course
                Target Calculator specifically designed for VIT (Vellore Institute of Technology)
                students.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white">VIT 10-Point Scale:</p>
                <p>S = 10 · A = 9 · B = 8 · C = 7 · D = 6 · E = 5 · F = 0</p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  Version 2.0 (Complete Edition)
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-900 dark:text-white mb-1">Developer:</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Nithesh Kumar T</p>
                <a
                  href="https://www.linkedin.com/in/nithesh-kumar-t-b4028130a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold mt-1 hover:underline"
                >
                  LinkedIn Profile <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Made for VITians by a VITian. Calculate smarter. Plan better. Achieve higher.
              </p>
            </div>

            <button
              onClick={() => setShowAboutModal(false)}
              className="mt-6 w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DAILY REMINDERS MODAL */}
      {showRemindersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-800 dark:text-white" />
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Daily Reminders
                </h3>
              </div>
              <button
                onClick={() => setShowRemindersModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <RemindersView
              reminders={reminders}
              projections={projections}
              courses={courses}
              profile={profile}
              onUpdateReminders={onUpdateReminders}
            />
          </div>
        </div>
      )}

      {/* PWA INSTALLATION INSTRUCTION MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Install VGrade Web App
                </h3>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Install VGrade on your phone or computer for instant 1-tap launching and fast offline access.
            </p>

            <div className="space-y-3 mb-5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Android / Chrome:
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tap the <strong className="text-slate-900 dark:text-white">three dots (⋮)</strong> in the top-right corner of Chrome, then select <strong className="text-slate-900 dark:text-white">"Install app"</strong> or <strong className="text-slate-900 dark:text-white">"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  iPhone / Safari:
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tap the <strong className="text-slate-900 dark:text-white">Share icon (⎋)</strong> at the bottom of Safari, scroll down and tap <strong className="text-slate-900 dark:text-white">"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Desktop / PC:
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the <strong className="text-slate-900 dark:text-white">Install icon (⊞)</strong> on the right side of the address bar.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs shadow-sm active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* CLEAR ALL DATA CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
              Clear all data?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              This will reset your profile and marks for a new semester. Your default projection and
              preferences will be re-initialized cleanly. This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearAllData();
                }}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
              >
                Clear all data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
