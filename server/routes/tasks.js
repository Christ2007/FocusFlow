import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  getAllTasks,
  getTodayTasks,
  getProgress,
  addTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  recordFocusSession
} from '../taskStore.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks and progress
// @access  Public
router.get('/', (req, res) => {
  try {
    const { date, completed, category } = req.query;
    let tasks = getAllTasks();

    if (date) {
      const targetDate = new Date(date);
      const isTargetDay = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return (
          d.getFullYear() === targetDate.getFullYear() &&
          d.getMonth() === targetDate.getMonth() &&
          d.getDate() === targetDate.getDate()
        );
      };
      tasks = tasks.filter(t => isTargetDay(t.createdAt));
    }

    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      tasks = tasks.filter(t => t.completed === isCompleted);
    }

    if (category) {
      tasks = tasks.filter(t => t.category === category);
    }

    const progress = getProgress();

    res.json({
      success: true,
      tasks,
      progress
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting tasks'
    });
  }
});

// @route   GET /api/tasks/today
// @desc    Get today's tasks and stats
// @access  Public
router.get('/today', (req, res) => {
  try {
    const tasks = getTodayTasks();
    const progress = getProgress();
    const completedToday = tasks.filter(t => t.completed).length;

    res.json({
      success: true,
      tasks,
      stats: {
        today: {
          total: tasks.length,
          completed: completedToday,
          points: completedToday * 10
        },
        total: {
          totalCompleted: progress.totalPoints ? Math.floor(progress.totalPoints / 10) : 0,
          totalPoints: progress.totalPoints || 0
        }
      },
      progress
    });
  } catch (error) {
    console.error('Get today tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting today\'s tasks'
    });
  }
});

// @route   GET /api/tasks/progress
// @desc    Get progress details
// @access  Public
router.get('/progress', (req, res) => {
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

// @route   GET /api/tasks/milestones
// @desc    Get milestones/badges
// @access  Public
router.get('/milestones', (req, res) => {
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

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Public
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),
  body('category')
    .optional()
    .isIn(['focus', 'energy', 'creative', 'rest'])
    .withMessage('Category must be one of: focus, energy, creative, rest'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('recurrenceType')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly'])
    .withMessage('Recurrence type must be one of: none, daily, weekly, monthly'),
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = addTask(req.body);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Public
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),
  body('category')
    .optional()
    .isIn(['focus', 'energy', 'creative', 'rest'])
    .withMessage('Category must be one of: focus, energy, creative, rest'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('recurrenceType')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly'])
    .withMessage('Recurrence type must be one of: none, daily, weekly, monthly')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
});

// Helper handler for task completion (supports both PUT and POST)
const handleCompleteTask = (req, res) => {
  try {
    const result = completeTask(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task completed successfully',
      task: result.task,
      nextTask: result.nextTask || null,
      pointsEarned: result.pointsEarned,
      progress: result.progress,
      newBadges: result.newBadges
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing task'
    });
  }
};

// @route   POST /api/tasks/:id/focus-session
// @desc    Log a focus session attributed to a task
// @access  Public
router.post('/:id/focus-session', (req, res) => {
  try {
    const { durationMinutes, startedAt, completedAt } = req.body;
    const session = recordFocusSession({
      taskId: req.params.id,
      durationMinutes,
      startedAt,
      completedAt
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Record task focus session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error recording task focus session'
    });
  }
});

// @route   PUT/POST /api/tasks/:id/complete
// @desc    Mark task as complete
// @access  Public
router.put('/:id/complete', handleCompleteTask);
router.post('/:id/complete', handleCompleteTask);

// Helper handler for uncomplete (supports both PUT and POST)
const handleUncompleteTask = (req, res) => {
  try {
    const result = uncompleteTask(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task marked as incomplete',
      task: result.task,
      pointsDeducted: result.pointsDeducted,
      progress: result.progress
    });
  } catch (error) {
    console.error('Uncomplete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uncompleting task'
    });
  }
};

// @route   PUT/POST /api/tasks/:id/uncomplete
// @desc    Mark task as incomplete
// @access  Public
router.put('/:id/uncomplete', handleUncompleteTask);
router.post('/:id/uncomplete', handleUncompleteTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Public
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
});

export default router;
