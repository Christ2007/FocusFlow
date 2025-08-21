import { useState, useEffect } from 'react';
import { Task, UserProgress, Badge } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';

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
  const { user, token } = useAuth();
  const { apiCall } = useApi();

  // Load data from API or localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      if (user && token) {
        try {
          // Load from API
          const [tasksResponse, userProfile] = await Promise.all([
            apiCall('/tasks/today'),
            apiCall('/auth/me')
          ]);
          
          setTasks(tasksResponse.tasks.map((task: any) => ({
            ...task,
            id: task._id,
            createdAt: new Date(task.createdAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined
          })));
          
          console.log('Setting progress from user profile:', userProfile.user.progress);
          setProgress({
            streakDays: userProfile.user.progress.streakDays || 0,
            totalPoints: userProfile.user.progress.totalPoints || 0,
            badges: userProfile.user.progress.badges?.map((badge: any) => ({
              ...badge,
              earnedAt: new Date(badge.earnedAt)
            })) || [],
            todayProgress: { completed: 0, total: 0, points: 0 }
          });
          console.log('Progress state updated with streak:', userProfile.user.progress.streakDays);
        } catch (error) {
          console.error('Failed to load data from API:', error);
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage for offline mode
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
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
    };

    loadData();
  }, [user, token]);

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

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    console.log('addTask called with:', taskData);
    
    if (user && token) {
      try {
        // Save to API
        const response = await apiCall('/tasks', {
          method: 'POST',
          body: JSON.stringify(taskData)
        });
        
        const newTask: Task = {
          ...response.task,
          id: response.task._id,
          createdAt: new Date(response.task.createdAt),
          completedAt: response.task.completedAt ? new Date(response.task.completedAt) : undefined
        };
        
        setTasks(prev => [...prev, newTask]);
        
        toast({
          title: "Task Added! 🎯",
          description: `"${newTask.name}" is ready to tackle!`
        });
      } catch (error) {
        console.error('Failed to add task to API:', error);
        // Fallback to local storage
        addTaskLocally(taskData);
      }
    } else {
      // Offline mode
      addTaskLocally(taskData);
    }
  };

  const addTaskLocally = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateUUID(),
      completed: false,
      createdAt: new Date()
    };
    
    setTasks(prev => [...prev, newTask]);
    
    toast({
      title: "Task Added! 🎯",
      description: `"${newTask.name}" is ready to tackle!`
    });
  };

  const completeTask = async (taskId: string) => {
    if (user && token) {
      try {
        // Complete task via API
        const response = await apiCall(`/tasks/${taskId}/complete`, {
          method: 'PUT'
        });
        
        setTasks(prev => prev.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              completed: true,
              completedAt: new Date()
            };
          }
          return task;
        }));
        
        setProgress(prev => ({
          ...prev,
          totalPoints: prev.totalPoints + (response.pointsEarned || 10)
        }));
        
        toast({
          title: "Amazing! 🎉",
          description: `+${response.pointsEarned || 10} points for completing the task!`
        });
        
        // Show new badges if any
        if (response.newBadges && response.newBadges.length > 0) {
          response.newBadges.forEach((badge: any) => {
            toast({
              title: `New Badge Earned! ${badge.icon}`,
              description: `${badge.name}: ${badge.description}`
            });
          });
        }
      } catch (error) {
        console.error('Failed to complete task via API:', error);
        completeTaskLocally(taskId);
      }
    } else {
      completeTaskLocally(taskId);
    }
  };

  const completeTaskLocally = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && !task.completed) {
        const completedTask = {
          ...task,
          completed: true,
          completedAt: new Date()
        };
        
        setProgress(prev => ({
          ...prev,
          totalPoints: prev.totalPoints + 10
        }));
        
        toast({
          title: "Amazing! 🎉",
          description: `+10 points for completing "${task.name}"!`
        });
        
        checkForNewBadges();
        
        return completedTask;
      }
      return task;
    }));
  };

  const uncompleteTask = async (taskId: string) => {
    if (user && token) {
      try {
        // Uncomplete task via API
        const response = await apiCall(`/tasks/${taskId}/uncomplete`, {
          method: 'PUT'
        });
        
        setTasks(prev => prev.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              completed: false,
              completedAt: undefined
            };
          }
          return task;
        }));
        
        setProgress(prev => ({
          ...prev,
          totalPoints: Math.max(0, prev.totalPoints - (response.pointsDeducted || 10))
        }));
      } catch (error) {
        console.error('Failed to uncomplete task via API:', error);
        uncompleteTaskLocally(taskId);
      }
    } else {
      uncompleteTaskLocally(taskId);
    }
  };

  const uncompleteTaskLocally = (taskId: string) => {
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

  const deleteTask = async (taskId: string) => {
    if (user && token) {
      try {
        // Delete task via API
        await apiCall(`/tasks/${taskId}`, {
          method: 'DELETE'
        });
        
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Failed to delete task via API:', error);
        deleteTaskLocally(taskId);
      }
    } else {
      deleteTaskLocally(taskId);
    }
  };

  const deleteTaskLocally = (taskId: string) => {
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