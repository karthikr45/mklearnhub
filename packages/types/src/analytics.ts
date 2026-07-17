export interface CourseStats {
  courseId: string
  title: string
  enrollmentCount: number
  completionCount: number
  completionRate: number
  avgProgressPct: number
  avgQuizScore: number
  totalWatchMins: number
}

export interface LearnerStats {
  userId: string
  name: string
  enrolledCourses: number
  completedCourses: number
  avgQuizScore: number
  attendanceRate?: number
}

export interface OrgStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  activeLearners: number
  completionRate: number
}

export interface ProgressReport {
  userId: string
  courseId: string
  progressPct: number
  lessonsCompleted: number
  totalLessons: number
  lastAccessAt?: Date | null
}

export interface CompletionReport {
  courseId: string
  period: string
  completions: number
  enrollments: number
}
