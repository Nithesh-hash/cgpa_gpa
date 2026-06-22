import { useState, useRef, useEffect } from 'react';
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
  Menu,
  X,
  Home as HomeIcon,
  BarChart3,
  Target,
} from 'lucide-react';

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
    <div className="rounded-2xl border border-teal-100 bg-teal-50/60 overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-teal-700">
          <Info className="w-4 h-4" />
          How to use
        </span>
        <ChevronDown
          className={`w-4 h-4 text-teal-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
              <p className="text-sm text-teal-800">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GPACalculator({ onTryWhatIf }: { onTryWhatIf: (snapshot: GpaSnapshot) => void }) {
  const [courses, setCourses] = useState<CourseRow[]>([
    { id: 1, credits: '', grade: '' },
  ]);
  const [numCourses, setNumCourses] = useState('1');
  const [result, setResult] = useState<{ gpa: number; totalCredits: number } | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

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
        <label className="block text-xs font-semibold text-pink-400 mb-1.5 uppercase tracking-wide">
          Number of Courses
        </label>
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
          className="w-full bg-white border border-pink-200 rounded-xl px-4 py-3 text-pink-900 placeholder-pink-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all text-sm font-medium"
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
                <label className="block text-xs font-semibold text-pink-400 mb-1.5 uppercase tracking-wide">
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
                className="w-full bg-white border border-pink-200 rounded-xl px-4 py-3 text-pink-900 placeholder-pink-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all text-sm font-medium"
              />
            </div>
            <div>
              {index === 0 && (
                <label className="block text-xs font-semibold text-pink-400 mb-1.5 uppercase tracking-wide">
                  Grade
                </label>
              )}
              <div className="relative">
                <select
                  value={course.grade}
                  onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                  className="w-full appearance-none bg-white border border-pink-200 rounded-xl px-4 py-3 text-pink-900 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all text-sm font-medium cursor-pointer"
                >
                  <option value="">Select</option>
                  {GRADES.map((g) => (
                    <option key={g.label} value={g.label}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300 pointer-events-none" />
              </div>
            </div>
            <div className={index === 0 ? 'pt-6' : ''}>
              <button
                onClick={() => removeCourse(course.id)}
                disabled={courses.length <= 1}
                className="w-10 h-11 rounded-xl flex items-center justify-center text-pink-200 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-rose-500 font-medium">{error}</p>
      )}

      <button
        onClick={addCourse}
        className="mt-4 flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
          <Plus className="w-4 h-4" />
        </div>
        Add Course
      </button>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={calculate}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
        >
          Calculate GPA
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {result && (
        <div ref={resultRef} className="mt-6 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 p-px">
          <div className="rounded-[15px] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-pink-400 uppercase tracking-wide mb-1">
                  Your Semester GPA
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold text-pink-600 tracking-tight">
                    {result.gpa.toFixed(2)}
                  </span>
                  <span className="text-lg font-medium text-pink-300">/ 10</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-pink-400 mb-0.5">Total Credits</p>
                <p className="text-xl font-bold text-pink-700">{result.totalCredits}</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-pink-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-700"
                style={{ width: `${(result.gpa / 10) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-pink-300">0</span>
              <span className="text-xs text-pink-300">10</span>
            </div>
            <button
              onClick={downloadResult}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-pink-600 border border-pink-200 hover:bg-pink-50 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Result
            </button>
          </div>
        </div>
      )}

      {result && (
        <button
          onClick={handleTryWhatIf}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-all active:scale-[0.98]"
        >
          <BarChart3 className="w-4 h-4" />
          Try What If?
        </button>
      )}
    </div>
  );
}

function CGPACalculator() {
  const [prevCGPA, setPrevCGPA] = useState('');
  const [prevCredits, setPrevCredits] = useState('');
  const [currGPA, setCurrGPA] = useState('');
  const [currCredits, setCurrCredits] = useState('');
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              {f.label} <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => { f.onChange(e.target.value); setResult(null); setError(''); }}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-sm font-medium"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-rose-500 font-medium">{error}</p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={calculate}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
        >
          <TrendingUp className="w-4 h-4" />
          Calculate CGPA
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {result && (
        <div ref={resultRef} className="mt-6 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 p-px">
          <div className="rounded-[15px] bg-white p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Your Updated CGPA
            </p>
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold text-orange-500 tracking-tight">
                  {result.cgpa.toFixed(2)}
                </span>
                <span className="text-lg font-medium text-slate-400">/ 10</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Credits</p>
                <p className="text-2xl font-bold text-slate-700">{result.totalCredits}</p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-700"
                style={{ width: `${(result.cgpa / 10) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">0</span>
              <span className="text-xs text-slate-400">10</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GradeImpactAnalysis({
  snapshot,
  onBackToGPA,
}: {
  snapshot: GpaSnapshot | null;
  onBackToGPA: () => void;
}) {
  const [grades, setGrades] = useState<Record<number, string>>({});

  useEffect(() => {
    if (snapshot) {
      const initial: Record<number, string> = {};
      snapshot.courses.forEach((c) => {
        initial[c.id] = c.grade;
      });
      setGrades(initial);
    }
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
          <BarChart3 className="w-7 h-7 text-violet-400" />
        </div>
        <p className="text-sm text-slate-500 font-medium mb-6">
          No GPA data available. Please calculate GPA first.
        </p>
        <button
          onClick={onBackToGPA}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
        >
          <BookOpen className="w-4 h-4" />
          Go to GPA Calculator
        </button>
      </div>
    );
  }

  const resetChanges = () => {
    const initial: Record<number, string> = {};
    snapshot.courses.forEach((c) => {
      initial[c.id] = c.grade;
    });
    setGrades(initial);
  };

  const updatedTotalPoints = snapshot.courses.reduce((sum, c) => {
    const gp = GRADES.find((g) => g.label === (grades[c.id] ?? c.grade))!.points;
    return sum + c.credits * gp;
  }, 0);
  const updatedGpa = updatedTotalPoints / snapshot.totalCredits;
  const diff = updatedGpa - snapshot.gpa;
  const hasChanges = snapshot.courses.some((c) => (grades[c.id] ?? c.grade) !== c.grade);

  return (
    <div>
      <HowToUse
        steps={[
          'Calculate your GPA first in the GPA Calculator',
          'Click "Try What If?" below your GPA result to load your courses here',
          'Change any grade using the dropdown — GPA updates instantly',
          'Highlighted rows show courses whose grade you have changed',
          'Click "Reset Changes" to restore all grades to the original values',
        ]}
      />
      <p className="text-sm text-slate-500 mb-5">
        Change a grade below to instantly preview its effect on your GPA — your saved result stays untouched.
      </p>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm border-separate border-spacing-y-2 min-w-[420px]">
          <thead>
            <tr className="text-left text-xs font-semibold text-violet-400 uppercase tracking-wide">
              <th className="px-3 py-1">Course</th>
              <th className="px-3 py-1">Credits</th>
              <th className="px-3 py-1">Current</th>
              <th className="px-3 py-1">New Grade</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.courses.map((c) => {
              const changed = (grades[c.id] ?? c.grade) !== c.grade;
              return (
                <tr key={c.id} className={changed ? 'bg-violet-50' : 'bg-slate-50'}>
                  <td className="px-3 py-3 rounded-l-xl font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1.5">
                      {c.name}
                      {changed && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{c.credits}</td>
                  <td className="px-3 py-3 text-slate-500">{c.grade}</td>
                  <td className="px-3 py-3 rounded-r-xl">
                    <div className="relative inline-block">
                      <select
                        value={grades[c.id] ?? c.grade}
                        onChange={(e) =>
                          setGrades((g) => ({ ...g, [c.id]: e.target.value }))
                        }
                        className={`appearance-none bg-white border rounded-lg pl-3 pr-7 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                          changed
                            ? 'border-violet-300 text-violet-600 focus:border-violet-400 focus:ring-violet-100'
                            : 'border-slate-200 text-slate-700 focus:border-pink-400 focus:ring-pink-100'
                        }`}
                      >
                        {GRADES.map((g) => (
                          <option key={g.label} value={g.label}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-400 p-px">
        <div className="rounded-[15px] bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Current GPA
              </p>
              <p className="text-2xl font-extrabold text-slate-700">{snapshot.gpa.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-1">
                Updated GPA
              </p>
              <p className="text-2xl font-extrabold text-violet-600">{updatedGpa.toFixed(2)}</p>
            </div>
          </div>
          <div
            className={`mt-4 flex items-center gap-1.5 text-sm font-bold ${
              diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-500' : 'text-slate-400'
            }`}
          >
            {diff > 0 && (
              <>
                <span>📈</span>
                <span>Increase: +{diff.toFixed(2)}</span>
              </>
            )}
            {diff < 0 && (
              <>
                <span>📉</span>
                <span>Decrease: {diff.toFixed(2)}</span>
              </>
            )}
            {diff === 0 && <span>No change yet — try a different grade above</span>}
          </div>
        </div>
      </div>

      <button
        onClick={resetChanges}
        disabled={!hasChanges}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-violet-500 border border-violet-200 hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Reset Changes
      </button>
    </div>
  );
}

function TargetCGPAPlanner() {
  const [currCGPA, setCurrCGPA] = useState('');
  const [creditsCompleted, setCreditsCompleted] = useState('');
  const [creditsRegistered, setCreditsRegistered] = useState('');
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

  let statusColor = 'text-slate-700';
  let statusBg = 'from-slate-700 to-slate-900';
  let statusMsg = '';

  if (requiredGPA !== null) {
    if (requiredGPA > 10) {
      statusColor = 'text-rose-600';
      statusBg = 'from-rose-400 to-pink-500';
      statusMsg = 'Target is not achievable this semester — required GPA exceeds 10.';
    } else if (requiredGPA < 0) {
      statusColor = 'text-slate-500';
      statusBg = 'from-slate-600 to-slate-800';
      statusMsg = 'Your current CGPA already exceeds your target!';
    } else if (requiredGPA >= 9) {
      statusColor = 'text-amber-600';
      statusBg = 'from-amber-400 to-orange-400';
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              {f.label} <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm font-medium"
            />
          </div>
        ))}
      </div>

      {allFilled && !validRange && (
        <p className="mt-3 text-xs text-rose-500 font-medium">
          Please enter valid values — CGPA between 0–10 and credits greater than 0.
        </p>
      )}

      {requiredGPA !== null && (
        <div className={`mt-6 rounded-2xl bg-gradient-to-br ${statusBg} p-px`}>
          <div className="rounded-[15px] bg-white p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Your Plan Summary
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Current CGPA</p>
                <p className="text-lg font-extrabold text-slate-700">{cC.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Target CGPA</p>
                <p className="text-lg font-extrabold text-slate-700">{tC.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Credits Done</p>
                <p className="text-lg font-extrabold text-slate-700">{crC}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-0.5">Credits This Sem</p>
                <p className="text-lg font-extrabold text-slate-700">{crR}</p>
              </div>
            </div>

            <div className={`rounded-xl p-4 bg-gradient-to-br ${statusBg} bg-opacity-10`}>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">
                Required GPA This Semester
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold text-white tracking-tight">
                  {requiredGPA > 10
                    ? '>10'
                    : requiredGPA < 0
                    ? 'N/A'
                    : requiredGPA.toFixed(2)}
                </span>
                {requiredGPA >= 0 && requiredGPA <= 10 && (
                  <span className="text-lg font-medium text-white/70">/ 10</span>
                )}
              </div>
            </div>

            {statusMsg && (
              <p className={`mt-3 text-xs font-semibold ${statusColor}`}>{statusMsg}</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={clearAll}
        disabled={!currCGPA && !creditsCompleted && !creditsRegistered && !targetCGPA}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Clear All
      </button>
    </div>
  );
}

function Home({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200 mb-5">
        <GraduationCap className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-extrabold text-pink-700 mb-2">Welcome to VGrade</h2>
      <p className="text-sm text-pink-400 font-medium mb-8">
        Calculate smarter. Plan better. Achieve higher.
      </p>
      <div className="flex flex-col gap-3">
        {[
          { id: 'gpa' as Tab, label: 'GPA Calculator', icon: BookOpen, desc: 'Calculate your semester GPA', tagline: undefined },
          { id: 'cgpa' as Tab, label: 'CGPA Calculator', icon: TrendingUp, desc: 'Update your cumulative GPA', tagline: undefined },
          { id: 'whatif' as Tab, label: 'Grade Impact Analysis', icon: BarChart3, desc: 'See how grade changes affect your GPA', tagline: undefined },
          { id: 'targetplanner' as Tab, label: 'Target CGPA Planner', icon: Target, desc: 'Find the GPA you need this semester to achieve the targeted CGPA', tagline: 'Will I get 9 CGPA this semester?' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-pink-50 hover:bg-pink-100 border border-pink-100 hover:border-pink-200 text-left transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shadow-pink-100 shrink-0 group-hover:shadow-pink-200 transition-all">
              <item.icon className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-pink-700">{item.label}</p>
              <p className="text-xs text-pink-400 mt-0.5">{item.desc}</p>
              {item.tagline && (
                <p className="text-xs font-semibold text-pink-500 mt-1 italic">"{item.tagline}"</p>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-pink-300 -rotate-90 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

type Tab = 'home' | 'gpa' | 'cgpa' | 'whatif' | 'targetplanner';

const NAV_ITEMS: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'gpa', label: 'GPA Calculator', icon: BookOpen },
  { id: 'cgpa', label: 'CGPA Calculator', icon: TrendingUp },
  { id: 'whatif', label: 'Grade Impact Analysis', icon: BarChart3 },
  { id: 'targetplanner', label: 'Target CGPA Planner', icon: Target },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [gpaSnapshot, setGpaSnapshot] = useState<GpaSnapshot | null>(null);

  const handleTryWhatIf = (snapshot: GpaSnapshot) => {
    setGpaSnapshot(snapshot);
    setTab('whatif');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/40 via-white to-orange-50/20 flex flex-col">
      {/* Header */}
      <header className="relative pt-10 pb-6 px-4 text-center">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="absolute top-6 right-5 sm:right-8 w-10 h-10 rounded-xl bg-white border border-pink-100 shadow-sm shadow-pink-100 flex items-center justify-center text-pink-500 hover:bg-pink-50 transition-all"
          aria-label="Menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-[4.25rem] right-5 sm:right-8 z-20 w-52 bg-white rounded-2xl shadow-xl shadow-pink-100 border border-pink-100 overflow-hidden text-left">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-all ${
                    tab === item.id
                      ? 'bg-pink-50 text-pink-600'
                      : 'text-slate-500 hover:bg-pink-50/60 hover:text-pink-600'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-700 tracking-tight">
            VGrade
          </h1>
        </div>
        <p className="text-sm text-pink-400 font-medium">GPA & CGPA Calculator for VIT</p>
      </header>

      {/* Card */}
      <main className="flex-1 flex justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 border border-pink-100 p-7 sm:p-8">
            {/* Card header accent strip */}
            <div
              className={`h-1 rounded-full mb-6 bg-gradient-to-r ${
                tab === 'gpa'
                  ? 'from-pink-400 to-rose-400'
                  : tab === 'cgpa'
                  ? 'from-orange-400 to-amber-400'
                  : tab === 'whatif'
                  ? 'from-violet-400 to-fuchsia-400'
                  : tab === 'targetplanner'
                  ? 'from-slate-600 to-slate-800'
                  : 'from-pink-400 via-rose-400 to-orange-400'
              }`}
            />

            {tab !== 'home' && (
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tab === 'gpa'
                      ? 'bg-pink-50'
                      : tab === 'cgpa'
                      ? 'bg-orange-50'
                      : tab === 'whatif'
                      ? 'bg-violet-50'
                      : 'bg-slate-100'
                  }`}
                >
                  {tab === 'gpa' && <BookOpen className="w-5 h-5 text-pink-500" />}
                  {tab === 'cgpa' && <TrendingUp className="w-5 h-5 text-orange-500" />}
                  {tab === 'whatif' && <BarChart3 className="w-5 h-5 text-violet-500" />}
                  {tab === 'targetplanner' && <Target className="w-5 h-5 text-slate-700" />}
                </div>
                <h2
                  className={`text-xl font-extrabold ${
                    tab === 'gpa'
                      ? 'text-pink-600'
                      : tab === 'cgpa'
                      ? 'text-orange-500'
                      : tab === 'whatif'
                      ? 'text-violet-600'
                      : 'text-slate-800'
                  }`}
                >
                  {tab === 'gpa'
                    ? 'GPA Calculator'
                    : tab === 'cgpa'
                    ? 'CGPA Calculator'
                    : tab === 'whatif'
                    ? 'Grade Impact Analysis'
                    : 'Target CGPA Planner'}
                </h2>
              </div>
            )}

            {tab === 'home' && <Home onNavigate={setTab} />}
            {tab === 'gpa' && <GPACalculator onTryWhatIf={handleTryWhatIf} />}
            {tab === 'cgpa' && <CGPACalculator />}
            {tab === 'whatif' && (
              <GradeImpactAnalysis snapshot={gpaSnapshot} onBackToGPA={() => setTab('gpa')} />
            )}
            {tab === 'targetplanner' && <TargetCGPAPlanner />}
          </div>
        </div>
      </main>

      {/* Footer */}
    <footer className="pb-8 text-center">
  <p className="text-xs text-pink-300 font-medium flex items-center justify-center gap-2">
    Made for <span className="text-pink-500 font-bold">VITian</span>

    <a
      href="https://www.linkedin.com/in/nithesh-kumar-t-b4028130a/"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        window.open(
          'https://www.linkedin.com/in/nithesh-kumar-t-b4028130a/',
          '_blank',
          'noopener,noreferrer'
        );
      }}
      className="text-blue-500 hover:opacity-80"
      aria-label="LinkedIn"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM0 8h5v16H0V8zm7.98 0h4.79v2.19h.07c.67-1.27 2.31-2.6 4.76-2.6 5.09 0 6.03 3.35 6.03 7.71V24h-5v-7.43c0-1.77-.03-4.05-2.47-4.05-2.47 0-2.85 1.93-2.85 3.92V24h-5V8z"/>
      </svg>
    </a>
  </p>
</footer>
    </div>
  );
}
