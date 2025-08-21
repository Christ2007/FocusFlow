import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true,
    maxlength: [200, 'Task name cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['focus', 'energy', 'creative', 'rest'],
    default: 'focus'
  },
  icon: {
    type: String,
    required: true,
    default: '🎯'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  points: {
    type: Number,
    default: 10
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  // For recurring tasks
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'], 
      default: 'daily' 
    },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }] // 0 = Sunday, 6 = Saturday
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, completed: 1 });
taskSchema.index({ userId: 1, startTime: 1 });

// Virtual for task duration in minutes
taskSchema.virtual('duration').get(function() {
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
});

// Method to mark task as completed
taskSchema.methods.markCompleted = function() {
  this.completed = true;
  this.completedAt = new Date();
  return this.save();
};

// Method to mark task as incomplete
taskSchema.methods.markIncomplete = function() {
  this.completed = false;
  this.completedAt = null;
  return this.save();
};

// Static method to get today's tasks for a user
taskSchema.statics.getTodayTasks = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  return this.find({
    userId,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ startTime: 1 });
};

// Static method to get user's task statistics
taskSchema.statics.getUserStats = async function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const [todayStats, totalStats] = await Promise.all([
    this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          points: { $sum: { $cond: ['$completed', '$points', 0] } }
        }
      }
    ]),
    this.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          completed: true
        }
      },
      {
        $group: {
          _id: null,
          totalCompleted: { $sum: 1 },
          totalPoints: { $sum: '$points' }
        }
      }
    ])
  ]);
  
  const todayData = todayStats[0] || { total: 0, completed: 0, points: 0 };
  const totalData = totalStats[0] || { totalCompleted: 0, totalPoints: 0 };
  
  return {
    today: todayData,
    total: totalData
  };
};

export default mongoose.model('Task', taskSchema);
