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
    streakDays: { type: Number, default: 1 },
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActiveDate = new Date(this.progress.lastActiveDate);
  const lastActiveDay = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('Updating streak:', { 
    today: today.toDateString(), 
    lastActiveDay: lastActiveDay.toDateString(), 
    yesterday: yesterday.toDateString(), 
    currentStreak: this.progress.streakDays 
  });
  
  // Check if already active today
  if (today.getTime() === lastActiveDay.getTime()) {
    console.log('Already active today, no streak change');
    return false; // No change needed
  }
  
  // Check if last active was yesterday (consecutive)
  if (yesterday.getTime() === lastActiveDay.getTime()) {
    this.progress.streakDays += 1;
    console.log('Consecutive day, streak incremented to:', this.progress.streakDays);
  } else {
    // First time or streak broken, set to 1
    this.progress.streakDays = 1;
    console.log('Streak set to 1 (first time or broken streak)');
  }
  
  this.progress.lastActiveDate = now;
  console.log('Updated lastActiveDate to:', this.progress.lastActiveDate);
  return true; // Indicates streak was updated
};

export default mongoose.model('User', userSchema);
