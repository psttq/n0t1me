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
}

export interface ProjectWithStats extends Project {
  remainingHours: number;
  daysLeft: number | null;
  minDaysLeft: number | null;
  progress: number;
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

export interface AvailableHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}
