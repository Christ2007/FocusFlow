import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for authenticated user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, completed, category } = req.query;
    let query = { userId: req.user._id };

    // Filter by date
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by completion status
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const tasks = await Task.find(query).sort({ startTime: 1, createdAt: -1 });

    res.json({
      success: true,
      tasks
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
// @desc    Get today's tasks for authenticated user
// @access  Private
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.getTodayTasks(req.user._id);
    const stats = await Task.getUserStats(req.user._id);

    res.json({
      success: true,
      tasks,
      stats
    });
  } catch (error) {
    console.error('Get today tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting today\'s tasks'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', authenticateToken, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task name must be between 1 and 200 characters'),
  body('category')
    .isIn(['focus', 'energy', 'creative', 'rest'])
    .withMessage('Category must be one of: focus, energy, creative, rest'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      userId: req.user._id
    };

    const task = new Task(taskData);
    await task.save();

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
// @access  Private
router.put('/:id', authenticateToken, [
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
    .withMessage('Priority must be one of: low, medium, high')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    Object.assign(task, req.body);
    await task.save();

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

// @route   PUT /api/tasks/:id/complete
// @desc    Mark task as completed
// @access  Private
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.completed) {
      return res.status(400).json({
        success: false,
        message: 'Task is already completed'
      });
    }

    await task.markCompleted();

    // Update user progress
    const user = req.user;
    user.progress.totalPoints += task.points;
    user.updateStreak();
    await user.save();

    // Check for new badges (simplified version)
    const stats = await Task.getUserStats(req.user._id);
    const completedToday = stats.today.completed;

    const newBadges = [];
    
    // First task badge
    if (completedToday === 1 && !user.progress.badges.some(b => b.id === 'first_task')) {
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
    if (completedToday >= 5 && !user.progress.badges.some(b => b.id === 'daily_achiever')) {
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
      user.progress.badges.push(...newBadges);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Task completed successfully',
      task,
      pointsEarned: task.points,
      newBadges
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing task'
    });
  }
});

// @route   PUT /api/tasks/:id/uncomplete
// @desc    Mark task as incomplete
// @access  Private
router.put('/:id/uncomplete', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!task.completed) {
      return res.status(400).json({
        success: false,
        message: 'Task is not completed'
      });
    }

    await task.markIncomplete();

    // Update user progress (subtract points)
    const user = req.user;
    user.progress.totalPoints = Math.max(0, user.progress.totalPoints - task.points);
    await user.save();

    res.json({
      success: true,
      message: 'Task marked as incomplete',
      task,
      pointsDeducted: task.points
    });
  } catch (error) {
    console.error('Uncomplete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uncompleting task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // If task was completed, subtract points from user
    if (task.completed) {
      const user = req.user;
      user.progress.totalPoints = Math.max(0, user.progress.totalPoints - task.points);
      await user.save();
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
