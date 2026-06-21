import { useState, useRef } from 'react';
import Footer from "./components/Footer";
import {
  GraduationCap,
  Plus,
  Trash2,
  Calculator,
  BookOpen,
  RefreshCw,
  Download,
  ChevronDown,
  Info,
  CheckCircle2,
  TrendingUp,
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

function GPACalculator() {
  const [courses, setCourses] = useState<CourseRow[]>([
    { id: 1, credits: '', grade: '' },
    { id: 2, credits: '', grade: '' },
    { id: 3, credits: '', grade: '' },
  ]);
  const [result, setResult] = useState<{ gpa: number; totalCredits: number } | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const addCourse = () => {
    setCourses([...courses, { id: Date.now(), credits: '', grade: '' }]);
    setResult(null);
  };

  const removeCourse = (id: number) => {
    if (courses.length <= 1) return;
    setCourses(courses.filter((c) => c.id !== id));
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
      { id: 2, credits: '', grade: '' },
      { id: 3, credits: '', grade: '' },
    ]);
    setResult(null);
    setError('');
  };

  const calculate = () => {
    const valid = courses.filter((c) => c.credits && c.grade);
    if (valid.length === 0) {
      setError('Please fill in at least one subject with credits and grade.');
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
      'Subjects:',
      '-'.repeat(35),
      ...validCourses.map((c, i) => {
        const gp = GRADES.find((g) => g.label === c.grade)!.points;
        return `  ${i + 1}. Credits: ${c.credits}  Grade: ${c.grade} (${gp} pts)  → ${parseFloat(c.credits) * gp} pts`;
      }),
      '-'.repeat(35),
      `Total Credits : ${result.totalCredits}`,
      `Total Points  : ${result.totalPoints}`,
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

  return (
    <div>
      <HowToUse
        steps={[
          'Enter credits and grade for each subject',
          'Add more subjects as needed using "Add Subject"',
          'Click "Calculate GPA" to get your result',
          'Download your result for future reference',
        ]}
      />

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
        Add Subject
      </button>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={calculate}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
        >
          <Calculator className="w-4 h-4" />
          Calculate GPA
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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={calculate}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
        >
          <TrendingUp className="w-4 h-4" />
          Calculate CGPA
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

type Tab = 'gpa' | 'cgpa';

export default function App() {
  const [tab, setTab] = useState<Tab>('gpa');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/40 via-white to-orange-50/20 flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-6 px-4 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-200">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-700 tracking-tight">
            VGrade
          </h1>
        </div>
        <p className="text-sm text-pink-400 font-medium">Smart GPA & CGPA Calculator for VIT</p>
      </header>

      {/* Tab switcher */}
      <div className="flex justify-center px-4 mb-8">
        <div className="inline-flex bg-pink-100/60 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('gpa')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === 'gpa'
                ? 'bg-white text-pink-600 shadow-md shadow-pink-100'
                : 'text-pink-400 hover:text-pink-600'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            GPA Calculator
          </button>
          <button
            onClick={() => setTab('cgpa')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === 'cgpa'
                ? 'bg-white text-orange-500 shadow-md shadow-orange-100'
                : 'text-pink-400 hover:text-orange-500'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            CGPA Calculator
          </button>
        </div>
      </div>

      {/* Card */}
      <main className="flex-1 flex justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 border border-pink-100 p-7 sm:p-8">
            {/* Card header accent strip */}
            <div
              className={`h-1 rounded-full mb-6 bg-gradient-to-r ${
                tab === 'gpa' ? 'from-pink-400 to-rose-400' : 'from-orange-400 to-amber-400'
              }`}
            />

            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tab === 'gpa' ? 'bg-pink-50' : 'bg-orange-50'
                }`}
              >
                {tab === 'gpa' ? (
                  <BookOpen className="w-5 h-5 text-pink-500" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                )}
              </div>
              <h2
                className={`text-xl font-extrabold ${
                  tab === 'gpa' ? 'text-pink-600' : 'text-orange-500'
                }`}
              >
                {tab === 'gpa' ? 'GPA Calculator' : 'CGPA Calculator'}
              </h2>
            </div>

            {tab === 'gpa' ? <GPACalculator /> : <CGPACalculator />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 text-center">
        <p className="text-xs text-pink-300 font-medium">
          Made for <span className="text-pink-500 font-bold">VITian</span>
        </p>
      </footer>
    </div>
  );
}
