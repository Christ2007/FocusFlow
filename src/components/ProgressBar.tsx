import { UserProgress } from '@/types/tasks';
import { Card } from '@/components/ui/card';
import { Trophy, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: UserProgress;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const { todayProgress, streakDays, totalPoints } = progress;
  const completionRate = todayProgress.total > 0 
    ? (todayProgress.completed / todayProgress.total) * 100 
    : 0;

  return (
    <Card className="p-4 sm:p-6 bg-gradient-success shadow-success animate-slide-up">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-primary-foreground/80" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
              {todayProgress.completed}
            </div>
            <div className="text-xs sm:text-sm text-primary-foreground/80">
              Completed Today
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-5 w-5 text-primary-foreground/80" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
              {streakDays}
            </div>
            <div className="text-xs sm:text-sm text-primary-foreground/80">
              Day Streak
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 text-primary-foreground/80" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
              {totalPoints}
            </div>
            <div className="text-xs sm:text-sm text-primary-foreground/80">
              Total Points
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm text-primary-foreground/90">
            <span>Daily Progress</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-white/90 rounded-full transition-all duration-700 ease-out",
                completionRate === 100 && "animate-pulse-glow"
              )}
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
          
          <div className="text-xs text-primary-foreground/70 text-center">
            {todayProgress.completed} of {todayProgress.total} tasks complete
          </div>
        </div>

        {/* Motivational Message */}
        {completionRate === 100 && todayProgress.total > 0 && (
          <div className="text-center p-2 sm:p-3 bg-white/10 rounded-lg animate-bounce-in">
            <div className="text-base sm:text-lg font-bold text-primary-foreground mb-1">
              🎉 Perfect Day! 
            </div>
            <div className="text-xs sm:text-sm text-primary-foreground/80">
              You've completed all your tasks! Amazing work! 🌟
            </div>
          </div>
        )}
        
        {completionRate >= 50 && completionRate < 100 && (
          <div className="text-center p-2 sm:p-3 bg-white/10 rounded-lg">
            <div className="text-xs sm:text-sm text-primary-foreground/90 font-medium">
              🔥 Great momentum! Keep it up!
            </div>
          </div>
        )}
        
        {completionRate < 50 && todayProgress.total > 0 && (
          <div className="text-center p-2 sm:p-3 bg-white/10 rounded-lg">
            <div className="text-xs sm:text-sm text-primary-foreground/90 font-medium">
              💪 You've got this! One task at a time.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}