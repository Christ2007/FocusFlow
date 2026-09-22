import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import task routes and store
import taskRoutes from './routes/tasks.js';
import { initDatabase, DB_PATH } from './database.js';
import { getAllTasks, getProgress, migrateData, getAnalyticsData, recordFocusSession } from './taskStore.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize SQLite database on startup
initDatabase();

// Security middleware with relaxed CSP for local/Docker production assets
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration - allow all origins for local/Docker productivity access
app.use(cors({ origin: true, credentials: true }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FocusFlow API is running',
    databasePath: DB_PATH,
    timestamp: new Date().toISOString()
  });
});

// Full state endpoint
app.get('/api/state', (req, res) => {
  try {
    const tasks = getAllTasks();
    const progress = getProgress();
    res.json({
      success: true,
      tasks,
      progress
    });
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting state'
    });
  }
});

// Progress endpoint
app.get('/api/progress', (req, res) => {
  try {
    const progress = getProgress();
    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting progress'
    });
  }
});

// Milestones endpoint
app.get('/api/milestones', (req, res) => {
  try {
    const progress = getProgress();
    res.json({
      success: true,
      milestones: progress.badges || [],
      badges: progress.badges || []
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting milestones'
    });
  }
});

// One-time localStorage migration endpoint
app.post('/api/migrate', (req, res) => {
  try {
    const result = migrateData(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed'
    });
  }
});

// API routes
app.use('/api/tasks', taskRoutes);

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  try {
    const { period, date } = req.query;
    const data = getAnalyticsData({ period, date });
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error getting analytics'
    });
  }
});

// Focus sessions endpoint
app.post('/api/focus-sessions', (req, res) => {
  try {
    const { taskId, durationMinutes, startedAt, completedAt } = req.body;
    const session = recordFocusSession({
      taskId,
      durationMinutes,
      startedAt,
      completedAt
    });
    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Record focus session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error recording focus session'
    });
  }
});

// Serve frontend static build if present
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`📦 Serving static frontend from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback for all remaining GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 FocusFlow server running on http://${HOST}:${PORT}`);
  console.log(`📁 Database location: ${DB_PATH}`);
});

export default app;
