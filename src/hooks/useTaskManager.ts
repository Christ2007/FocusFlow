import { useState, useEffect } from 'react';
import { Task, UserProgress, Badge } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';

// Mobile-compatible UUID generator
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const MIGRATION_KEY = 'focusflow_migrated';
const OLD_STORAGE_KEYS = {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { apiCall } = useApi();

  // Parse tasks from API response
  const parseTasks = (apiTasks: any[]): Task[] => {
    return apiTasks.map((task: any) => ({
      ...task,
      id: task.id || task._id,
      createdAt: new Date(task.createdAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined
    }));
  };

  // Parse progress from API response
  const parseProgress = (apiProgress: any): Partial<UserProgress> => {
    return {
      streakDays: apiProgress.streakDays || 0,
      totalPoints: apiProgress.totalPoints || 0,
      badges: (apiProgress.badges || []).map((badge: any) => ({
        ...badge,
        earnedAt: new Date(badge.earnedAt)
      }))
    };
  };

  // One-time localStorage migration (conservative: only when server is empty)
  const attemptMigration = async () => {
    if (localStorage.getItem(MIGRATION_KEY) === 'true') return;

    const savedTasks = localStorage.getItem(OLD_STORAGE_KEYS.TASKS);
    const savedProgress = localStorage.getItem(OLD_STORAGE_KEYS.PROGRESS);

    if (!savedTasks && !savedProgress) return;

    try {
      const migrationData: any = {};

      if (savedTasks) {
        migrationData.tasks = JSON.parse(savedTasks);
      }
      if (savedProgress) {
        migrationData.progress = JSON.parse(savedProgress);
      }

      const result = await apiCall('/migrate', {
        method: 'POST',
        body: JSON.stringify(migrationData)
      }, 10000);

      if (result?.success) {
        // Only mark migration complete after server confirms successful persistence
        localStorage.setItem(MIGRATION_KEY, 'true');
      }
    } catch (e) {
      // Do not mark as migrated on failure — will retry next load
      console.warn('localStorage migration failed, will retry next load:', e);
    }
  };

  // 1. Initial load: server is the source of truth
  useEffect(() => {
    const loadFromServer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Attempt migration before loading (only runs once, only if server is empty)
        await attemptMigration();

        // Load authoritative state from server
        const response = await apiCall('/tasks', {}, 5000);

        if (response?.success && Array.isArray(response.tasks)) {
          setTasks(parseTasks(response.tasks));

          if (response.progress) {
            setProgress(prev => ({
              ...prev,
              ...parseProgress(response.progress)
            }));
          }
        }
      } catch (err: any) {
        console.error('Failed to load from server:', err);
        setError('Could not connect to server');
        toast({
          title: "⚠️ Connection Error",
          description: "Could not load data from server. Please check your connection."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFromServer();
  }, []);

  // 2. Calculate today's progress whenever tasks update
  useEffect(() => {
    const isToday = (d: Date) => {
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };

    const todayTasks = tasks.filter(task => isToday(new Date(task.createdAt)));
    const completed = todayTasks.filter(task => task.completed).length;
    const total = todayTasks.length;
    const points = completed * 10;

    setProgress(prev => ({
      ...prev,
      todayProgress: { completed, total, points }
    }));
  }, [tasks]);

  // 3. Optimistic Add Task: updates UI instantly, then syncs to server
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const taskId = generateUUID();
    const newTask: Task = {
      ...taskData,
      id: taskId,
      completed: false,
      createdAt: new Date()
    };

    // Instant local state update
    setTasks(prev => [...prev, newTask]);

    toast({
      title: "Task Added! 🎯",
      description: `"${newTask.name}" is ready to tackle!`
    });

    // Sync to server
    apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...taskData, id: taskId })
    }).catch(() => {
      // Rollback on failure
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: "⚠️ Failed to save task",
        description: "The task could not be saved to the server."
      });
    });
  };

  // 4. Optimistic Complete Task
  const completeTask = (taskId: string) => {
    const previousTasks = [...tasks];
    const previousProgress = { ...progress };

    // Instant local state update
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && !task.completed) {
        return { ...task, completed: true, completedAt: new Date() };
      }
      return task;
    }));

    setProgress(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + 10
    }));

    toast({
      title: "Amazing! 🎉",
      description: "+10 points for completing the task!"
    });

    // Sync to server and use authoritative progress from response
    apiCall(`/tasks/${taskId}/complete`, {
      method: 'PUT'
    }).then(res => {
      if (res?.progress) {
        setProgress(prev => ({
          ...prev,
          ...parseProgress(res.progress)
        }));
      }
      if (res?.newBadges?.length > 0) {
        res.newBadges.forEach((badge: any) => {
          toast({
            title: `New Badge Earned! ${badge.icon}`,
            description: `${badge.name}: ${badge.description}`
          });
        });
      }
    }).catch(() => {
      // Rollback on failure
      setTasks(previousTasks);
      setProgress(previousProgress);
      toast({
        title: "⚠️ Failed to complete task",
        description: "Could not save completion to server."
      });
    });
  };

  // 5. Optimistic Uncomplete Task
  const uncompleteTask = (taskId: string) => {
    const previousTasks = [...tasks];
    const previousProgress = { ...progress };

    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.completed) {
        return { ...task, completed: false, completedAt: undefined };
      }
      return task;
    }));

    setProgress(prev => ({
      ...prev,
      totalPoints: Math.max(0, prev.totalPoints - 10)
    }));

    // Sync to server
    apiCall(`/tasks/${taskId}/uncomplete`, {
      method: 'PUT'
    }).then(res => {
      if (res?.progress) {
        setProgress(prev => ({
          ...prev,
          ...parseProgress(res.progress)
        }));
      }
    }).catch(() => {
      setTasks(previousTasks);
      setProgress(previousProgress);
      toast({
        title: "⚠️ Failed to update task",
        description: "Could not save change to server."
      });
    });
  };

  // 6. Optimistic Delete Task
  const deleteTask = (taskId: string) => {
    const previousTasks = [...tasks];

    setTasks(prev => prev.filter(task => task.id !== taskId));

    apiCall(`/tasks/${taskId}`, {
      method: 'DELETE'
    }).catch(() => {
      // Rollback on failure
      setTasks(previousTasks);
      toast({
        title: "⚠️ Failed to delete task",
        description: "Could not delete task from server."
      });
    });
  };

  const getTodayTasks = () => {
    const isToday = (d: Date) => {
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
    const list = tasks.filter(task => isToday(new Date(task.createdAt)));
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return {
    tasks,
    progress,
    isLoading,
    error,
    addTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    getTodayTasks
  };
}