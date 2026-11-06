import { useState, useRef } from 'react';
import { UserProfile, SemesterCourse, CourseType, GradingType } from '../types';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  Pencil,
  X,
  ShieldCheck,
  Smartphone,
  Download,
  Lightbulb,
  LightbulbOff,
} from 'lucide-react';

interface OnboardingSetupProps {
  onComplete: (profile: UserProfile, courses: SemesterCourse[]) => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

export function OnboardingSetup({
  onComplete,
  darkMode = false,
  onToggleTheme,
}: OnboardingSetupProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Profile fields: empty by default so user enters their own details
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [school, setSchool] = useState('');
  const [branch, setBranch] = useState('');
  const [currentCgpa, setCurrentCgpa] = useState('');
  const [earnedCredits, setEarnedCredits] = useState('');

  // Course fields
  const [courses, setCourses] = useState<SemesterCourse[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState('3');
  const [newCourseType, setNewCourseType] = useState<CourseType>('Theory');
  const [newCourseGrading, setNewCourseGrading] = useState<GradingType>('Relative');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const [errors, setErrors] = useState<string>('');
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  const handleInstallClick = async () => {
    const deferredPrompt = (window as unknown as {
      deferredPrompt?: {
        prompt: () => void;
        userChoice: Promise<{ outcome: string }>;
      };
    }).deferredPrompt;

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      (window as unknown as { deferredPrompt?: unknown }).deferredPrompt = null;
    } else {
      setShowInstallGuideModal(true);
    }
  };

  // Full deep scroll to the Academic Details page
  const handleScrollToForm = () => {
    if (detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNextToCourses = () => {
    if (!currentCgpa.trim()) {
      setErrors('Please enter your current CGPA.');
      handleScrollToForm();
      return;
    }
    const cgpaVal = parseFloat(currentCgpa);
    if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
      setErrors('Please enter a valid current CGPA (0.00 - 10.00).');
      handleScrollToForm();
      return;
    }
    if (!earnedCredits.trim()) {
      setErrors('Please enter your total earned credits.');
      handleScrollToForm();
      return;
    }
    const creditsVal = parseFloat(earnedCredits);
    if (isNaN(creditsVal) || creditsVal < 0) {
      setErrors('Please enter your total earned credits.');
      handleScrollToForm();
      return;
    }

    setErrors('');
    setStep(2);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToDetails = () => {
    setStep(1);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 60);
  };

  const handleStartEditCourse = (course: SemesterCourse) => {
    setEditingCourseId(course.id);
    setNewCourseName(course.name);
    setNewCourseCredits(String(course.credits));
    setNewCourseType(course.type);
    setNewCourseGrading(course.grading);
    setErrors('');
  };

  const handleCancelEditCourse = () => {
    setEditingCourseId(null);
    setNewCourseName('');
    setNewCourseCredits('3');
    setNewCourseType('Theory');
    setNewCourseGrading('Relative');
  };

  const handleSaveCourse = () => {
    if (!newCourseName.trim()) {
      setErrors('Please enter a course name.');
      return;
    }
    const cred = parseFloat(newCourseCredits);
    const parsedCred = isNaN(cred) ? 3 : cred;

    if (editingCourseId) {
      setCourses(
        courses.map((c) =>
          c.id === editingCourseId
            ? {
                ...c,
                name: newCourseName.trim(),
                credits: parsedCred,
                type: newCourseType,
                grading: newCourseGrading,
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
        type: newCourseType,
        grading: newCourseGrading,
        marks: { cat1: null, cat2: null, internals: null, fat: null },
        cutoffs: { S: null, A: null, B: null, C: null, D: null },
      };
      setCourses([...courses, newCourse]);
      setNewCourseName('');
      setNewCourseCredits('3');
    }
    setErrors('');
  };

  const handleDeleteCourse = (id: string) => {
    if (editingCourseId === id) {
      handleCancelEditCourse();
    }
    setCourses(courses.filter((c) => c.id !== id));
  };

  const handleFinish = () => {
    if (courses.length === 0) {
      setErrors('Please add at least one course for this semester.');
      return;
    }

    const profile: UserProfile = {
      name: name.trim() || 'Niku',
      regNo: regNo.trim().toUpperCase(),
      school: school.trim(),
      branch: branch.trim(),
      currentCgpa: parseFloat(currentCgpa) || 10.0,
      earnedCredits: parseFloat(earnedCredits) || 100,
    };

    onComplete(profile, courses);
  };

  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 overflow-y-auto scroll-smooth snap-y snap-mandatory transition-colors duration-300 ${
        darkMode ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* STEP 1: WELCOME SCREEN (PAGE 1) + FULL DEEP SCROLL TO ACADEMIC DETAILS (PAGE 2) */}
      {step === 1 && (
        <div className="w-full">
          {/* ================= PAGE 1: WELCOME HERO ================= */}
          <section className="min-h-[100dvh] w-full snap-start snap-always flex flex-col justify-between max-w-md mx-auto px-5 py-7">
            {/* Header / Brand & Theme Toggle */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:border dark:border-slate-700 flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  VGrade
                </span>
              </div>

              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:scale-105 active:scale-95 transition-all"
                  title="Toggle Dark / Light Theme"
                >
                  {darkMode ? <LightbulbOff className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Central Hero Body */}
            <div className="my-auto py-4 text-center space-y-6">
              <div className="w-20 h-20 rounded-[28px] bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 flex items-center justify-center shadow-xl border border-slate-800 dark:border-slate-700 mx-auto animate-fade-in">
                <GraduationCap className="w-10 h-10 stroke-[2.2]" />
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome to VGrade
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Calculate smarter · Plan better · Achieve higher
                </p>
              </div>

              {/* Install as Web App Card */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/80 p-4 shadow-sm flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/favicon.png"
                    alt="VGrade Logo"
                    className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-sm border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                      Install VGrade Web App
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {isInstalled
                        ? 'Installed · Ready for offline access'
                        : 'Add to Home Screen for fast offline access'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  {isInstalled ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                      Installed ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: Start Button & Deep Scroll Indicator */}
            <div className="space-y-3 pb-2 w-full text-center">
              <button
                type="button"
                onClick={handleScrollToForm}
                className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
              >
                <span>Start</span>
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </button>

              <div
                onClick={handleScrollToForm}
                className="cursor-pointer group flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors pt-1"
              >
                <span className="text-[11px] font-semibold tracking-wide">
                  Scroll down to enter CGPA & details
                </span>
                <ChevronDown className="w-4 h-4 animate-bounce group-hover:translate-y-0.5 transition-transform" />
              </div>
            </div>
          </section>

          {/* ================= PAGE 2: ACADEMIC DETAILS (FULL DEEP SCROLL TARGET) ================= */}
          <section
            ref={detailsRef}
            id="academic-details"
            className="min-h-[100dvh] w-full snap-start snap-always flex flex-col justify-between max-w-md mx-auto px-5 py-7"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Academic Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Step 1 of 2 · Enter your current standing from VTOP
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (containerRef.current) {
                      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <span>↑ Top</span>
                </button>
              </div>

              {errors && (
                <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-semibold">
                  {errors}
                </div>
              )}

              {/* Required CGPA & Credits */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current CGPA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 9.13"
                    value={currentCgpa}
                    onChange={(e) => setCurrentCgpa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-2xl font-black outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Credits <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 100"
                    value={earnedCredits}
                    onChange={(e) => setEarnedCredits(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-2xl font-black outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Optional Profile Details */}
              <div className="space-y-3 pt-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Profile Details (Optional)
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Niku"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty or enter Reg No"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-medium uppercase outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      School
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SCORE"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Eng."
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Local Storage Privacy Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3 mt-4">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    100% Private & Stored Locally
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    All data entered here is stored exclusively in your browser's local storage on this
                    device. None of your academic or personal details are transmitted to external servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Continue to Semester Courses */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={handleNextToCourses}
                className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <span>Continue to Semester Courses</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* STEP 2: COURSES SETUP SCREEN */}
      {step === 2 && (
        <div className="min-h-[100dvh] max-w-md w-full mx-auto px-5 py-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 flex items-center justify-center shadow-sm border border-slate-800 dark:border-slate-700">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">VGrade Setup</h1>
                <p className="text-xs text-slate-400">Step 2 of 2 · Semester Courses</p>
              </div>
            </div>

            {errors && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-semibold mb-3">
                {errors}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-bold">This Semester's Courses</p>
                <p className="text-xs text-slate-400">
                  {courses.length} courses · {totalCredits} credits
                </p>
              </div>
            </div>

            {/* Course items list */}
            {courses.length === 0 ? (
              <div className="p-6 my-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                No courses added yet. Use the form below to add your courses.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 my-3">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      editingCourseId === c.id
                        ? 'bg-slate-100 dark:bg-slate-700/80 border-slate-900 dark:border-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-bold truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.type} · {c.grading}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mr-1">
                        {c.credits} cr
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditCourse(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-600 transition-colors"
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
            )}

            {/* Add / Edit Course input card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
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
                  className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-slate-400"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Credits"
                  value={newCourseCredits}
                  onChange={(e) => setNewCourseCredits(e.target.value)}
                  className="px-3 py-2.5 text-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newCourseType}
                  onChange={(e) => setNewCourseType(e.target.value as CourseType)}
                  className="px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="Theory">Theory</option>
                  <option value="Lab">Lab</option>
                  <option value="Embedded">Embedded</option>
                  <option value="Project">Project</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={newCourseGrading}
                  onChange={(e) => setNewCourseGrading(e.target.value as GradingType)}
                  className="px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="Relative">Relative</option>
                  <option value="Absolute">Absolute</option>
                </select>
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
                    Add course
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Action buttons */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 active:scale-[0.98] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="col-span-2 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Launch VGrade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA INSTALLATION GUIDE MODAL (FOR SAFARI / CHROME / DESKTOP) */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-up text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base">Install VGrade Web App</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Install VGrade on your phone or computer for instant 1-tap launching and full offline
              access.
            </p>

            <div className="space-y-3 mb-5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold mb-1">Android / Chrome:</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tap the <strong>three dots (⋮)</strong> in Chrome, then tap{' '}
                  <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold mb-1">iPhone / Safari:</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tap the <strong>Share button (⎋)</strong> at the bottom of Safari, scroll down and
                  tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-bold mb-1">Desktop / PC:</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the <strong>Install icon (⊞)</strong> on the right side of the URL bar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuideModal(false)}
              className="w-full py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs shadow-sm active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
