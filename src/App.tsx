import { useState, useRef, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  BookOpen,
  RefreshCw,
  Download,
  ChevronDown,
  Info,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Target,
  Lightbulb,
  LightbulbOff,
  User as UserIcon,
  ArrowLeft,
  Sparkles,
  Home as HomeIcon,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  Tab,
  UserProfile,
  SemesterCourse,
  Projection,
  DailyReminder,
} from './types';
import {
  isUserConfigured,
  initNewUser,
  loadProfile,
  saveProfile,
  loadCourses,
  saveCourses,
  loadProjections,
  saveProjections,
  loadReminders,
  saveReminders,
  clearAllVGradeData,
  calculateSemesterCredits,
  calculateProjectionGpa,
} from './storage';
import { OnboardingSetup } from './components/OnboardingSetup';
import { ProjectionsView } from './components/ProjectionsView';
import { ProfileView } from './components/ProfileView';
import { QuickActionModal } from './components/QuickActionModal';
const GRADES = [
  { label: 'S', points: 10 },
  { label: 'A', points: 9 },
  { label: 'B', points: 8 },
  { label: 'C', points: 7 },
  { label: 'D', points: 6 },
  { label: 'E', points: 5 },
  { label: 'F', points: 0 },
];

interface CourseRow {
  id: number;
  credits: string;
  grade: string;
}

interface SnapshotCourse {
  id: number;
  name: string;
  credits: number;
  grade: string;
}

interface GpaSnapshot {
  courses: SnapshotCourse[];
  gpa: number;
  totalCredits: number;
}

function HowToUse({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/60 overflow-hidden mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-slate-500" />
          How to use
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-3.5 space-y-1.5 border-t border-slate-200/50 dark:border-slate-700/50 pt-2.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GPACalculator({
  onTryWhatIf,
  semesterCourses,
  projections,
}: {
  onTryWhatIf: (snapshot: GpaSnapshot) => void;
  semesterCourses?: SemesterCourse[];
  projections?: Projection[];
}) {
  const [courses, setCourses] = useState<CourseRow[]>([
    { id: 1, credits: '', grade: '' },
  ]);
  const [numCourses, setNumCourses] = useState('1');
  const [result, setResult] = useState<{ gpa: number; totalCredits: number } | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const handleLoadSemesterCourses = () => {
    if (!semesterCourses || semesterCourses.length === 0) return;
    const defaultProj = projections?.find((p) => p.isDefault) || projections?.[0];
    setCourses(
      semesterCourses.map((c, i) => ({
        id: Date.now() + i,
        credits: String(c.credits),
        grade: defaultProj?.grades[c.id] || 'S',
      }))
    );
    setNumCourses(String(semesterCourses.length));
    setResult(null);
    setError('');
  };

  const commitNumCourses = (value: string) => {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1) {
      setNumCourses('1');
      setCourses((prev) => prev.slice(0, 1));
      setResult(null);
      setError('');
      return;
    }
    setNumCourses(String(n));
    setCourses((prev) => {
      if (n > prev.length) {
        const additions = Array.from({ length: n - prev.length }, (_, i) => ({
          id: Date.now() + i,
          credits: '',
          grade: '',
        }));
        return [...prev, ...additions];
      }
      if (n < prev.length) {
        return prev.slice(0, n);
      }
      return prev;
    });
    setResult(null);
    setError('');
  };

  const addCourse = () => {
    setCourses([...courses, { id: Date.now(), credits: '', grade: '' }]);
    setNumCourses((n) => String((parseInt(n, 10) || 0) + 1));
    setResult(null);
  };

  const removeCourse = (id: number) => {
    if (courses.length <= 1) return;
    setCourses(courses.filter((c) => c.id !== id));
    setNumCourses((n) => String(Math.max(1, (parseInt(n, 10) || 1) - 1)));
    setResult(null);
  };

  const updateCourse = (id: number, field: 'credits' | 'grade', value: string) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    setResult(null);
    setError('');
  };

  const reset = () => {
    setCourses([
      { id: 1, credits: '', grade: '' },
    ]);
    setNumCourses('1');
    setResult(null);
    setError('');
  };

  const calculate = () => {
    const valid = courses.filter((c) => c.credits && c.grade);
    if (valid.length === 0) {
      setError('Please fill in at least one course with credits and grade.');
      return;
    }
    const incomplete = courses.some((c) => (c.credits && !c.grade) || (!c.credits && c.grade));
    if (incomplete) {
      setError('Some rows are partially filled. Please complete or remove them.');
      return;
    }
    setError('');
    const totalCredits = valid.reduce((sum, c) => sum + parseFloat(c.credits), 0);
    const totalPoints = valid.reduce((sum, c) => {
      const cr = parseFloat(c.credits);
      const gp = GRADES.find((g) => g.label === c.grade)!.points;
      return sum + cr * gp;
    }, 0);
    setResult({ gpa: totalPoints / totalCredits, totalCredits });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const downloadResult = () => {
    if (!result) return;
    const validCourses = courses.filter((c) => c.credits && c.grade);
    const lines = [
      'VGrade — Semester GPA Result',
      '='.repeat(35),
      '',
      `Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`,
      '',
      'Courses:',
      '-'.repeat(35),
      ...validCourses.map((c, i) => {
        const gp = GRADES.find((g) => g.label === c.grade)!.points;
        return `  ${i + 1}. Credits: ${c.credits}  Grade: ${c.grade} (${gp} pts)  → ${parseFloat(c.credits) * gp} pts`;
      }),
      '-'.repeat(35),
      `Total Credits : ${result.totalCredits}`,
      `Total Points  : ${(result.gpa * result.totalCredits).toFixed(2)}`,
      '',
      `Semester GPA  : ${result.gpa.toFixed(2)} / 10`,
      '',
      'Made for VITian — vgrade.app',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'semester-gpa.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTryWhatIf = () => {
    if (!result) return;
    const validCourses = courses.filter((c) => c.credits && c.grade);
    onTryWhatIf({
      courses: validCourses.map((c, i) => ({
        id: c.id,
        name: `Course ${i + 1}`,
        credits: parseFloat(c.credits),
        grade: c.grade,
      })),
      gpa: result.gpa,
      totalCredits: result.totalCredits,
    });
  };

  return (
    <div>
      <HowToUse
        steps={[
          'Enter credits and grade for each course',
          'Add more courses as needed using "Add Course"',
          'Click "Calculate GPA" to get your result',
          'Download your result for future reference',
        ]}
      />

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Number of Courses
          </label>
          {semesterCourses && semesterCourses.length > 0 && (
            <button
              type="button"
              onClick={handleLoadSemesterCourses}
              className="text-[11px] font-bold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-pink-500" />
              Load semester courses ({semesterCourses.length})
            </button>
          )}
        </div>
        <input
          type="number"
          min="1"
          placeholder="e.g., 5"
          value={numCourses}
          onChange={(e) => setNumCourses(e.target.value)}
          onBlur={(e) => commitNumCourses(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-semibold"
        />
      </div>

      <div className="space-y-3">
        {courses.map((course, index) => (
          <div
            key={course.id}
            className="grid grid-cols-[1fr_1.2fr_auto] gap-3 items-end"
          >
            <div>
              {index === 0 && (
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Credits
                </label>
              )}
              <input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 3"
                value={course.credits}
                onChange={(e) => updateCourse(course.id, 'credits', e.target.value)}
                className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-semibold"
              />
            </div>
            <div>
              {index === 0 && (
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Grade
                </label>
              )}
              <div className="relative">
                <select
                  value={course.grade}
                  onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-semibold cursor-pointer"
                >
                  <option value="">Select</option>
                  {GRADES.map((g) => (
                    <option key={g.label} value={g.label}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className={index === 0 ? 'pt-6' : ''}>
              <button
                onClick={() => removeCourse(course.id)}
                disabled={courses.length <= 1}
                className="w-10 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500 font-semibold">{error}</p>
      )}

      <button
        onClick={addCourse}
        className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:underline transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </div>
        Add Course
      </button>

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          onClick={calculate}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-extrabold text-white dark:text-black bg-black dark:bg-white shadow-md transition-all active:scale-[0.98]"
        >
          Calculate GPA
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {result && (
        <div ref={resultRef} className="mt-6 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 p-5 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Your Semester GPA
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {result.gpa.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 10</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">Total Credits</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{result.totalCredits}</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-black dark:bg-white transition-all duration-700"
              style={{ width: `${(result.gpa / 10) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-400 font-medium">0</span>
            <span className="text-xs text-slate-400 font-medium">10</span>
          </div>
          <button
            onClick={downloadResult}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all"
          >
            <Download className="w-4 h-4" />
            Download Result (.txt)
          </button>
        </div>
      )}

      {result && (
        <button
          onClick={handleTryWhatIf}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold text-white dark:text-black bg-black dark:bg-white transition-all active:scale-[0.98]"
        >
          <BarChart3 className="w-4 h-4" />
          Try What If?
        </button>
      )}
    </div>
  );
}

function CGPACalculator({
  profile,
  semesterCredits,
}: {
  profile?: UserProfile;
  semesterCredits?: number;
}) {
  const [prevCGPA, setPrevCGPA] = useState(profile ? String(profile.currentCgpa) : '');
  const [prevCredits, setPrevCredits] = useState(profile ? String(profile.earnedCredits) : '');
  const [currGPA, setCurrGPA] = useState('');
  const [currCredits, setCurrCredits] = useState(semesterCredits ? String(semesterCredits) : '');
  const [result, setResult] = useState<{ cgpa: number; totalCredits: number } | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setPrevCGPA('');
    setPrevCredits('');
    setCurrGPA('');
    setCurrCredits('');
    setResult(null);
    setError('');
  };

  const calculate = () => {
    const pCGPA = parseFloat(prevCGPA);
    const pCr = parseFloat(prevCredits);
    const cGPA = parseFloat(currGPA);
    const cCr = parseFloat(currCredits);

    if (isNaN(pCGPA) || isNaN(pCr) || isNaN(cGPA) || isNaN(cCr)) {
      setError('Please fill in all four fields to calculate CGPA.');
      return;
    }
    if (pCGPA < 0 || pCGPA > 10 || cGPA < 0 || cGPA > 10) {
      setError('GPA/CGPA values must be between 0 and 10.');
      return;
    }
    if (pCr <= 0 || cCr <= 0) {
      setError('Credits must be greater than zero.');
      return;
    }
    setError('');
    const totalCredits = pCr + cCr;
    const cgpa = (pCGPA * pCr + cGPA * cCr) / totalCredits;
    setResult({ cgpa, totalCredits });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const fields = [
    { label: 'Previous CGPA', placeholder: 'e.g., 8.5', value: prevCGPA, onChange: setPrevCGPA },
    { label: 'Total Credits Completed', placeholder: 'e.g., 60', value: prevCredits, onChange: setPrevCredits },
    { label: 'Current Semester GPA', placeholder: 'e.g., 9.0', value: currGPA, onChange: setCurrGPA },
    { label: 'Current Semester Credits', placeholder: 'e.g., 20', value: currCredits, onChange: setCurrCredits },
  ];

  return (
    <div>
      <HowToUse
        steps={[
          'Enter your previous CGPA',
          'Enter total credits completed so far',
          'Enter your current semester GPA',
          'Enter credits taken this semester',
          'Click "Calculate CGPA" to get your result',
        ]}
      />

      <div className="grid grid-cols-1 gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              {f.label} <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => { f.onChange(e.target.value); setResult(null); setError(''); }}
              className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-semibold"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500 font-semibold">{error}</p>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          onClick={calculate}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-extrabold text-white dark:text-black bg-black dark:bg-white shadow-md transition-all active:scale-[0.98]"
        >
          <TrendingUp className="w-4 h-4" />
          Calculate CGPA
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {result && (
        <div ref={resultRef} className="mt-6 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 p-5 border border-slate-200/80 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
            Your Updated CGPA
          </p>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {result.cgpa.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-400">/ 10</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">Total Credits</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{result.totalCredits}</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-black dark:bg-white transition-all duration-700"
              style={{ width: `${(result.cgpa / 10) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-400 font-medium">0</span>
            <span className="text-xs text-slate-400 font-medium">10</span>
          </div>
        </div>
      )}
    </div>
  );
}

function GradeImpactAnalysis({
  snapshot,
  courses,
  projections,
  profile,
  onBackToGPA,
}: {
  snapshot: GpaSnapshot | null;
  courses: SemesterCourse[];
  projections: Projection[];
  profile: UserProfile;
  onBackToGPA: () => void;
}) {
  const defaultProj = projections.find((p) => p.isDefault) || projections[0];

  const activeCourses = useMemo<SnapshotCourse[]>(() => {
    if (snapshot) return snapshot.courses;
    return courses.map((c, i) => ({
      id: i + 1,
      name: c.name,
      credits: c.credits,
      grade: defaultProj?.grades[c.id] || 'S',
    }));
  }, [snapshot, courses, defaultProj]);

  const activeTotalCredits = activeCourses.reduce((sum, c) => sum + c.credits, 0);
  const activeBaseTotalPoints = activeCourses.reduce((sum, c) => {
    const gp = GRADES.find((g) => g.label === c.grade)?.points ?? 10;
    return sum + c.credits * gp;
  }, 0);
  const activeBaseGpa =
    snapshot?.gpa ?? (activeTotalCredits > 0 ? activeBaseTotalPoints / activeTotalCredits : 10);

  const [grades, setGrades] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    activeCourses.forEach((c) => {
      initial[c.id] = c.grade;
    });
    return initial;
  });

  useEffect(() => {
    const initial: Record<number, string> = {};
    activeCourses.forEach((c) => {
      initial[c.id] = c.grade;
    });
    setGrades(initial);
  }, [activeCourses]);

  const resetChanges = () => {
    const initial: Record<number, string> = {};
    activeCourses.forEach((c) => {
      initial[c.id] = c.grade;
    });
    setGrades(initial);
  };

  const updatedTotalPoints = activeCourses.reduce((sum, c) => {
    const gradeLabel = grades[c.id] ?? c.grade;
    const gp = GRADES.find((g) => g.label === gradeLabel)?.points ?? 0;
    return sum + c.credits * gp;
  }, 0);

  const updatedGpa = activeTotalCredits > 0 ? updatedTotalPoints / activeTotalCredits : 0;
  const gpaDiff = updatedGpa - activeBaseGpa;

  const totalEarnedAfter = profile.earnedCredits + activeTotalCredits;
  const baseCgpa =
    totalEarnedAfter > 0
      ? (profile.currentCgpa * profile.earnedCredits + activeBaseGpa * activeTotalCredits) / totalEarnedAfter
      : profile.currentCgpa;
  const updatedCgpa =
    totalEarnedAfter > 0
      ? (profile.currentCgpa * profile.earnedCredits + updatedGpa * activeTotalCredits) / totalEarnedAfter
      : updatedGpa;
  const cgpaDiff = updatedCgpa - baseCgpa;

  const hasChanges = activeCourses.some((c) => (grades[c.id] ?? c.grade) !== c.grade);

  return (
    <div className="pb-8">
      {/* Summary Stat Cards */}
      <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-[28px] p-5 border border-slate-100 dark:border-slate-700/60 mb-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
              Semester GPA
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {updatedGpa.toFixed(2)}
              </span>
              <span
                className={`text-xs font-bold ${
                  gpaDiff > 0.001
                    ? 'text-emerald-500'
                    : gpaDiff < -0.001
                    ? 'text-rose-500'
                    : 'text-slate-400'
                }`}
              >
                {gpaDiff > 0.001
                  ? `+${gpaDiff.toFixed(2)}`
                  : gpaDiff < -0.001
                  ? gpaDiff.toFixed(2)
                  : '±0.00'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Base: {activeBaseGpa.toFixed(2)}
            </p>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">
              Projected CGPA
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {updatedCgpa.toFixed(2)}
              </span>
              <span
                className={`text-xs font-bold ${
                  cgpaDiff > 0.001
                    ? 'text-emerald-500'
                    : cgpaDiff < -0.001
                    ? 'text-rose-500'
                    : 'text-slate-400'
                }`}
              >
                {cgpaDiff > 0.001
                  ? `+${cgpaDiff.toFixed(2)}`
                  : cgpaDiff < -0.001
                  ? cgpaDiff.toFixed(2)
                  : '±0.00'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Base: {baseCgpa.toFixed(2)}
            </p>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {activeCourses.filter((c) => (grades[c.id] ?? c.grade) !== c.grade).length} course(s) modified
            </span>
            <button
              onClick={resetChanges}
              className="font-bold text-slate-900 dark:text-white underline hover:opacity-80"
            >
              Reset to Best Case
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-400 mb-3 px-1">
        Change course grades to test GPA and CGPA impacts. Higher credit courses have greater impact.
      </p>

      {/* Courses List */}
      <div className="space-y-2 mb-6">
        {activeCourses.map((c) => {
          const currentGrade = grades[c.id] ?? c.grade;
          const isChanged = currentGrade !== c.grade;
          return (
            <div
              key={c.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                isChanged
                  ? 'bg-slate-100 dark:bg-slate-700/80 border-slate-900 dark:border-white shadow-sm'
                  : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60'
              }`}
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {c.name}
                  </p>
                  {isChanged && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {c.credits} {c.credits === 1 ? 'credit' : 'credits'} · Base: <strong className="text-slate-700 dark:text-slate-300">{c.grade}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={currentGrade}
                  onChange={(e) =>
                    setGrades((g) => ({ ...g, [c.id]: e.target.value }))
                  }
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black outline-none transition-all cursor-pointer ${
                    isChanged
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  }`}
                >
                  {GRADES.map((g) => (
                    <option key={g.label} value={g.label}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <button
          onClick={resetChanges}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All Changes to Best Case
        </button>
      )}

      {snapshot && (
        <div className="mt-4 text-center">
          <button
            onClick={onBackToGPA}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white underline"
          >
            ← Back to GPA Calculator
          </button>
        </div>
      )}
    </div>
  );
}

function TargetCGPAPlanner({
  profile,
  semesterCredits,
}: {
  profile?: UserProfile;
  semesterCredits?: number;
}) {
  const [currCGPA, setCurrCGPA] = useState(profile ? String(profile.currentCgpa) : '');
  const [creditsCompleted, setCreditsCompleted] = useState(profile ? String(profile.earnedCredits) : '');
  const [creditsRegistered, setCreditsRegistered] = useState(semesterCredits ? String(semesterCredits) : '');
  const [targetCGPA, setTargetCGPA] = useState('');

  const fields = [
    {
      label: 'Current CGPA',
      placeholder: 'e.g., 8.93',
      value: currCGPA,
      onChange: setCurrCGPA,
    },
    {
      label: 'Credits Completed',
      placeholder: 'e.g., 67.5',
      value: creditsCompleted,
      onChange: setCreditsCompleted,
    },
    {
      label: 'Credits Registered This Semester',
      placeholder: 'e.g., 27.5',
      value: creditsRegistered,
      onChange: setCreditsRegistered,
    },
    {
      label: 'Target CGPA',
      placeholder: 'e.g., 9.00',
      value: targetCGPA,
      onChange: setTargetCGPA,
    },
  ];

  const clearAll = () => {
    setCurrCGPA('');
    setCreditsCompleted('');
    setCreditsRegistered('');
    setTargetCGPA('');
  };

  const cC = parseFloat(currCGPA);
  const crC = parseFloat(creditsCompleted);
  const crR = parseFloat(creditsRegistered);
  const tC = parseFloat(targetCGPA);

  const allFilled = !isNaN(cC) && !isNaN(crC) && !isNaN(crR) && !isNaN(tC);
  const validRange =
    allFilled && cC >= 0 && cC <= 10 && tC >= 0 && tC <= 10 && crC > 0 && crR > 0;

  const requiredGPA = validRange
    ? (tC * (crC + crR) - cC * crC) / crR
    : null;

  let statusColor = 'text-slate-700 dark:text-slate-200 dark:text-slate-300';
  let statusMsg = '';

  if (requiredGPA !== null) {
    if (requiredGPA > 10) {
      statusColor = 'text-rose-600';
      statusMsg = 'Target is not achievable this semester — required GPA exceeds 10.';
    } else if (requiredGPA < 0) {
      statusColor = 'text-slate-500 dark:text-slate-400';
      statusMsg = 'Your current CGPA already exceeds your target!';
    } else if (requiredGPA >= 9) {
      statusColor = 'text-amber-600';
      statusMsg = 'Achievable — but you\'ll need an excellent semester!';
    } else {
      statusMsg = 'Well within reach — you\'ve got this!';
    }
  }

  return (
    <div>
      <HowToUse
        steps={[
          'Enter your current CGPA and total credits completed',
          'Enter credits you are registered for this semester',
          'Enter your target CGPA',
          'Required GPA updates instantly as you type',
        ]}
      />

      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              {f.label} <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-semibold"
            />
          </div>
        ))}
      </div>

      {allFilled && !validRange && (
        <p className="mt-3 text-xs text-red-500 font-semibold">
          Please enter valid values — CGPA between 0–10 and credits greater than 0.
        </p>
      )}

      {requiredGPA !== null && (
        <div className="mt-6 rounded-[24px] bg-slate-50 dark:bg-slate-800/80 p-5 border border-slate-200/80 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
            Your Plan Summary
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-400 mb-0.5">Current CGPA</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{cC.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-400 mb-0.5">Target CGPA</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{tC.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-400 mb-0.5">Credits Done</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{crC}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-400 mb-0.5">Credits This Sem</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{crR}</p>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-black text-white dark:bg-white dark:text-black">
            <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
              Required GPA This Semester
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black tracking-tight">
                {requiredGPA > 10
                  ? '>10'
                  : requiredGPA < 0
                  ? 'N/A'
                  : requiredGPA.toFixed(2)}
              </span>
              {requiredGPA >= 0 && requiredGPA <= 10 && (
                <span className="text-base font-bold opacity-80">/ 10</span>
              )}
            </div>
          </div>

          {statusMsg && (
            <p className={`mt-3 text-xs font-bold ${statusColor}`}>{statusMsg}</p>
          )}
        </div>
      )}

      <button
        onClick={clearAll}
        disabled={!currCGPA && !creditsCompleted && !creditsRegistered && !targetCGPA}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Clear All
      </button>
    </div>
  );
}

function Home({
  onNavigate,
  profile,
  courses,
  projections,
  onInstall,
  isStandalone,
}: {
  onNavigate: (tab: Tab) => void;
  profile: UserProfile;
  courses: SemesterCourse[];
  projections: Projection[];
  onInstall?: () => void;
  isStandalone?: boolean;
}) {
  const [isInstallDismissed, setIsInstallDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('pwa-install-dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const defaultProj = projections.find((p) => p.isDefault) || projections[0];
  const defaultStats = defaultProj
    ? calculateProjectionGpa(defaultProj, courses, profile)
    : null;
  const semesterCr = calculateSemesterCredits(courses);

  return (
    <div className="pb-6 pt-1 text-slate-900 dark:text-slate-100">
      {/* Single Clean In-App PWA Install Banner */}
      {!isStandalone && !isInstallDismissed && onInstall && (
        <div className="mb-4 p-3.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/favicon.png"
              alt="VGrade Logo"
              className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm border border-slate-100 dark:border-slate-700"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                Install VGrade
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Add to Home Screen for fast, offline access.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('pwa-install-dismissed', 'true');
                } catch {
                  /* ignore */
                }
                setIsInstallDismissed(true);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 transition-colors"
            >
              Not now
            </button>
            <button
              onClick={onInstall}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black shadow-sm active:scale-95 transition-all"
            >
              Install
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700/80 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">VGrade</h1>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          Calculate smarter · Plan better
        </p>
      </div>

      {/* Profile quick stats summary */}
      <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-[28px] p-6 border border-slate-100 dark:border-slate-700/60 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{profile.name || 'Student'}</p>
            <p className="text-[11px] text-slate-400">
              {profile.regNo ? `${profile.regNo} · ` : ''}{profile.school || profile.branch || 'VTOP Academic'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs font-bold text-slate-900 dark:text-white underline"
          >
            Edit Profile
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
          <div>
            <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Current CGPA</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{profile.currentCgpa.toFixed(2)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Earned Cr</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{profile.earnedCredits}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-medium mb-0.5">Sem Cr</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{semesterCr}</span>
          </div>
        </div>
        {defaultProj && defaultStats && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-xs text-slate-400">
              Default: <strong className="text-slate-900 dark:text-white">{defaultProj.name}</strong>
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {defaultStats.sgpa.toFixed(2)} GPA → {defaultStats.cgpa.toFixed(2)} CGPA
            </span>
          </div>
        )}
      </div>

      {/* Featured Navigation to Projections & Grade Impact */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => onNavigate('projections')}
          className="p-5 rounded-[28px] bg-black text-white dark:bg-white dark:text-black text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <TrendingUp className="w-6 h-6 mb-3" />
          <div>
            <p className="text-sm font-black leading-tight">Projections</p>
            <p className="text-xs opacity-75 mt-0.5">{projections.length} grade scenario{projections.length > 1 ? 's' : ''}</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate('whatif')}
          className="p-5 rounded-[28px] bg-slate-50/90 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-left transition-all active:scale-[0.98] shadow-sm flex flex-col justify-between"
        >
          <BarChart3 className="w-6 h-6 text-slate-900 dark:text-white mb-3" />
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Grade Impact</p>
            <p className="text-xs text-slate-400 mt-0.5">Test grade changes</p>
          </div>
        </button>
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-left px-1">
        VGrade Calculators & Planners
      </p>

      {/* The 4 original tools with concise descriptions */}
      <div className="flex flex-col gap-3">
        {[
          { id: 'gpa' as Tab, label: 'GPA Calculator', icon: BookOpen, desc: 'Calculate semester GPA with credits and grades' },
          { id: 'cgpa' as Tab, label: 'CGPA Calculator', icon: TrendingUp, desc: 'Calculate cumulative GPA with previous semesters' },
          { id: 'whatif' as Tab, label: 'Grade Impact Analysis', icon: BarChart3, desc: 'See how grade changes affect your GPA' },
          { id: 'targetplanner' as Tab, label: 'Target CGPA Planner', icon: Target, desc: 'Find GPA needed this semester to reach target CGPA' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="w-full flex items-center gap-3.5 px-5 py-4 rounded-[24px] bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-700/50 border border-slate-100 dark:border-slate-700/60 text-left transition-all active:scale-[0.99] group shadow-sm"
          >
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm text-slate-800 dark:text-white">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{item.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90 shrink-0" />
          </button>
        ))}
      </div>

      {/* Privacy & Local Storage Disclaimer on Home */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center gap-2 text-center">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          100% Private · Stored in local browser storage on this device
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [isConfigured, setIsConfigured] = useState<boolean>(isUserConfigured);
  const [tab, setTab] = useState<Tab>('home');
  const [gpaSnapshot, setGpaSnapshot] = useState<GpaSnapshot | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  const handleTriggerInstall = async () => {
    const deferredPrompt = (window as unknown as { deferredPrompt?: { prompt: () => void; userChoice: Promise<{ outcome: string }> } }).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      (window as unknown as { deferredPrompt?: unknown }).deferredPrompt = null;
    } else {
      setShowInstallGuideModal(true);
    }
  };

  // Persistent shared state
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [courses, setCourses] = useState<SemesterCourse[]>(loadCourses);
  const [projections, setProjections] = useState<Projection[]>(loadProjections);
  const [reminders, setReminders] = useState<DailyReminder[]>(loadReminders);

  useEffect(() => {
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: 'home' }, '');
    }

    const onPopState = (e: PopStateEvent) => {
      if (e.state && e.state.page) {
        setTab(e.state.page);
      } else {
        setTab('home');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return;
    window.history.pushState({ page: newTab }, '');
    setTab(newTab);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const handleUpdateCourses = (newCourses: SemesterCourse[]) => {
    setCourses(newCourses);
    saveCourses(newCourses);
  };

  const handleUpdateProjections = (newProjections: Projection[]) => {
    setProjections(newProjections);
    saveProjections(newProjections);
  };

  const handleUpdateReminders = (newReminders: DailyReminder[]) => {
    setReminders(newReminders);
    saveReminders(newReminders);
  };

  const handleClearAllData = () => {
    clearAllVGradeData();
    setIsConfigured(false);
  };

  const handleOnboardingComplete = (newProfile: UserProfile, newCourses: SemesterCourse[]) => {
    const initData = initNewUser(newProfile, newCourses);
    setProfile(initData.profile);
    setCourses(initData.courses);
    setProjections(initData.projections);
    setReminders(initData.reminders);
    setIsConfigured(true);
    setTab('projections');
  };

  const handleCreateProjection = () => {
    const defaultGrades: Record<string, string> = {};
    courses.forEach((c) => {
      defaultGrades[c.id] = 'S';
    });
    const newProj: Projection = {
      id: `proj-${Date.now()}`,
      name: `Projection ${projections.length + 1}`,
      isDefault: projections.length === 0,
      grades: defaultGrades,
    };
    const updated = [...projections, newProj];
    setProjections(updated);
    saveProjections(updated);
    setTab('projections');
  };

  const toggleTheme = () => {
    if (isPulling) return;
    setIsPulling(true);
    setTimeout(() => {
      setIsPulling(false);
      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => { finished: Promise<void> };
      };
      if (!doc.startViewTransition) {
        setDarkMode((d) => !d);
      } else {
        document.documentElement.classList.add('transition-theme');
        const transition = doc.startViewTransition(() => {
          setDarkMode((d) => !d);
        });
        transition.finished.finally(() => {
          document.documentElement.classList.remove('transition-theme');
        });
      }
    }, 250);
  };

  const handleTryWhatIf = (snapshot: GpaSnapshot) => {
    setGpaSnapshot(snapshot);
    handleTabChange('whatif');
  };

  // If new user or fresh uninstall/clear data, show Onboarding Setup
  if (!isConfigured) {
    return <OnboardingSetup onComplete={handleOnboardingComplete} />;
  }

  const isCalculatorTab =
    tab === 'gpa' || tab === 'cgpa' || tab === 'whatif' || tab === 'targetplanner';

  const semesterCr = calculateSemesterCredits(courses);

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden flex flex-col transition-colors duration-300 ${
        darkMode ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'
      }`}
    >
      {/* Pull Bulb Toggle at Top Right matching Reference Picture */}
      <div
        className="absolute top-0 right-4 sm:right-8 flex flex-col items-center z-50 cursor-pointer"
        onClick={toggleTheme}
        title="Toggle dark/light mode"
      >
        <div
          className={`w-[2px] transition-all duration-200 ease-in-out ${
            darkMode ? 'bg-slate-600' : 'bg-slate-300'
          }`}
          style={{ height: isPulling ? '48px' : '18px' }}
        />
        <div
          className={`p-2.5 rounded-full transition-all duration-300 ${
            darkMode
              ? 'bg-slate-800 text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
              : 'bg-[#fef9c3] text-[#ca8a04] shadow-[0_0_20px_rgba(250,204,21,0.6)]'
          }`}
        >
          {darkMode ? <LightbulbOff className="w-5 h-5" /> : <Lightbulb className="w-5 h-5 stroke-[2.2]" />}
        </div>
      </div>

      {/* Top Header / App Bar */}
      <header className="w-full max-w-md mx-auto pt-3 px-4 flex items-center justify-between shrink-0">
        {tab === 'home' ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700/80 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">VGrade</span>
          </div>
        ) : (
          <button
            onClick={() => handleTabChange('home')}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        )}
        <div className="w-12 h-8" />
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full max-w-md mx-auto flex flex-col overflow-y-auto px-4 pb-6 ${
          tab === 'home' ? 'pt-4' : 'pt-2'
        }`}
      >
        {/* Home Dashboard (Landing Page) */}
        {tab === 'home' && (
          <Home
            onNavigate={handleTabChange}
            profile={profile}
            courses={courses}
            projections={projections}
            onInstall={handleTriggerInstall}
            isStandalone={isStandalone}
          />
        )}

        {/* Projections View */}
        {tab === 'projections' && (
          <ProjectionsView
            projections={projections}
            courses={courses}
            profile={profile}
            onUpdateProjections={handleUpdateProjections}
          />
        )}

        {/* Profile View (with integrated Reminders) */}
        {tab === 'profile' && (
          <ProfileView
            profile={profile}
            courses={courses}
            projections={projections}
            reminders={reminders}
            onUpdateProfile={handleUpdateProfile}
            onUpdateCourses={handleUpdateCourses}
            onUpdateReminders={handleUpdateReminders}
            onClearAllData={handleClearAllData}
          />
        )}

        {/* Classic Calculators & Tools */}
        {isCalculatorTab && (
          <div
            className={`rounded-[28px] shadow-sm border p-6 transition-colors duration-300 ${
              darkMode
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200/80 shadow-slate-100'
            }`}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
                {tab === 'gpa' && <BookOpen className="w-5 h-5" />}
                {tab === 'cgpa' && <TrendingUp className="w-5 h-5" />}
                {tab === 'whatif' && <BarChart3 className="w-5 h-5" />}
                {tab === 'targetplanner' && <Target className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {tab === 'gpa'
                    ? 'GPA Calculator'
                    : tab === 'cgpa'
                    ? 'CGPA Calculator'
                    : tab === 'whatif'
                    ? 'Grade Impact Analysis'
                    : 'Target CGPA Planner'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {tab === 'gpa' && 'Calculate GPA with course credits and grades'}
                  {tab === 'cgpa' && 'Calculate cumulative GPA with previous and new semester'}
                  {tab === 'whatif' && 'See how grade changes affect your GPA'}
                  {tab === 'targetplanner' && 'Calculate required GPA to hit target CGPA'}
                </p>
              </div>
            </div>

            {tab === 'gpa' && (
              <GPACalculator
                onTryWhatIf={handleTryWhatIf}
                semesterCourses={courses}
                projections={projections}
              />
            )}
            {tab === 'cgpa' && (
              <CGPACalculator profile={profile} semesterCredits={semesterCr} />
            )}
            {tab === 'whatif' && (
              <GradeImpactAnalysis
                snapshot={gpaSnapshot}
                courses={courses}
                projections={projections}
                profile={profile}
                onBackToGPA={() => handleTabChange('gpa')}
              />
            )}
            {tab === 'targetplanner' && (
              <TargetCGPAPlanner profile={profile} semesterCredits={semesterCr} />
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation matching user instructions */}
      <div className="mt-auto z-20 w-full bg-white/98 dark:bg-slate-900/98 border-t border-slate-100 dark:border-slate-800 backdrop-blur-md">
        <nav className="max-w-md mx-auto pb-3 pt-2 px-3 flex justify-between items-center relative">
          {/* Home Tab (Landing Page) */}
          <button
            onClick={() => handleTabChange('home')}
            className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all ${
              tab === 'home'
                ? 'text-black dark:text-white font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <HomeIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Home</span>
          </button>

          {/* Grade Impact Tab (replaced Target) */}
          <button
            onClick={() => handleTabChange('whatif')}
            className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all ${
              tab === 'whatif'
                ? 'text-black dark:text-white font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Grade Impact</span>
          </button>

          {/* Center Floating Plus (+) Button */}
          <div className="relative -top-4 mx-1">
            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-black dark:bg-white text-white dark:text-black transition-transform active:scale-90 hover:scale-105"
              aria-label="Quick Actions"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Target CGPA Tab (replaced Reminders) */}
          <button
            onClick={() => handleTabChange('targetplanner')}
            className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all ${
              tab === 'targetplanner'
                ? 'text-black dark:text-white font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <Target className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Target CGPA</span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex-1 flex flex-col items-center py-1 rounded-xl transition-all ${
              tab === 'profile'
                ? 'text-black dark:text-white font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <UserIcon className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">Profile</span>
          </button>
        </nav>
      </div>

      {/* Quick Action Bottom Sheet Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onNavigate={handleTabChange}
        onCreateProjection={handleCreateProjection}
      />

      {/* PWA INSTALLATION INSTRUCTION MODAL */}
      {showInstallGuideModal && (
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
                onClick={() => setShowInstallGuideModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Install VGrade on your phone or computer for instant 1-tap launching and full offline access.
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
