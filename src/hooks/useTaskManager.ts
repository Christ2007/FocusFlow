import { useState, useEffect, useCallback } from 'react';
import { Task, UserProgress, Badge } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';

// Mobile-compatible UUID generator
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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

// Shapes of data coming back from the API (dates are ISO strings over the wire)
type ApiTask = Omit<Partial<Task>, 'createdAt' | 'completedAt'> & {
  _id?: string;
  createdAt: string | Date;
  completedAt?: string | Date | null;
};

type ApiBadge = Omit<Badge, 'earnedAt'> & { earnedAt: string | Date };

interface ApiProgress {
  streakDays?: number;
  totalPoints?: number;
  badges?: ApiBadge[];
}

const localTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Shared "today" filtering used by both the daily-progress effect and getTodayTasks
function filterTodayTasks(tasks: Task[]): Task[] {
  const now = new Date();
  const todayStr = localTodayStr();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const isToday = (d?: Date) => {
    if (!d) return false;
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  return tasks.filter(task => {
    // Completed today
    if (task.completed && task.completedAt && isToday(task.completedAt)) {
      return true;
    }
    // Explicitly due today
    if (task.dueDate === todayStr) {
      return true;
    }
    // Created today without due date
    if (!task.dueDate && isToday(task.createdAt)) {
      return true;
    }
    // Active and overdue
    if (!task.completed) {
      if (task.dueDate && task.dueDate < todayStr) return true;
      const taskCreatedDate = new Date(task.createdAt);
      if (taskCreatedDate < startOfToday) return true;
    }
    return false;
  });
}

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
  const parseTasks = (apiTasks: ApiTask[]): Task[] => {
    return apiTasks.map((task) => ({
      ...task,
      id: task.id || task._id || generateUUID(),
      name: task.name || '',
      category: task.category || 'focus',
      icon: task.icon || '🎯',
      startTime: task.startTime || '09:00',
      endTime: task.endTime || '10:00',
      completed: task.completed ?? false,
      priority: task.priority || 'medium',
      points: task.points || 10,
      notes: task.notes || '',
      tags: Array.isArray(task.tags) ? task.tags : [],
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
      estimatedDuration: Number(task.estimatedDuration) || 0,
      actualDuration: Number(task.actualDuration) || 0,
      recurrenceType: task.recurrenceType || 'none',
      recurrenceRule: task.recurrenceRule || {},
      dueDate: task.dueDate || null,
      parentTaskId: task.parentTaskId || null,
      createdAt: new Date(task.createdAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined
    }));
  };

  // Parse progress from API response
  const parseProgress = (apiProgress: ApiProgress): Partial<UserProgress> => {
    return {
      streakDays: apiProgress.streakDays || 0,
      totalPoints: apiProgress.totalPoints || 0,
      badges: (apiProgress.badges || []).map((badge) => ({
        ...badge,
        earnedAt: new Date(badge.earnedAt)
      }))
    };
  };

  // One-time localStorage migration (conservative: only when server is empty)
  const attemptMigration = useCallback(async () => {
    if (localStorage.getItem(MIGRATION_KEY) === 'true') return;

    const savedTasks = localStorage.getItem(OLD_STORAGE_KEYS.TASKS);
    const savedProgress = localStorage.getItem(OLD_STORAGE_KEYS.PROGRESS);

    if (!savedTasks && !savedProgress) return;

    try {
      const migrationData: { tasks?: unknown[]; progress?: unknown } = {};

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
        localStorage.setItem(MIGRATION_KEY, 'true');
      }
    } catch (e) {
      console.warn('localStorage migration failed, will retry next load:', e);
    }
  }, [apiCall]);

  // Load authoritative state from server
  const loadFromServer = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await attemptMigration();

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
    } catch (err) {
      console.error('Failed to load from server:', err);
      setError('Could not connect to server');
      toast({
        title: "⚠️ Connection Error",
        description: "Could not load data from server. Please check your connection."
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, attemptMigration, toast]);

  // 1. Initial load
  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  // 2. Calculate today's progress whenever tasks update
  useEffect(() => {
    const todayTasks = filterTodayTasks(tasks);
    const completedTasks = todayTasks.filter(task => task.completed);
    const completed = completedTasks.length;
    const total = todayTasks.length;
    const points = completedTasks.reduce((sum, task) => sum + (task.points || 10), 0);

    setProgress(prev => ({
      ...prev,
      todayProgress: { completed, total, points }
    }));
  }, [tasks]);

  // 3. Optimistic Add Task
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const taskId = generateUUID();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newTask: Task = {
      ...taskData,
      id: taskId,
      completed: false,
      createdAt: now,
      dueDate: taskData.dueDate || todayStr,
      estimatedDuration: taskData.estimatedDuration || 0,
      actualDuration: taskData.actualDuration || 0,
      recurrenceType: taskData.recurrenceType || 'none',
      recurrenceRule: taskData.recurrenceRule || {},
      notes: taskData.notes || '',
      tags: taskData.tags || []
    };

    // Instant local state update
    setTasks(prev => [newTask, ...prev]);

    toast({
      title: "Task Added! 🎯",
      description: `"${newTask.name}" is ready to tackle!`
    });

    // Sync to server
    apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...newTask, id: taskId })
    }).catch(() => {
      // Rollback on failure
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: "⚠️ Failed to save task",
        description: "The task could not be saved to the server."
      });
    });
  };

  // 4. Update Task (optimistic)
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task));

    apiCall(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }).catch(() => {
      setTasks(previousTasks);
      toast({
        title: "⚠️ Update Failed",
        description: "Could not update task on the server."
      });
    });
  };

  // 5. Optimistic Complete Task
  const completeTask = (taskId: string) => {
    const previousTasks = [...tasks];
    const previousProgress = { ...progress };
    const taskPoints = tasks.find(t => t.id === taskId)?.points ?? 10;

    // Instant local state update
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && !task.completed) {
        return { ...task, completed: true, completedAt: new Date() };
      }
      return task;
    }));

    setProgress(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + taskPoints
    }));

    toast({
      title: "Amazing! 🎉",
      description: `+${taskPoints} points for completing the task!`
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
      if (res?.nextTask) {
        const next = parseTasks([res.nextTask])[0];
        setTasks(prev => {
          if (prev.some(t => t.id === next.id)) return prev;
          return [next, ...prev];
        });
        toast({
          title: "Recurring Task Advanced 🔄",
          description: `Next occurrence scheduled for ${next.dueDate || 'next cycle'}.`
        });
      }
      if (res?.newBadges?.length > 0) {
        res.newBadges.forEach((badge: ApiBadge) => {
          toast({
            title: `New Badge Earned! ${badge.icon}`,
            description: `${badge.name}: ${badge.description}`
          });
        });
      }
    }).catch(() => {
      setTasks(previousTasks);
      setProgress(previousProgress);
      toast({
        title: "⚠️ Failed to complete task",
        description: "Could not save completion to server."
      });
    });
  };

  // 6. Optimistic Uncomplete Task
  const uncompleteTask = (taskId: string) => {
    const previousTasks = [...tasks];
    const previousProgress = { ...progress };
    const taskPoints = tasks.find(t => t.id === taskId)?.points ?? 10;

    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.completed) {
        return { ...task, completed: false, completedAt: undefined };
      }
      return task;
    }));

    setProgress(prev => ({
      ...prev,
      totalPoints: Math.max(0, prev.totalPoints - taskPoints)
    }));

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

  // 7. Optimistic Delete Task
  const deleteTask = (taskId: string) => {
    const previousTasks = [...tasks];

    setTasks(prev => prev.filter(task => task.id !== taskId));

    apiCall(`/tasks/${taskId}`, {
      method: 'DELETE'
    }).catch(() => {
      setTasks(previousTasks);
      toast({
        title: "⚠️ Failed to delete task",
        description: "Could not delete task from server."
      });
    });
  };

  // 8. Log focus session and accumulate actual time
  const logFocusSession = async (taskId: string | null, durationMinutes: number) => {
    if (durationMinutes <= 0) return;
    try {
      const res = await apiCall('/focus-sessions', {
        method: 'POST',
        body: JSON.stringify({
          taskId,
          durationMinutes,
          startedAt: new Date(Date.now() - durationMinutes * 60000).toISOString(),
          completedAt: new Date().toISOString()
        })
      });

      if (taskId) {
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              actualDuration: res?.session?.task ? res.session.task.actualDuration : (t.actualDuration || 0) + durationMinutes
            };
          }
          return t;
        }));
      }

      return res;
    } catch (err) {
      console.error('Failed to log focus session:', err);
    }
  };

  const getTodayTasks = () => {
    return filterTodayTasks(tasks).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return {
    tasks,
    progress,
    isLoading,
    error,
    addTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    logFocusSession,
    getTodayTasks,
    refreshTasks: loadFromServer
  };
}