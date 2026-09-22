import { Task, TASK_CATEGORIES } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onComplete, onUncomplete, onDelete }: TaskCardProps) {
  const category = TASK_CATEGORIES[task.category];
  
  const priorityBorders: Record<string, string> = {
    low: 'border-l-muted-foreground/30',
    medium: 'border-l-energy/60',
    high: 'border-l-destructive/60'
  };

  return (
    <div className={cn(
      "group flex items-start gap-3.5 px-4 py-3 sm:py-3.5 border border-border/70 border-l-[3px] rounded-lg bg-card/50 transition-all duration-150",
      "hover:bg-card hover:border-border hover:shadow-card",
      priorityBorders[task.priority],
      task.completed && "opacity-55 bg-muted/20 hover:bg-muted/30"
    )}>
      {/* Checkbox */}
      <button
        type="button"
        onClick={task.completed ? onUncomplete : onComplete}
        aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
        className={cn(
          "flex-shrink-0 mt-0.5 h-5 w-5 rounded-full border transition-all duration-150 flex items-center justify-center cursor-pointer",
          task.completed
            ? "bg-primary border-primary text-primary-foreground shadow-xs"
            : "border-muted-foreground/50 hover:border-primary hover:bg-primary/5"
        )}
      >
        {task.completed && <Check className="h-3 w-3 stroke-[2.5]" />}
      </button>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={cn(
              "text-[15px] sm:text-base font-medium text-foreground leading-snug tracking-[-0.01em]",
              task.completed && "line-through text-muted-foreground font-normal"
            )}>
              {task.icon && <span className="mr-2 text-sm select-none opacity-80">{task.icon}</span>}
              {task.name}
            </div>
            
            {/* Metadata row */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {task.startTime} – {task.endTime}
              </span>
              <span className="text-border select-none">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  task.category === 'focus' && "bg-focus",
                  task.category === 'energy' && "bg-energy",
                  task.category === 'creative' && "bg-creative",
                  task.category === 'rest' && "bg-primary"
                )} />
                {category.name}
              </span>
              <span className="text-border select-none">·</span>
              <span className="capitalize">{task.priority} priority</span>
            </div>
          </div>

          {/* Delete — visible on hover */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            aria-label="Delete task"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-1 mt-2">
            {task.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={cn(
                  "w-3 h-3 rounded-sm border flex items-center justify-center",
                  subtask.completed && "bg-primary border-primary"
                )}>
                  {subtask.completed && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-sm" />}
                </div>
                <span className={cn(
                  subtask.completed && "line-through"
                )}>
                  {subtask.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}