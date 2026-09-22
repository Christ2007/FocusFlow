import crypto from 'crypto';
import { getDb } from './database.js';

// Convert a database row to a task object matching the API/frontend format
function rowToTask(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    icon: row.icon,
    priority: row.priority,
    startTime: row.start_time,
    endTime: row.end_time,
    completed: row.completed === 1,
    completedAt: row.completed_at || null,
    points: row.points,
    notes: row.notes || '',
    tags: JSON.parse(row.tags || '[]'),
    subtasks: JSON.parse(row.subtasks || '[]'),
    createdAt: row.created_at,
    estimatedDuration: row.estimated_duration || 0,
    actualDuration: row.actual_duration || 0,
    recurrenceType: row.recurrence_type || 'none',
    recurrenceRule: JSON.parse(row.recurrence_rule || '{}'),
    dueDate: row.due_date || null,
    parentTaskId: row.parent_task_id || null
  };
}

// Read the singleton progress row
function getProgressRow() {
  const db = getDb();
  const row = db.prepare('SELECT * FROM progress WHERE id = 1').get();
  return {
    streakDays: row.streak_days,
    totalPoints: row.total_points,
    lastActiveDate: row.last_active_date,
    badges: JSON.parse(row.badges || '[]')
  };
}

export function readData() {
  return {
    tasks: getAllTasks(),
    progress: getProgress()
  };
}

export function getAllTasks() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  return rows.map(rowToTask);
}

export function getTodayTasks() {
  const db = getDb();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const rows = db.prepare(`
    SELECT * FROM tasks
    WHERE (
      due_date = ? OR
      (due_date IS NULL AND substr(created_at, 1, 10) = ?) OR
      (completed = 1 AND substr(completed_at, 1, 10) = ?) OR
      (completed = 0 AND (due_date < ? OR (due_date IS NULL AND substr(created_at, 1, 10) < ?)))
    )
    ORDER BY start_time ASC
  `).all(todayStr, todayStr, todayStr, todayStr, todayStr);
  return rows.map(rowToTask);
}

export function getProgress() {
  return getProgressRow();
}

export function addTask(taskInput) {
  const db = getDb();
  const id = taskInput.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  const task = {
    id,
    name: (taskInput.name || '').trim(),
    category: taskInput.category || 'focus',
    icon: taskInput.icon || '🎯',
    priority: taskInput.priority || 'medium',
    startTime: taskInput.startTime || '09:00',
    endTime: taskInput.endTime || '10:00',
    completed: false,
    completedAt: null,
    points: taskInput.points || 10,
    notes: taskInput.notes || '',
    tags: taskInput.tags || [],
    subtasks: taskInput.subtasks || [],
    createdAt: taskInput.createdAt || now,
    estimatedDuration: Number(taskInput.estimatedDuration) || 0,
    actualDuration: Number(taskInput.actualDuration) || 0,
    recurrenceType: taskInput.recurrenceType || 'none',
    recurrenceRule: taskInput.recurrenceRule || {},
    dueDate: taskInput.dueDate || todayStr,
    parentTaskId: taskInput.parentTaskId || null
  };

  db.prepare(`
    INSERT OR IGNORE INTO tasks (
      id, name, category, icon, priority, start_time, end_time,
      completed, completed_at, points, notes, tags, subtasks, created_at,
      estimated_duration, actual_duration, recurrence_type, recurrence_rule, due_date, parent_task_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    task.id, task.name, task.category, task.icon, task.priority,
    task.startTime, task.endTime, task.completed ? 1 : 0, task.completedAt,
    task.points, task.notes, JSON.stringify(task.tags), JSON.stringify(task.subtasks),
    task.createdAt,
    task.estimatedDuration, task.actualDuration,
    task.recurrenceType, JSON.stringify(task.recurrenceRule),
    task.dueDate, task.parentTaskId
  );

  return task;
}

export function updateTask(id, updates) {
  const db = getDb();

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!row) return null;

  const current = rowToTask(row);
  const updated = { ...current, ...updates, id };

  db.prepare(`
    UPDATE tasks SET
      name = ?, category = ?, icon = ?, priority = ?,
      start_time = ?, end_time = ?, completed = ?, completed_at = ?,
      points = ?, notes = ?, tags = ?, subtasks = ?,
      estimated_duration = ?, actual_duration = ?,
      recurrence_type = ?, recurrence_rule = ?,
      due_date = ?, parent_task_id = ?
    WHERE id = ?
  `).run(
    updated.name, updated.category, updated.icon, updated.priority,
    updated.startTime, updated.endTime, updated.completed ? 1 : 0,
    updated.completedAt || null,
    updated.points, updated.notes || '',
    JSON.stringify(updated.tags || []),
    JSON.stringify(updated.subtasks || []),
    updated.estimatedDuration || 0,
    updated.actualDuration || 0,
    updated.recurrenceType || 'none',
    JSON.stringify(updated.recurrenceRule || {}),
    updated.dueDate || null,
    updated.parentTaskId || null,
    id
  );

  return updated;
}

// Calculate the next occurrence date (YYYY-MM-DD) for a recurring task
export function calculateNextOccurrence(task) {
  const todayStr = new Date().toISOString().split('T')[0];
  const baseDateStr = task.dueDate || (task.createdAt ? task.createdAt.slice(0, 10) : todayStr);
  // Do not schedule earlier than tomorrow
  const referenceStr = baseDateStr < todayStr ? todayStr : baseDateStr;
  const parts = referenceStr.split('-');
  const base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  if (task.recurrenceType === 'daily') {
    const next = new Date(base);
    next.setDate(next.getDate() + 1);
    return formatDate(next);
  }

  if (task.recurrenceType === 'weekly') {
    const daysOfWeek = task.recurrenceRule?.daysOfWeek;
    if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
      const currentDay = base.getDay(); // 0 = Sunday, 1 = Monday, ...
      const sorted = [...new Set(daysOfWeek)].sort((a, b) => a - b);
      const nextDay = sorted.find(d => d > currentDay);
      const next = new Date(base);
      if (nextDay !== undefined) {
        next.setDate(next.getDate() + (nextDay - currentDay));
      } else {
        // Wrap to first scheduled day of next week
        const firstDay = sorted[0];
        next.setDate(next.getDate() + (7 - currentDay + firstDay));
      }
      return formatDate(next);
    } else {
      const next = new Date(base);
      next.setDate(next.getDate() + 7);
      return formatDate(next);
    }
  }

  if (task.recurrenceType === 'monthly') {
    const next = new Date(base);
    const dayOfMonth = task.recurrenceRule?.dayOfMonth || base.getDate();
    next.setMonth(next.getMonth() + 1);
    const maxDays = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(dayOfMonth, maxDays));
    return formatDate(next);
  }

  return null;
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function completeTask(id) {
  const db = getDb();

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!row) return null;

  const task = rowToTask(row);
  if (task.completed) {
    return { task, pointsEarned: 0, progress: getProgressRow(), newBadges: [], nextTask: null };
  }

  const completedAt = new Date().toISOString();
  const pointsEarned = task.points || 10;

  const txn = db.transaction(() => {
    // Mark task completed
    db.prepare('UPDATE tasks SET completed = 1, completed_at = ? WHERE id = ?')
      .run(completedAt, id);

    // If recurring, advance to next occurrence
    let nextTask = null;
    if (task.recurrenceType && task.recurrenceType !== 'none') {
      const nextDateStr = calculateNextOccurrence(task);
      if (nextDateStr) {
        const rootParentId = task.parentTaskId || task.id;
        // Check if an uncompleted occurrence already exists for this root series on or after nextDateStr
        const existingNext = db.prepare(`
          SELECT id FROM tasks
          WHERE (id = ? OR parent_task_id = ?)
            AND completed = 0
            AND due_date = ?
        `).get(rootParentId, rootParentId, nextDateStr);

        if (!existingNext) {
          const nextId = crypto.randomUUID();
          const resetSubtasks = (task.subtasks || []).map(st => ({
            ...st,
            id: crypto.randomUUID(),
            completed: false
          }));

          nextTask = {
            id: nextId,
            name: task.name,
            category: task.category,
            icon: task.icon,
            priority: task.priority,
            startTime: task.startTime,
            endTime: task.endTime,
            completed: false,
            completedAt: null,
            points: task.points,
            notes: task.notes,
            tags: task.tags,
            subtasks: resetSubtasks,
            createdAt: `${nextDateStr}T${task.startTime || '09:00'}:00.000Z`,
            estimatedDuration: task.estimatedDuration,
            actualDuration: 0,
            recurrenceType: task.recurrenceType,
            recurrenceRule: task.recurrenceRule,
            dueDate: nextDateStr,
            parentTaskId: rootParentId
          };

          db.prepare(`
            INSERT INTO tasks (
              id, name, category, icon, priority, start_time, end_time,
              completed, completed_at, points, notes, tags, subtasks, created_at,
              estimated_duration, actual_duration, recurrence_type, recurrence_rule, due_date, parent_task_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            nextTask.id, nextTask.name, nextTask.category, nextTask.icon, nextTask.priority,
            nextTask.startTime, nextTask.endTime, 0, null,
            nextTask.points, nextTask.notes, JSON.stringify(nextTask.tags), JSON.stringify(nextTask.subtasks),
            nextTask.createdAt,
            nextTask.estimatedDuration, 0,
            nextTask.recurrenceType, JSON.stringify(nextTask.recurrenceRule),
            nextTask.dueDate, nextTask.parentTaskId
          );
        }
      }
    }

    // Read current progress
    const progress = getProgressRow();
    let newTotalPoints = (progress.totalPoints || 0) + pointsEarned;

    // Streak calculation
    const todayStr = new Date().toISOString().split('T')[0];
    let streakDays = progress.streakDays;
    const lastActive = progress.lastActiveDate;

    if (!lastActive) {
      streakDays = 1;
    } else if (lastActive !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActive === yesterdayStr) {
        streakDays = (streakDays || 0) + 1;
      } else {
        streakDays = 1;
      }
    }

    // Badge checks
    const newBadges = [];
    const completedTodayCount = db.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE completed = 1 AND substr(completed_at, 1, 10) = ?"
    ).get(todayStr).count;

    let badges = progress.badges || [];

    if (completedTodayCount >= 1 && !badges.some(b => b.id === 'first_task')) {
      const badge = {
        id: 'first_task',
        name: 'Getting Started',
        description: 'Completed your first task!',
        icon: '🌟',
        type: 'bronze',
        earnedAt: new Date().toISOString()
      };
      badges = [...badges, badge];
      newBadges.push(badge);
    }

    if (completedTodayCount >= 5 && !badges.some(b => b.id === 'daily_achiever')) {
      const badge = {
        id: 'daily_achiever',
        name: 'Daily Achiever',
        description: 'Completed 5 tasks in one day!',
        icon: '🏆',
        type: 'gold',
        earnedAt: new Date().toISOString()
      };
      badges = [...badges, badge];
      newBadges.push(badge);
    }

    db.prepare(`
      UPDATE progress SET
        total_points = ?, streak_days = ?, last_active_date = ?, badges = ?
      WHERE id = 1
    `).run(newTotalPoints, streakDays, todayStr, JSON.stringify(badges));

    return {
      newBadges,
      nextTask,
      updatedProgress: {
        streakDays,
        totalPoints: newTotalPoints,
        lastActiveDate: todayStr,
        badges
      }
    };
  });

  const { newBadges, nextTask, updatedProgress } = txn();

  task.completed = true;
  task.completedAt = completedAt;

  return {
    task,
    nextTask,
    pointsEarned,
    progress: updatedProgress,
    newBadges
  };
}

export function uncompleteTask(id) {
  const db = getDb();

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!row) return null;

  const task = rowToTask(row);
  if (!task.completed) {
    return { task, pointsDeducted: 0, progress: getProgressRow() };
  }

  const pointsDeducted = task.points || 10;

  const txn = db.transaction(() => {
    db.prepare('UPDATE tasks SET completed = 0, completed_at = NULL WHERE id = ?')
      .run(id);

    // If this was a recurring task, clean up future unstarted occurrences spawned from it
    if (task.recurrenceType && task.recurrenceType !== 'none') {
      const rootParentId = task.parentTaskId || task.id;
      const taskDate = task.dueDate || (task.createdAt ? task.createdAt.slice(0, 10) : '');
      if (taskDate) {
        db.prepare(`
          DELETE FROM tasks
          WHERE parent_task_id = ?
            AND completed = 0
            AND due_date > ?
        `).run(rootParentId, taskDate);
      }
    }

    const progress = getProgressRow();
    const newTotalPoints = Math.max(0, (progress.totalPoints || 0) - pointsDeducted);

    db.prepare('UPDATE progress SET total_points = ? WHERE id = 1')
      .run(newTotalPoints);

    return {
      streakDays: progress.streakDays,
      totalPoints: newTotalPoints,
      lastActiveDate: progress.lastActiveDate,
      badges: progress.badges
    };
  });

  const updatedProgress = txn();

  task.completed = false;
  task.completedAt = null;

  return {
    task,
    pointsDeducted,
    progress: updatedProgress
  };
}

export function deleteTask(id) {
  const db = getDb();

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!row) return false;

  const task = rowToTask(row);

  db.transaction(() => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    if (task.completed) {
      const progress = getProgressRow();
      const newTotalPoints = Math.max(0, (progress.totalPoints || 0) - (task.points || 10));
      db.prepare('UPDATE progress SET total_points = ? WHERE id = 1').run(newTotalPoints);
    }
  })();

  return true;
}

export function getTaskCount() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
}

// Record a focus session and optionally attribute time to a task
export function recordFocusSession({ taskId, durationMinutes, startedAt, completedAt }) {
  const db = getDb();
  const id = crypto.randomUUID();
  const dur = Math.max(1, Math.round(durationMinutes || 0));
  const end = completedAt || new Date().toISOString();
  const start = startedAt || new Date(Date.now() - dur * 60000).toISOString();

  return db.transaction(() => {
    db.prepare(`
      INSERT INTO focus_sessions (id, task_id, duration_minutes, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, taskId || null, dur, start, end);

    let updatedTask = null;
    if (taskId) {
      const taskRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
      if (taskRow) {
        const currentActual = taskRow.actual_duration || 0;
        const newActual = currentActual + dur;
        db.prepare('UPDATE tasks SET actual_duration = ? WHERE id = ?').run(newActual, taskId);
        const updatedRow = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
        updatedTask = rowToTask(updatedRow);
      }
    }

    return {
      id,
      taskId: taskId || null,
      durationMinutes: dur,
      startedAt: start,
      completedAt: end,
      task: updatedTask
    };
  })();
}

// Get analytics data for Daily, Weekly, or Monthly
export function getAnalyticsData({ period = 'daily', date }) {
  const db = getDb();
  const today = new Date();
  const todayStr = formatDate(today);
  const targetDateStr = date || todayStr;

  const parts = targetDateStr.split('-');
  const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  if (period === 'daily') {
    // Tasks completed on this day
    const completedTasksRows = db.prepare(`
      SELECT * FROM tasks
      WHERE completed = 1 AND substr(completed_at, 1, 10) = ?
    `).all(targetDateStr);

    // Tasks created on this day
    const createdTasksCount = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE substr(created_at, 1, 10) = ?
    `).get(targetDateStr).count;

    // Focus sessions for this day
    const focusSessionRows = db.prepare(`
      SELECT * FROM focus_sessions
      WHERE substr(started_at, 1, 10) = ?
    `).all(targetDateStr);

    const totalFocusMinutes = focusSessionRows.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    const completedTasks = completedTasksRows.map(rowToTask);
    const tasksCompleted = completedTasks.length;
    const totalPoints = completedTasks.reduce((acc, t) => acc + (t.points || 10), 0);
    const estimatedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimatedDuration || 0), 0);
    const actualMinutes = completedTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);

    const denominator = createdTasksCount > 0 ? createdTasksCount : tasksCompleted;
    const completionRate = denominator > 0 ? Math.min(100, Math.round((tasksCompleted / denominator) * 100)) : 0;

    // Category breakdown of completed tasks
    const categoryMap = { focus: 0, energy: 0, creative: 0, rest: 0 };
    completedTasks.forEach(t => {
      if (categoryMap[t.category] !== undefined) categoryMap[t.category]++;
    });

    // Priority breakdown
    const priorityMap = { low: 0, medium: 0, high: 0 };
    completedTasks.forEach(t => {
      if (priorityMap[t.priority] !== undefined) priorityMap[t.priority]++;
    });

    // Hourly/time comparison chart data
    const timeComparison = completedTasks
      .filter(t => t.estimatedDuration > 0 || t.actualDuration > 0)
      .map(t => ({
        name: t.name.length > 18 ? t.name.slice(0, 16) + '...' : t.name,
        fullName: t.name,
        estimatedMinutes: t.estimatedDuration || 0,
        actualMinutes: t.actualDuration || 0
      }));

    return {
      period: 'daily',
      date: targetDateStr,
      summary: {
        tasksCompleted,
        tasksCreated: createdTasksCount,
        completionRate,
        totalFocusMinutes,
        totalPoints,
        estimatedMinutes,
        actualMinutes
      },
      categoryBreakdown: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
      priorityBreakdown: Object.entries(priorityMap).map(([priority, count]) => ({ priority, count })),
      timeComparison
    };
  }

  if (period === 'weekly') {
    // Calculate Monday of the week
    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ...
    const diffToMonday = (dayOfWeek + 6) % 7; // days since Monday
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - diffToMonday);

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const days = [];
    let totalCompleted = 0;
    let totalCreated = 0;
    let totalPoints = 0;
    let totalEstimated = 0;
    let totalActual = 0;
    let totalFocusMinutes = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = formatDate(d);

      const completedRows = db.prepare(`
        SELECT * FROM tasks
        WHERE completed = 1 AND substr(completed_at, 1, 10) = ?
      `).all(dStr);

      const createdCount = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE substr(created_at, 1, 10) = ?
      `).get(dStr).count;

      const focusMinutes = db.prepare(`
        SELECT SUM(duration_minutes) as sum FROM focus_sessions
        WHERE substr(started_at, 1, 10) = ?
      `).get(dStr).sum || 0;

      const compTasks = completedRows.map(rowToTask);
      const estMin = compTasks.reduce((acc, t) => acc + (t.estimatedDuration || 0), 0);
      const actMin = compTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);
      const pts = compTasks.reduce((acc, t) => acc + (t.points || 10), 0);

      totalCompleted += compTasks.length;
      totalCreated += createdCount;
      totalPoints += pts;
      totalEstimated += estMin;
      totalActual += actMin;
      totalFocusMinutes += focusMinutes;

      days.push({
        day: dayNames[i],
        shortDay: shortDays[i],
        date: dStr,
        completed: compTasks.length,
        created: createdCount,
        focusMinutes,
        estimatedMinutes: estMin,
        actualMinutes: actMin
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const denominator = totalCreated > 0 ? totalCreated : totalCompleted;
    const completionRate = denominator > 0 ? Math.min(100, Math.round((totalCompleted / denominator) * 100)) : 0;

    return {
      period: 'weekly',
      startDate: formatDate(monday),
      endDate: formatDate(sunday),
      summary: {
        tasksCompleted: totalCompleted,
        tasksCreated: totalCreated,
        completionRate,
        totalFocusMinutes,
        totalPoints,
        estimatedMinutes: totalEstimated,
        actualMinutes: totalActual
      },
      dailyBreakdown: days
    };
  }

  if (period === 'monthly') {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayStr = formatDate(firstDay);
    const lastDayStr = formatDate(lastDay);

    const completedTasksRows = db.prepare(`
      SELECT * FROM tasks
      WHERE completed = 1
        AND substr(completed_at, 1, 10) >= ?
        AND substr(completed_at, 1, 10) <= ?
    `).all(firstDayStr, lastDayStr);

    const createdTasksCount = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE substr(created_at, 1, 10) >= ?
        AND substr(created_at, 1, 10) <= ?
    `).get(firstDayStr, lastDayStr).count;

    const totalFocusMinutes = db.prepare(`
      SELECT SUM(duration_minutes) as sum FROM focus_sessions
      WHERE substr(started_at, 1, 10) >= ?
        AND substr(started_at, 1, 10) <= ?
    `).get(firstDayStr, lastDayStr).sum || 0;

    const completedTasks = completedTasksRows.map(rowToTask);
    const totalCompleted = completedTasks.length;
    const totalPoints = completedTasks.reduce((acc, t) => acc + (t.points || 10), 0);
    const estimatedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimatedDuration || 0), 0);
    const actualMinutes = completedTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);

    const denominator = createdTasksCount > 0 ? createdTasksCount : totalCompleted;
    const completionRate = denominator > 0 ? Math.min(100, Math.round((totalCompleted / denominator) * 100)) : 0;

    // Aggregate by day of the month for trend chart
    const daysInMonth = lastDay.getDate();
    const trendData = [];

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dStr = formatDate(d);

      const dayCompleted = completedTasks.filter(t => t.completedAt && t.completedAt.slice(0, 10) === dStr);
      const estMin = dayCompleted.reduce((acc, t) => acc + (t.estimatedDuration || 0), 0);
      const actMin = dayCompleted.reduce((acc, t) => acc + (t.actualDuration || 0), 0);

      trendData.push({
        date: dStr,
        day: dayNum,
        label: `${dayNum}`,
        completed: dayCompleted.length,
        estimatedMinutes: estMin,
        actualMinutes: actMin
      });
    }

    return {
      period: 'monthly',
      year,
      month: month + 1,
      startDate: firstDayStr,
      endDate: lastDayStr,
      summary: {
        tasksCompleted: totalCompleted,
        tasksCreated: createdTasksCount,
        completionRate,
        totalFocusMinutes,
        totalPoints,
        estimatedMinutes,
        actualMinutes
      },
      trendData
    };
  }

  throw new Error(`Unsupported period: ${period}`);
}

export function migrateData(data) {
  const db = getDb();

  // Only migrate if server database is empty
  const taskCount = getTaskCount();
  if (taskCount > 0) {
    return { migrated: false, reason: 'server_has_data' };
  }

  db.transaction(() => {
    // Migrate tasks
    if (Array.isArray(data.tasks)) {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO tasks (
          id, name, category, icon, priority, start_time, end_time,
          completed, completed_at, points, notes, tags, subtasks, created_at,
          estimated_duration, actual_duration, recurrence_type, recurrence_rule, due_date, parent_task_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const task of data.tasks) {
        const createdAt = task.createdAt
          ? (typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toISOString())
          : new Date().toISOString();
        const completedAt = task.completedAt
          ? (typeof task.completedAt === 'string' ? task.completedAt : new Date(task.completedAt).toISOString())
          : null;

        insert.run(
          task.id || crypto.randomUUID(),
          (task.name || '').trim(),
          task.category || 'focus',
          task.icon || '🎯',
          task.priority || 'medium',
          task.startTime || '09:00',
          task.endTime || '10:00',
          task.completed ? 1 : 0,
          completedAt,
          task.points || 10,
          task.notes || '',
          JSON.stringify(task.tags || []),
          JSON.stringify(task.subtasks || []),
          createdAt,
          task.estimatedDuration || 0,
          task.actualDuration || 0,
          task.recurrenceType || 'none',
          JSON.stringify(task.recurrenceRule || {}),
          task.dueDate || createdAt.slice(0, 10),
          task.parentTaskId || null
        );
      }
    }

    // Migrate progress
    if (data.progress) {
      const p = data.progress;
      const badges = (p.badges || []).map(b => ({
        ...b,
        earnedAt: typeof b.earnedAt === 'string' ? b.earnedAt : new Date(b.earnedAt).toISOString()
      }));

      db.prepare(`
        UPDATE progress SET
          streak_days = ?, total_points = ?, last_active_date = ?, badges = ?
        WHERE id = 1
      `).run(
        p.streakDays || 0,
        p.totalPoints || 0,
        p.lastActiveDate || null,
        JSON.stringify(badges)
      );
    }
  })();

  return { migrated: true, taskCount: data.tasks?.length || 0 };
}
