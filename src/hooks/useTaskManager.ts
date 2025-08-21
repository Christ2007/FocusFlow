import { useState, useEffect } from 'react';
import { Task, UserProgress, Badge } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';

// Mobile-compatible UUID generator
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for mobile browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const STORAGE_KEYS = {
  TASKS: 'adhd_tasks',
  PROGRESS: 'adhd_progress'
};

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<UserProgress>({
    streakDays: 0,
    totalPoints: 0,
    badges: [],
    todayProgress: { completed: 0, total: 0, points: 0 }
  });
  const { toast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      setTasks(parsedTasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined
      })));
    }
    
    if (savedProgress) {
      const parsedProgress = JSON.parse(savedProgress);
      setProgress({
        ...parsedProgress,
        badges: parsedProgress.badges.map((badge: any) => ({
          ...badge,
          earnedAt: new Date(badge.earnedAt)
        }))
      });
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  }, [progress]);

  // Calculate today's progress
  useEffect(() => {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(task => 
      new Date(task.createdAt).toDateString() === today
    );
    
    const completed = todayTasks.filter(task => task.completed).length;
    const total = todayTasks.length;
    const points = completed * 10; // 10 points per completed task
    
    setProgress(prev => ({
      ...prev,
      todayProgress: { completed, total, points }
    }));
  }, [tasks]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    console.log('addTask called with:', taskData);
    const newTask: Task = {
      ...taskData,
      id: generateUUID(),
      completed: false,
      createdAt: new Date()
    };
    
    console.log('Creating new task:', newTask);
    setTasks(prev => {
      const newTasks = [...prev, newTask];
      console.log('Updated tasks array:', newTasks);
      return newTasks;
    });
    
    toast({
      title: "Task Added! ",
      description: `"${newTask.name}" is ready to tackle!`
    });
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && !task.completed) {
        const completedTask = {
          ...task,
          completed: true,
          completedAt: new Date()
        };
        
        // Award points and celebrate!
        setProgress(prev => ({
          ...prev,
          totalPoints: prev.totalPoints + 10
        }));
        
        toast({
          title: "Amazing! 🎉",
          description: `+10 points for completing "${task.name}"!`
        });
        
        // Check for badges
        checkForNewBadges();
        
        return completedTask;
      }
      return task;
    }));
  };

  const uncompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.completed) {
        setProgress(prev => ({
          ...prev,
          totalPoints: Math.max(0, prev.totalPoints - 10)
        }));
        
        return {
          ...task,
          completed: false,
          completedAt: undefined
        };
      }
      return task;
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const checkForNewBadges = () => {
    const newBadges: Badge[] = [];
    const completedToday = progress.todayProgress.completed + 1;
    
    // First task badge
    if (completedToday === 1 && !progress.badges.some(b => b.id === 'first_task')) {
      newBadges.push({
        id: 'first_task',
        name: 'Getting Started',
        description: 'Completed your first task!',
        icon: '🌟',
        type: 'bronze',
        earnedAt: new Date()
      });
    }
    
    // Daily achiever badge
    if (completedToday >= 5 && !progress.badges.some(b => b.id === 'daily_achiever')) {
      newBadges.push({
        id: 'daily_achiever',
        name: 'Daily Achiever',
        description: 'Completed 5 tasks in one day!',
        icon: '🏆',
        type: 'gold',
        earnedAt: new Date()
      });
    }
    
    if (newBadges.length > 0) {
      setProgress(prev => ({
        ...prev,
        badges: [...prev.badges, ...newBadges]
      }));
      
      newBadges.forEach(badge => {
        toast({
          title: `New Badge Earned! ${badge.icon}`,
          description: `${badge.name}: ${badge.description}`
        });
      });
    }
  };

  const getTodayTasks = () => {
    const today = new Date().toDateString();
    return tasks
      .filter(task => new Date(task.createdAt).toDateString() === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return {
    tasks,
    progress,
    addTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    getTodayTasks
  };
}