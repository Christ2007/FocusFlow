import { UserProgress } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: UserProgress;
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  const { todayProgress, streakDays, totalPoints } = progress;
  const completionRate = todayProgress.total > 0 
    ? (todayProgress.completed / todayProgress.total) * 100 
    : 0;

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Daily Progress
        </h3>
        <span className="text-xs font-semibold tabular-nums text-primary">
          {Math.round(completionRate)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full bg-primary rounded-full transition-all duration-500 ease-out"
          )}
          style={{ width: `${Math.min(completionRate, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border/50">
        <div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight">
            {todayProgress.completed}
            <span className="text-muted-foreground font-normal text-sm">/{todayProgress.total}</span>
          </div>
          <div className="text-[11px] font-medium text-muted-foreground mt-0.5">Completed</div>
        </div>
        
        <div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight">
            {streakDays}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground mt-0.5">Day streak</div>
        </div>
        
        <div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight">
            {totalPoints}
          </div>
          <div className="text-[11px] font-medium text-muted-foreground mt-0.5">Points</div>
        </div>
      </div>
    </section>
  );
}