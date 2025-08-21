export type TaskCategory = 'focus' | 'energy' | 'creative' | 'rest';

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  icon: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  subtasks?: Subtask[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
}

export interface UserProgress {
  streakDays: number;
  totalPoints: number;
  badges: Badge[];
  todayProgress: {
    completed: number;
    total: number;
    points: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  type: 'bronze' | 'silver' | 'gold';
}

export const TASK_CATEGORIES = {
  focus: {
    name: 'Focus',
    color: 'focus',
    gradient: 'gradient-focus',
    defaultIcon: '🎯'
  },
  energy: {
    name: 'Energy',
    color: 'energy', 
    gradient: 'gradient-energy',
    defaultIcon: '⚡'
  },
  creative: {
    name: 'Creative',
    color: 'creative',
    gradient: 'gradient-creative', 
    defaultIcon: '🎨'
  },
  rest: {
    name: 'Rest',
    color: 'secondary',
    gradient: 'gradient-success',
    defaultIcon: '🧘'
  }
} as const;

export const TASK_ICONS = {
  // Focus tasks
  study: '📚',
  work: '💼', 
  reading: '📖',
  coding: '💻',
  planning: '📋',
  // Energy tasks  
  exercise: '🏋️',
  running: '🏃',
  sports: '⚽',
  walking: '🚶',
  yoga: '🧘',
  // Creative tasks
  art: '🎨',
  music: '🎵',
  writing: '✍️',
  design: '🎭',
  cooking: '👨‍🍳',
  // Rest tasks
  meditation: '🧘‍♀️',
  sleep: '😴',
  relaxing: '🛋️',
  socializing: '👥',
  entertainment: '🎬'
} as const;