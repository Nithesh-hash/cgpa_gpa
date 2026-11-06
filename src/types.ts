export type Tab = 
  | 'home' 
  | 'gpa' 
  | 'cgpa' 
  | 'whatif' 
  | 'targetplanner'
  | 'projections' 
  | 'profile';

export interface UserProfile {
  name: string;
  regNo: string;
  school: string;
  branch: string;
  currentCgpa: number;
  earnedCredits: number;
}

export type CourseType = 'Theory' | 'Lab' | 'Embedded' | 'Project' | 'Other';
export type GradingType = 'Relative' | 'Absolute';

export interface CourseMarks {
  cat1: number | null; // out of 15
  cat2: number | null; // out of 15
  internals: number | null; // out of 30
  fat: number | null; // out of 40
}

export interface CourseCutoffs {
  S: number | null;
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
}

export interface SemesterCourse {
  id: string;
  name: string;
  credits: number;
  type: CourseType;
  grading: GradingType;
  marks: CourseMarks;
  cutoffs: CourseCutoffs;
}

export interface Projection {
  id: string;
  name: string;
  isDefault: boolean;
  grades: Record<string, string>; // courseId -> 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
}

export interface DailyReminder {
  id: string;
  time: string; // "HH:MM" e.g. "07:53"
  message: string;
  projectionId: string;
}

export const GRADE_POINTS: Record<string, number> = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  regNo: '',
  school: '',
  branch: '',
  currentCgpa: 0,
  earnedCredits: 0,
};

export const DEFAULT_COURSES: SemesterCourse[] = [
  {
    id: 'course-1',
    name: 'Agile',
    credits: 3,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: 14.2, cat2: 10, internals: 25, fat: 30 },
    cutoffs: { S: 80, A: 75, B: 65, C: 60, D: 50 },
  },
  {
    id: 'course-2',
    name: 'Metrics',
    credits: 3,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-3',
    name: 'Discrete',
    credits: 4,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-4',
    name: 'AI',
    credits: 3,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-5',
    name: 'Bsm',
    credits: 3,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-6',
    name: 'Testing',
    credits: 3,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-7',
    name: 'Skills',
    credits: 1.5,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-8',
    name: 'AI Lab',
    credits: 1,
    type: 'Lab',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-9',
    name: 'Agile Lab',
    credits: 1,
    type: 'Lab',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-10',
    name: 'Testing Lab',
    credits: 1,
    type: 'Lab',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
  {
    id: 'course-11',
    name: 'Nptel',
    credits: 3,
    type: 'Theory',
    grading: 'Relative',
    marks: { cat1: null, cat2: null, internals: null, fat: null },
    cutoffs: { S: null, A: null, B: null, C: null, D: null },
  },
];

export const DEFAULT_PROJECTIONS: Projection[] = [
  {
    id: 'proj-1',
    name: 'Best case',
    isDefault: true,
    grades: {
      'course-1': 'S',
      'course-2': 'S',
      'course-3': 'S',
      'course-4': 'S',
      'course-5': 'S',
      'course-6': 'S',
      'course-7': 'S',
      'course-8': 'S',
      'course-9': 'S',
      'course-10': 'S',
      'course-11': 'S',
    },
  },
];

export const DEFAULT_REMINDERS: DailyReminder[] = [
  {
    id: 'rem-1',
    time: '07:53',
    message: 'Study well',
    projectionId: 'proj-1',
  },
];

