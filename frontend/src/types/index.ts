export interface Project {
  id: string;
  name: string;
  totalHours: number;
  importance: number;
  spentHours: number;
  status: 'active' | 'completed';
  weeklyPlannedHours: number;
  createdAt: string;
  updatedAt: string;
  remainingHours?: number;
  daysLeft?: number | null;
  progress?: number;
  recommendedToday?: number;
  spentToday?: number;
  remainingToday?: number;
  weekPlanned?: number;
  weekSpent?: number;
  weekRemaining?: number;
  weekProgress?: number;
}

export interface Settings {
  id: number;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  workDuration: number;
  breakDuration: number;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  duration: number;
  date: string;
  notes?: string;
}

export interface Statistics {
  overview: {
    totalProjects: number;
    totalPlannedHours: number;
    totalSpentHours: number;
    totalSpentMinutes: number;
    completedProjects: number;
    activeProjects: number;
    overallProgress: number;
  };
  projectStats: Project[];
  dailyStats: { date: string; totalDuration: number; sessionCount: number }[];
  distribution: { id: string; name: string; spentHours: number; percent: number }[];
  weeklyStats: { week: string; totalDuration: number; projectsWorked: number }[];
  recentActivity: (TimeEntry & { projectName: string })[];
}
