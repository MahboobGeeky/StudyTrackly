export type Course = {
  id: string;
  termId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionRow = {
  id: string;
  termId: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  activity: string;
  note: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  course: Course;
};

export type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  studyGoalHours: number;
  dailyGoalMinutes: number;
  examCount: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courses?: Course[];
  _count?: { sessions: number; courses: number; exams: number };
};

export type UserSettings = {
  id: number;
  email: string;
  displayName: string;
  trialEnd: string | null;
  academicLevel: string | null;
  timerVolume?: number;
};

export type StudyDayRow = {
  dateKey: string;
  durationMinutes: number;
  goalMinutes: number;
  gapMinutes: number;
  sharePriceMinutes: number;
  progressPct: number;
};

export type DashboardStats = {
  term: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    studyGoalHours: number;
    dailyGoalMinutes: number;
    goldMedals: number;
    silverMedals: number;
    bronzeMedals: number;
    examCount: number;
  } | null;
  totals: {
    totalMinutes: number;
    todayMinutes: number;
    weekMinutes: number;
    sessionCount: number;
  };
  progress: {
    studyProgressPct: number;
    timeElapsedPct: number;
    elapsedDays: number;
    totalTermDays: number;
    distinctStudyDays: number;
    studyDaysTarget: number;
  };
  courseBreakdown: { name: string; color: string; minutes: number }[];
  streak: number;
};

export type DataRoomFile = {
  id: string;
  termId: string;
  name: string;
  url: string;
  note: string;
  createdAt: string;
};

export type Exam = {
  id: string;
  termId: string;
  name: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};
