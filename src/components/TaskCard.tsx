  import { Task, TASK_CATEGORIES } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onComplete, onUncomplete, onDelete }: TaskCardProps) {
  const category = TASK_CATEGORIES[task.category];
  
  const priorityColors = {
    low: 'border-l-muted',
    medium: 'border-l-energy',
    high: 'border-l-destructive'
  };

  return (
    <Card className={cn(
      "p-3 sm:p-4 transition-all duration-300 hover:shadow-task border-l-4 animate-slide-up",
      priorityColors[task.priority],
      task.completed && "bg-accent/50 animate-celebrate"
    )}>
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Task Icon */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-xl",
          `bg-${category.color}/10 border border-${category.color}/20`
        )}>
          {task.icon}
        </div>
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={cn(
              "font-medium text-sm sm:text-base text-foreground truncate",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.name}
            </h3>
            
            {/* Complete/Uncomplete Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={task.completed ? onUncomplete : onComplete}
              className={cn(
                "flex-shrink-0 p-1 h-7 w-7 sm:h-9 sm:w-9",
                task.completed && "text-primary hover:text-primary/80"
              )}
            >
              {task.completed ? (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Circle className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
          
          {/* Time and Category */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="text-xs sm:text-sm">{task.startTime} - {task.endTime}</span>
            </div>
            
            <div className={cn(
              "px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium",
              `bg-${category.color}/10 text-${category.color}`
            )}>
              {category.name}
            </div>
          </div>
          
          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-1 mb-3">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                  <div className={cn(
                    "w-3 h-3 rounded-sm border flex items-center justify-center",
                    subtask.completed && "bg-primary border-primary"
                  )}>
                    {subtask.completed && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                  </div>
                  <span className={cn(
                    subtask.completed && "line-through text-muted-foreground"
                  )}>
                    {subtask.name}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              <span className="hidden sm:inline">Priority: </span>
              <span className="capitalize text-xs">{task.priority}</span>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="p-1 h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {task.completed && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="text-xs text-primary font-medium flex items-center gap-1">
            🎉 +10 points earned!
          </div>
        </div>
      )}
    </Card>
  );
}