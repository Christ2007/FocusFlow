export interface AnalyticsSummary {
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number;
  totalFocusMinutes: number;
  totalPoints: number;
  estimatedMinutes: number;
  actualMinutes: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
}

export interface PriorityBreakdown {
  priority: string;
  count: number;
}

export interface DailyTimeComparison {
  name: string;
  fullName: string;
  estimatedMinutes: number;
  actualMinutes: number;
}

export interface DailyAnalyticsResponse {
  period: 'daily';
  date: string;
  summary: AnalyticsSummary;
  categoryBreakdown: CategoryBreakdown[];
  priorityBreakdown: PriorityBreakdown[];
  timeComparison: DailyTimeComparison[];
}

export interface WeeklyDayData {
  day: string;
  shortDay: string;
  date: string;
  completed: number;
  created: number;
  focusMinutes: number;
  estimatedMinutes: number;
  actualMinutes: number;
}

export interface WeeklyAnalyticsResponse {
  period: 'weekly';
  startDate: string;
  endDate: string;
  summary: AnalyticsSummary;
  dailyBreakdown: WeeklyDayData[];
}

export interface MonthlyTrendData {
  date: string;
  day: number;
  label: string;
  completed: number;
  estimatedMinutes: number;
  actualMinutes: number;
}

export interface MonthlyAnalyticsResponse {
  period: 'monthly';
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  summary: AnalyticsSummary;
  trendData: MonthlyTrendData[];
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';
