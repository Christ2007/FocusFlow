import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    avatar: { type: String, default: '🧠' },
    timezone: { type: String, default: 'UTC' }
  },
  preferences: {
    focusTime: { type: Number, default: 25 }, // minutes
    breakTime: { type: Number, default: 5 }, // minutes
    dailyGoal: { type: Number, default: 5 }, // tasks per day
    notifications: { type: Boolean, default: true }
  },
  progress: {
    totalPoints: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    badges: [{
      id: String,
      name: String,
      description: String,
      icon: String,
      type: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] },
      earnedAt: { type: Date, default: Date.now }
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update streak method
userSchema.methods.updateStreak = function() {
  const today = new Date().toDateString();
  const lastActive = this.progress.lastActiveDate.toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  if (lastActive === today) {
    // Already active today, no change
    return;
  } else if (lastActive === yesterday) {
    // Consecutive day, increment streak
    this.progress.streakDays += 1;
  } else {
    // Streak broken, reset to 1
    this.progress.streakDays = 1;
  }
  
  this.progress.lastActiveDate = new Date();
};

export default mongoose.model('User', userSchema);
