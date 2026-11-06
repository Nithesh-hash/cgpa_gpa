import { useState } from 'react';
import {
  Projection,
  SemesterCourse,
  UserProfile,
} from '../types';
import { calculateProjectionGpa } from '../storage';
import { ChevronRight, ChevronLeft, Check, Plus, Copy } from 'lucide-react';

interface ProjectionsViewProps {
  projections: Projection[];
  courses: SemesterCourse[];
  profile: UserProfile;
  onUpdateProjections: (projections: Projection[]) => void;
}

export function ProjectionsView({
  projections,
  courses,
  profile,
  onUpdateProjections,
}: ProjectionsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeProjection = projections.find((p) => p.id === editingId);

  const handleOpenEdit = (proj: Projection) => {
    setEditingId(proj.id);
    setEditingName(proj.name);
  };

  const handleCloseEdit = () => {
    setEditingId(null);
  };

  const handleUpdateGrade = (courseId: string, grade: string) => {
    if (!activeProjection) return;
    const updated = projections.map((p) => {
      if (p.id === activeProjection.id) {
        return {
          ...p,
          grades: {
            ...p.grades,
            [courseId]: grade,
          },
        };
      }
      return p;
    });
    onUpdateProjections(updated);
  };

  const handleSaveName = () => {
    if (!activeProjection || !editingName.trim()) return;
    const updated = projections.map((p) =>
      p.id === activeProjection.id ? { ...p, name: editingName.trim() } : p
    );
    onUpdateProjections(updated);
  };

  const handleMakeDefault = () => {
    if (!activeProjection) return;
    const updated = projections.map((p) => ({
      ...p,
      isDefault: p.id === activeProjection.id,
    }));
    onUpdateProjections(updated);
  };

  const handleDelete = () => {
    if (!activeProjection) return;
    if (projections.length <= 1) {
      alert('You must have at least one projection.');
      return;
    }
    if (confirm(`Delete projection "${activeProjection.name}"?`)) {
      const remaining = projections.filter((p) => p.id !== activeProjection.id);
      if (activeProjection.isDefault && remaining.length > 0) {
        remaining[0].isDefault = true;
      }
      onUpdateProjections(remaining);
      setEditingId(null);
    }
  };

  const handleDuplicate = () => {
    if (!activeProjection) return;
    const newProj: Projection = {
      id: `proj-${Date.now()}`,
      name: `${activeProjection.name} (Copy)`,
      isDefault: false,
      grades: { ...activeProjection.grades },
    };
    onUpdateProjections([...projections, newProj]);
    setEditingId(newProj.id);
    setEditingName(newProj.name);
  };

  const handleCreateNew = () => {
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
    onUpdateProjections([...projections, newProj]);
    setEditingId(newProj.id);
    setEditingName(newProj.name);
  };

  // IF EDITING A SPECIFIC PROJECTION
  if (activeProjection) {
    const { sgpa, cgpa } = calculateProjectionGpa(
      activeProjection,
      courses,
      profile
    );

    return (
      <div className="pb-16 text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleCloseEdit}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            All projections
          </button>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {activeProjection.name}
          </span>
        </div>

        {/* GPA Summary Card matching Reference Picture */}
        <div className="bg-slate-50/90 dark:bg-slate-800/80 rounded-[28px] p-6 border border-slate-100 dark:border-slate-700/60 mb-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mb-0.5">GPA</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{sgpa.toFixed(2)}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-2">
                For {courses.length} out of {courses.length} courses you entered
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mb-0.5">CGPA</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{cgpa.toFixed(2)}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-2">
                {profile.currentCgpa.toFixed(2)} over {profile.earnedCredits} credits
              </p>
            </div>
          </div>
        </div>

        {/* Courses list */}
        <div className="space-y-3 mb-6">
          {courses.map((c) => {
            const currentGrade = activeProjection.grades[c.id] || 'S';
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{c.name}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {c.credits} {c.credits === 1 ? 'credit' : 'credits'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">Predicted</p>

                {/* Grade buttons grid matching reference */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['S', 'A', 'B', 'C'].map((g) => {
                    const isSelected = currentGrade === g;
                    return (
                      <button
                        key={g}
                        onClick={() => handleUpdateGrade(c.id, g)}
                        className={`h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                          isSelected
                            ? 'border-2 border-dashed border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                            : 'bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['D', 'E', 'F'].map((g) => {
                    const isSelected = currentGrade === g;
                    return (
                      <button
                        key={g}
                        onClick={() => handleUpdateGrade(c.id, g)}
                        className={`h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                          isSelected
                            ? 'border-2 border-dashed border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                            : 'bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rename & Action panel */}
        <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Projection name"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              onClick={handleSaveName}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold active:scale-95 transition-all"
            >
              Save
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleMakeDefault}
              disabled={activeProjection.isDefault}
              className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              {activeProjection.isDefault ? 'Default Projection' : 'Make default'}
            </button>
            <button
              onClick={handleDuplicate}
              className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplicate
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleDelete}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
            >
              Delete this projection
            </button>
          </div>
        </div>

        {/* Save and close */}
        <button
          onClick={handleCloseEdit}
          className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-base font-bold shadow-md active:scale-[0.99] transition-all"
        >
          Save and close
        </button>
      </div>
    );
  }

  // PROJECTIONS LIST VIEW (Matching Reference Picture Exactly)
  return (
    <div className="pb-16 text-slate-900 dark:text-slate-100">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Projections
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
          Hold as many as you like. Each one is a full set of grades for this semester.
        </p>
      </div>

      {/* Projection Cards */}
      <div className="space-y-4 mb-8">
        {projections.map((p) => {
          const { sgpa, cgpa } = calculateProjectionGpa(p, courses, profile);
          return (
            <div
              key={p.id}
              onClick={() => handleOpenEdit(p)}
              className="w-full bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 rounded-[28px] p-6 border border-slate-100 dark:border-slate-700/60 text-left transition-all active:scale-[0.99] cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{p.name}</h3>
                {p.isDefault && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-black text-white dark:bg-white dark:text-black">
                    Default
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-400 font-medium block mb-0.5">
                      GPA
                    </span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {sgpa.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-[1px] h-9 bg-slate-200/80 dark:bg-slate-700" />
                  <div>
                    <span className="text-xs text-slate-400 dark:text-slate-400 font-medium block mb-0.5">
                      CGPA
                    </span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {cgpa.toFixed(2)}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Projection scenario button */}
      <button
        onClick={handleCreateNew}
        className="w-full py-3.5 mb-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all shadow-sm active:scale-[0.99]"
      >
        <Plus className="w-4 h-4" />
        Add new grade scenario
      </button>

      {/* Footnote matching Reference Picture */}
      <p className="text-sm text-slate-400 dark:text-slate-400 leading-relaxed mb-6">
        Grades here are your own estimates.
      </p>
    </div>
  );
}
