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
  `);

  console.log('📦 Database initialized at:', DB_PATH);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export { DB_PATH };
