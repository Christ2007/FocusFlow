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
    createdAt: row.created_at
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
  const rows = db.prepare(
    "SELECT * FROM tasks WHERE substr(created_at, 1, 10) = ? ORDER BY start_time ASC"
  ).all(todayStr);
  return rows.map(rowToTask);
}

export function getProgress() {
  return getProgressRow();
}

export function addTask(taskInput) {
  const db = getDb();
  const id = taskInput.id || crypto.randomUUID();
  const now = new Date().toISOString();

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
    createdAt: taskInput.createdAt || now
  };

  db.prepare(`
    INSERT OR IGNORE INTO tasks (id, name, category, icon, priority, start_time, end_time, completed, completed_at, points, notes, tags, subtasks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    task.id, task.name, task.category, task.icon, task.priority,
    task.startTime, task.endTime, task.completed ? 1 : 0, task.completedAt,
    task.points, task.notes, JSON.stringify(task.tags), JSON.stringify(task.subtasks),
    task.createdAt
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
      points = ?, notes = ?, tags = ?, subtasks = ?
    WHERE id = ?
  `).run(
    updated.name, updated.category, updated.icon, updated.priority,
    updated.startTime, updated.endTime, updated.completed ? 1 : 0,
    updated.completedAt || null,
    updated.points, updated.notes || '',
    JSON.stringify(updated.tags || []),
    JSON.stringify(updated.subtasks || []),
    id
  );

  return updated;
}

export function completeTask(id) {
  const db = getDb();

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!row) return null;

  const task = rowToTask(row);
  if (task.completed) {
    return { task, pointsEarned: 0, progress: getProgressRow(), newBadges: [] };
  }

  const completedAt = new Date().toISOString();
  const pointsEarned = task.points || 10;

  const txn = db.transaction(() => {
    // Mark task completed
    db.prepare('UPDATE tasks SET completed = 1, completed_at = ? WHERE id = ?')
      .run(completedAt, id);

    // Read current progress
    const progress = getProgressRow();
    let newTotalPoints = (progress.totalPoints || 0) + pointsEarned;

    // Streak calculation (same logic as original taskStore.js)
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

    // Badge checks (same logic as original taskStore.js)
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
      updatedProgress: {
        streakDays,
        totalPoints: newTotalPoints,
        lastActiveDate: todayStr,
        badges
      }
    };
  });

  const { newBadges, updatedProgress } = txn();

  task.completed = true;
  task.completedAt = completedAt;

  return {
    task,
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
        INSERT OR IGNORE INTO tasks (id, name, category, icon, priority, start_time, end_time, completed, completed_at, points, notes, tags, subtasks, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          createdAt
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
