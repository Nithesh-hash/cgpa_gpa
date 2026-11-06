import {
  TrendingUp,
  Target,
  Bell,
  BookOpen,
  BarChart3,
  Plus,
  X,
} from 'lucide-react';
import { Tab } from '../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
  onCreateProjection: () => void;
}

export function QuickActionModal({
  isOpen,
  onClose,
  onNavigate,
  onCreateProjection,
}: QuickActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-pink-500" />
            Quick Actions
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {/* Projections List */}
          <button
            onClick={() => {
              onNavigate('projections');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">All Projections</p>
              <p className="text-[11px] text-slate-400">View and edit grade scenarios</p>
            </div>
          </button>

          {/* New Projection */}
          <button
            onClick={() => {
              onCreateProjection();
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">New Projection</p>
              <p className="text-[11px] text-slate-400">Add a new grade scenario</p>
            </div>
          </button>

          {/* Grade Impact */}
          <button
            onClick={() => {
              onNavigate('whatif');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Grade Impact</p>
              <p className="text-[11px] text-slate-400">See how grades affect your GPA</p>
            </div>
          </button>

          {/* Target CGPA */}
          <button
            onClick={() => {
              onNavigate('targetplanner');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Target CGPA Planner</p>
              <p className="text-[11px] text-slate-400">Calculate required semester GPA</p>
            </div>
          </button>

          {/* New Reminder */}
          <button
            onClick={() => {
              onNavigate('profile');
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Daily Reminders</p>
              <p className="text-[11px] text-slate-400">Set daily CGPA motivational alarm</p>
            </div>
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              VGrade Calculators
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onNavigate('gpa');
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 text-left transition-all"
              >
                <BookOpen className="w-4 h-4 text-pink-500 mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">GPA Calc</p>
                <p className="text-[10px] text-slate-400">Current GPA</p>
              </button>
              <button
                onClick={() => {
                  onNavigate('cgpa');
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 text-left transition-all"
              >
                <TrendingUp className="w-4 h-4 text-slate-800 dark:text-white mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">CGPA Calc</p>
                <p className="text-[10px] text-slate-400">Cumulative GPA</p>
              </button>
              <button
                onClick={() => {
                  onNavigate('whatif');
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 text-left transition-all"
              >
                <BarChart3 className="w-4 h-4 text-slate-800 dark:text-white mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Grade Impact</p>
                <p className="text-[10px] text-slate-400">What-if analysis</p>
              </button>
              <button
                onClick={() => {
                  onNavigate('targetplanner');
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-pink-50 text-left transition-all"
              >
                <Target className="w-4 h-4 text-slate-800 dark:text-white mb-1" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Target CGPA</p>
                <p className="text-[10px] text-slate-400">Required GPA</p>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
