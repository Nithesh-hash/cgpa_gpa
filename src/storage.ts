import {
  UserProfile,
  SemesterCourse,
  Projection,
  DailyReminder,
  DEFAULT_PROFILE,
  DEFAULT_COURSES,
  DEFAULT_PROJECTIONS,
  DEFAULT_REMINDERS,
  GRADE_POINTS,
} from './types';

const STORAGE_KEYS = {
  CONFIGURED: 'vgrade_is_configured',
  PROFILE: 'vgrade_profile',
  COURSES: 'vgrade_courses',
  PROJECTIONS: 'vgrade_projections',
  REMINDERS: 'vgrade_reminders',
};

export function isUserConfigured(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.CONFIGURED) === 'true';
  } catch {
    return false;
  }
}

export function setUserConfigured(configured: boolean): void {
  try {
    if (configured) {
      localStorage.setItem(STORAGE_KEYS.CONFIGURED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.CONFIGURED);
    }
  } catch (e) {
    console.error('Failed to update configured state', e);
  }
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load profile from localStorage', e);
  }
  return DEFAULT_PROFILE;
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function loadCourses(): SemesterCourse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load courses from localStorage', e);
  }
  return DEFAULT_COURSES;
}

export function saveCourses(courses: SemesterCourse[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Failed to save courses', e);
  }
}

export function loadProjections(): Projection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load projections from localStorage', e);
  }
  return DEFAULT_PROJECTIONS;
}

export function saveProjections(projections: Projection[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTIONS, JSON.stringify(projections));
  } catch (e) {
    console.error('Failed to save projections', e);
  }
}

export function loadReminders(): DailyReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load reminders from localStorage', e);
  }
  return DEFAULT_REMINDERS;
}

export function saveReminders(reminders: DailyReminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  } catch (e) {
    console.error('Failed to save reminders', e);
  }
}

export function clearAllVGradeData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIGURED);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.PROJECTIONS);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
  } catch (e) {
    console.error('Failed to clear data', e);
  }
}

export function initNewUser(
  profile: UserProfile,
  courses: SemesterCourse[]
): { profile: UserProfile; courses: SemesterCourse[]; projections: Projection[]; reminders: DailyReminder[] } {
  saveProfile(profile);
  saveCourses(courses);

  const bestCaseGrades: Record<string, string> = {};
  courses.forEach((c) => {
    bestCaseGrades[c.id] = 'S';
  });

  const proj1Id = `proj-1-${Date.now()}`;

  const initialProjections: Projection[] = [
    {
      id: proj1Id,
      name: 'Best case',
      isDefault: true,
      grades: bestCaseGrades,
    },
  ];
  saveProjections(initialProjections);

  const initialReminders: DailyReminder[] = [
    {
      id: `rem-${Date.now()}`,
      time: '07:30',
      message: 'Study well',
      projectionId: proj1Id,
    },
  ];
  saveReminders(initialReminders);

  setUserConfigured(true);

  return {
    profile,
    courses,
    projections: initialProjections,
    reminders: initialReminders,
  };
}

// Calculations

export function calculateSemesterCredits(courses: SemesterCourse[]): number {
  return courses.reduce((sum, c) => sum + (c.credits || 0), 0);
}

export function calculateProjectionGpa(
  projection: Projection,
  courses: SemesterCourse[],
  profile: UserProfile
): { sgpa: number; cgpa: number; totalCredits: number } {
  const totalCredits = calculateSemesterCredits(courses);
  if (totalCredits === 0) {
    return { sgpa: 0, cgpa: profile.currentCgpa, totalCredits: 0 };
  }

  let weightedPoints = 0;
  courses.forEach((c) => {
    const grade = projection.grades[c.id] || 'F';
    const points = GRADE_POINTS[grade] ?? 0;
    weightedPoints += points * c.credits;
  });

  const sgpa = weightedPoints / totalCredits;

  const totalEarned = profile.earnedCredits + totalCredits;
  const projectedCgpa =
    totalEarned > 0
      ? (profile.currentCgpa * profile.earnedCredits + sgpa * totalCredits) / totalEarned
      : sgpa;

  return {
    sgpa: Math.round(sgpa * 100) / 100,
    cgpa: Math.round(projectedCgpa * 100) / 100,
    totalCredits,
  };
}

export function calculateCourseTotal(marks: SemesterCourse['marks']): number | null {
  const { cat1, cat2, internals, fat } = marks;
  if (cat1 === null && cat2 === null && internals === null && fat === null) {
    return null;
  }
  const total = (cat1 ?? 0) + (cat2 ?? 0) + (internals ?? 0) + (fat ?? 0);
  return Math.round(total * 10) / 10;
}

export function deriveCourseGrade(
  total: number | null,
  cutoffs: SemesterCourse['cutoffs']
): string | null {
  if (total === null) return null;
  if (cutoffs.S !== null && total >= cutoffs.S) return 'S';
  if (cutoffs.A !== null && total >= cutoffs.A) return 'A';
  if (cutoffs.B !== null && total >= cutoffs.B) return 'B';
  if (cutoffs.C !== null && total >= cutoffs.C) return 'C';
  if (cutoffs.D !== null && total >= cutoffs.D) return 'D';
  if (cutoffs.D !== null && total >= 40) return 'E';
  if (cutoffs.D !== null) return 'F';
  if (total >= 90) return 'S';
  if (total >= 80) return 'A';
  if (total >= 70) return 'B';
  if (total >= 60) return 'C';
  if (total >= 50) return 'D';
  if (total >= 40) return 'E';
  return 'F';
}

export function calculateDerivedGpaFromMarks(
  courses: SemesterCourse[],
  profile: UserProfile
): { sgpa: number; cgpa: number; derivedCount: number; totalCourses: number } {
  let weightedPoints = 0;
  let creditsConsidered = 0;
  let derivedCount = 0;

  courses.forEach((c) => {
    const total = calculateCourseTotal(c.marks);
    const grade = deriveCourseGrade(total, c.cutoffs);
    if (grade !== null && total !== null) {
      derivedCount++;
      const points = GRADE_POINTS[grade] ?? 0;
      weightedPoints += points * c.credits;
      creditsConsidered += c.credits;
    }
  });

  const sgpa = creditsConsidered > 0 ? weightedPoints / creditsConsidered : 0;
  const totalCreditsAfter = profile.earnedCredits + creditsConsidered;
  const cgpa =
    totalCreditsAfter > 0
      ? (profile.currentCgpa * profile.earnedCredits + sgpa * creditsConsidered) / totalCreditsAfter
      : profile.currentCgpa;

  return {
    sgpa: Math.round(sgpa * 100) / 100,
    cgpa: Math.round(cgpa * 100) / 100,
    derivedCount,
    totalCourses: courses.length,
  };
}
