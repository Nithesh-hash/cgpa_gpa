import { useState, useRef, useEffect } from 'react';
import { UserProfile, SemesterCourse } from '../types';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
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

/**
 * Interactive Swipe Right Slider Component
 */
function SwipeRightSlider({ onComplete }: { onComplete: () => void }) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX;
    const relativeX = touchX - rect.left - 24;
    const max = rect.width - 52;
    const clampedX = Math.max(0, Math.min(relativeX, max));
    setDragX(clampedX);

    if (clampedX >= max * 0.75) {
      setIsDragging(false);
      setDragX(max);
      onComplete();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging || !trackRef.current) return;
    setIsDragging(false);
    const rect = trackRef.current.getBoundingClientRect();
    const max = rect.width - 52;
    if (dragX >= max * 0.65) {
      setDragX(max);
      onComplete();
    } else {
      setDragX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left - 24;
      const max = rect.width - 52;
      const clampedX = Math.max(0, Math.min(relativeX, max));
      setDragX(clampedX);

      if (clampedX >= max * 0.75) {
        setIsDragging(false);
        setDragX(max);
        onComplete();
      }
    };

    const onMouseUp = () => {
      if (!isDragging || !trackRef.current) return;
      setIsDragging(false);
      const rect = trackRef.current.getBoundingClientRect();
      const max = rect.width - 52;
      if (dragX >= max * 0.65) {
        setDragX(max);
        onComplete();
      } else {
        setDragX(0);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, dragX, onComplete]);

  // Click on track auto-slides
  const handleClickTrack = () => {
    if (trackRef.current) {
      const max = trackRef.current.getBoundingClientRect().width - 52;
      setDragX(max);
      setTimeout(onComplete, 200);
    } else {
      onComplete();
    }
  };

  return (
    <div
      ref={trackRef}
      onClick={handleClickTrack}
      className="relative w-full h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 p-1.5 flex items-center justify-center overflow-hidden cursor-pointer select-none shadow-sm touch-none"
    >
      {/* Progress Track Highlight */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-slate-900/10 dark:bg-white/10 rounded-full transition-all"
        style={{ width: `${dragX + 48}px` }}
      />

      {/* Shimmering Text Label */}
      <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 pointer-events-none flex items-center gap-1 animate-pulse pl-7">
        <span>Swipe right to start</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <ChevronRight className="w-3.5 h-3.5 -ml-2" />
      </span>

      {/* Draggable Knob */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{ transform: `translateX(${dragX}px)` }}
        className={`absolute left-1.5 w-11 h-11 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing ${
          !isDragging ? 'transition-transform duration-200 ease-out' : ''
        }`}
      >
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </div>
    </div>
  );
}

export function OnboardingSetup({
  onComplete,
  darkMode = false,
  onToggleTheme,
}: OnboardingSetupProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [landingSubPage, setLandingSubPage] = useState<'welcome' | 'details'>('welcome');

  // Touch swipe detection for whole screen
  const touchStartXRef = useRef<number | null>(null);

  // Profile fields
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

  const handleGoToDetails = () => {
    setLandingSubPage('details');
  };

  const handleBackToWelcome = () => {
    setLandingSubPage('welcome');
  };

  // Screen-level touch swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    // On welcome page: either swipe right (diff > 50) or swipe left (diff < -50) proceeds to details
    if (landingSubPage === 'welcome' && (diff > 50 || diff < -50)) {
      handleGoToDetails();
    } else if (landingSubPage === 'details' && diff > 50) {
      // Swiping right from left edge on details page goes back to welcome
      handleBackToWelcome();
    }
    touchStartXRef.current = null;
  };

  const handleNextToCourses = () => {
    if (!currentCgpa.trim()) {
      setErrors('Please enter your current CGPA.');
      return;
    }
    const cgpaVal = parseFloat(currentCgpa);
    if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
      setErrors('Please enter a valid current CGPA (0.00 - 10.00).');
      return;
    }
    if (!earnedCredits.trim()) {
      setErrors('Please enter your total earned credits.');
      return;
    }
    const creditsVal = parseFloat(earnedCredits);
    if (isNaN(creditsVal) || creditsVal < 0) {
      setErrors('Please enter your total earned credits.');
      return;
    }

    setErrors('');
    setStep(2);
  };

  const handleBackToDetails = () => {
    setStep(1);
    setLandingSubPage('details');
  };

  const handleStartEditCourse = (course: SemesterCourse) => {
    setEditingCourseId(course.id);
    setNewCourseName(course.name);
    setNewCourseCredits(String(course.credits));
    setErrors('');
  };

  const handleCancelEditCourse = () => {
    setEditingCourseId(null);
    setNewCourseName('');
    setNewCourseCredits('3');
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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed inset-0 z-50 overflow-y-auto overflow-x-hidden transition-colors duration-300 ${
        darkMode ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* STEP 1: WELCOME SCREEN (WITH MARQUEE RIBBON & SWIPE RIGHT SLIDER) & ACADEMIC DETAILS */}
      {step === 1 && (
        <div className="w-full">
          {landingSubPage === 'welcome' ? (
            /* ================= PAGE 1: WELCOME HERO (WITH MARQUEE & SWIPE RIGHT) ================= */
            <div className="min-h-[100dvh] w-full flex flex-col justify-between max-w-md mx-auto px-5 py-7 animate-fade-in overflow-x-hidden">
              {/* Header / Brand & Theme Toggle */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:border dark:border-slate-700 flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="font-logo text-2xl tracking-normal text-slate-900 dark:text-white select-none leading-none pt-0.5">
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
              <div className="my-auto py-3 text-center space-y-4">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-[28px] bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 flex items-center justify-center shadow-xl border border-slate-800 dark:border-slate-700 mx-auto animate-fade-in">
                  <GraduationCap className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
                    Welcome to VGrade
                  </h1>
                  <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Calculate smarter · Plan better · Achieve higher
                  </p>
                </div>

                {/* Install as Web App Card */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/80 p-3.5 shadow-sm flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src="/favicon.png"
                      alt="VGrade Logo"
                      className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate">
                        Install VGrade Web App
                      </p>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {isInstalled
                          ? 'Installed · Ready for offline access'
                          : 'Add to Home Screen for fast offline access'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isInstalled ? (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                        Installed ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleInstallClick}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* STRAIGHT HORIZONTAL MARQUEE (Right to Left) */}
                <div className="w-full overflow-hidden my-3 -mx-5 px-0">
                  <div className="w-[110%] -ml-[5%] py-2.5 bg-black text-white dark:bg-white dark:text-black shadow-sm overflow-hidden select-none">
                    <div className="animate-marquee-rtl flex items-center whitespace-nowrap text-[11px] sm:text-xs font-semibold tracking-wide">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <span key={idx} className="inline-block px-4">
                          The first rule of VGrade: You do not talk about your grades. • The second rule of VGrade: Remember the first rule •
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: SWIPE RIGHT SLIDER (Replaces vertical scroll down) */}
              <div className="space-y-2 pb-2 w-full">
                <SwipeRightSlider onComplete={handleGoToDetails} />
              </div>
            </div>
          ) : (
            /* ================= PAGE 2: ACADEMIC DETAILS FORM ================= */
            <div className="min-h-[100dvh] w-full flex flex-col justify-between max-w-md mx-auto px-5 py-7 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Academic Details
                    </h2>
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      Step 1 of 2 · Enter your current standing from VTOP
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToWelcome}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Welcome</span>
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
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Current CGPA <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 9.13"
                      value={currentCgpa}
                      onChange={(e) => setCurrentCgpa(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-3xl font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Total Credits <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 100"
                      value={earnedCredits}
                      onChange={(e) => setEarnedCredits(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-3xl font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {/* Optional Profile Details */}
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-normal outline-none focus:ring-2 focus:ring-slate-400"
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
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-normal uppercase outline-none focus:ring-2 focus:ring-slate-400"
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
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-normal outline-none focus:ring-2 focus:ring-slate-400"
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
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm font-normal outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Local Storage Privacy Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3 mt-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      100% Private & Stored Locally
                    </p>
                    <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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
                  className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                  <span>Continue to Semester Courses</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: COURSES SETUP SCREEN */}
      {step === 2 && (
        <div className="min-h-[100dvh] max-w-md w-full mx-auto px-5 py-7 flex flex-col justify-between animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 flex items-center justify-center shadow-sm border border-slate-800 dark:border-slate-700">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">VGrade Setup</h1>
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Step 2 of 2 · Semester Courses</p>
              </div>
            </div>

            {errors && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-semibold mb-3">
                {errors}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-semibold">This Semester's Courses</p>
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
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
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold tabular-nums px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mr-1">
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
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
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
                  className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-normal outline-none focus:ring-2 focus:ring-slate-400"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Credits"
                  value={newCourseCredits}
                  onChange={(e) => setNewCourseCredits(e.target.value)}
                  className="px-3 py-2.5 text-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold tabular-nums outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveCourse}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all"
              >
                {editingCourseId ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Course Changes</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add course</span>
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
                className="py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 active:scale-[0.98] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="col-span-2 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
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
                <h3 className="font-semibold text-base">Install VGrade Web App</h3>
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
                <p className="text-xs font-semibold mb-1">Android / Chrome:</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tap the <strong>three dots (⋮)</strong> in Chrome, then tap{' '}
                  <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-semibold mb-1">iPhone / Safari:</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tap the <strong>Share button (⎋)</strong> at the bottom of Safari, scroll down and
                  tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-xs font-semibold mb-1">Desktop / PC:</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the <strong>Install icon (⊞)</strong> on the right side of the URL bar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuideModal(false)}
              className="w-full py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-sm active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
