import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'focusflow.db');

let db;

export function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'focus',
      icon TEXT NOT NULL DEFAULT '🎯',
      priority TEXT NOT NULL DEFAULT 'medium',
      start_time TEXT NOT NULL DEFAULT '09:00',
      end_time TEXT NOT NULL DEFAULT '10:00',
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      points INTEGER NOT NULL DEFAULT 10,
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      subtasks TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      streak_days INTEGER NOT NULL DEFAULT 0,
      total_points INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT,
      badges TEXT NOT NULL DEFAULT '[]'
    );

    INSERT OR IGNORE INTO progress (id, streak_days, total_points, last_active_date, badges)
    VALUES (1, 0, 0, NULL, '[]');

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      duration_minutes INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );
  `);

  // Safe, non-destructive column migrations for existing databases
  const taskColumns = db.pragma('table_info(tasks)').map(c => c.name);
  if (!taskColumns.includes('estimated_duration')) {
    db.exec('ALTER TABLE tasks ADD COLUMN estimated_duration INTEGER NOT NULL DEFAULT 0');
  }
  if (!taskColumns.includes('actual_duration')) {
    db.exec('ALTER TABLE tasks ADD COLUMN actual_duration INTEGER NOT NULL DEFAULT 0');
  }
  if (!taskColumns.includes('recurrence_type')) {
    db.exec("ALTER TABLE tasks ADD COLUMN recurrence_type TEXT NOT NULL DEFAULT 'none'");
  }
  if (!taskColumns.includes('recurrence_rule')) {
    db.exec("ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT NOT NULL DEFAULT '{}'");
  }
  if (!taskColumns.includes('due_date')) {
    db.exec('ALTER TABLE tasks ADD COLUMN due_date TEXT');
  }
  if (!taskColumns.includes('parent_task_id')) {
    db.exec('ALTER TABLE tasks ADD COLUMN parent_task_id TEXT');
  }

  // Create useful indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);
  `);

  console.log('📦 Database initialized at:', DB_PATH);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export { DB_PATH };
