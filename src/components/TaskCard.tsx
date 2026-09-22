import { useState } from 'react';
import { Task, TASK_CATEGORIES } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Clock, Repeat, Pencil, Timer } from 'lucide-react';
import { EditTaskDialog } from './EditTaskDialog';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onSelectForFocus?: (task: Task) => void;
}

export function TaskCard({
  task,
  onComplete,
  onUncomplete,
  onDelete,
  onUpdate,
  onSelectForFocus
}: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const category = TASK_CATEGORIES[task.category];
  
  const priorityBorders: Record<string, string> = {
    low: 'border-l-muted-foreground/30',
    medium: 'border-l-energy/60',
    high: 'border-l-destructive/60'
  };

  const isRecurring = task.recurrenceType && task.recurrenceType !== 'none';
  const recurrenceLabel =
    task.recurrenceType === 'daily'
      ? 'Daily'
      : task.recurrenceType === 'weekly'
      ? 'Weekly'
      : task.recurrenceType === 'monthly'
      ? 'Monthly'
      : '';

  const hasTimeEstimate = (task.estimatedDuration ?? 0) > 0 || (task.actualDuration ?? 0) > 0;

  return (
    <>
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
              <div className="flex items-center gap-2 flex-wrap">
                <div className={cn(
                  "text-[15px] sm:text-base font-medium text-foreground leading-snug tracking-[-0.01em]",
                  task.completed && "line-through text-muted-foreground font-normal"
                )}>
                  {task.icon && <span className="mr-2 text-sm select-none opacity-80">{task.icon}</span>}
                  {task.name}
                </div>

                {/* Recurrence Badge */}
                {isRecurring && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded select-none">
                    <Repeat className="h-2.5 w-2.5" />
                    {recurrenceLabel}
                  </span>
                )}
              </div>
              
              {/* Metadata row */}
              <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 mt-1.5 text-xs text-muted-foreground font-medium">
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
                <span className="capitalize">{task.priority}</span>

                {/* Estimated vs Actual Duration */}
                {hasTimeEstimate && (
                  <>
                    <span className="text-border select-none">·</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 tabular-nums",
                        (task.actualDuration || 0) > (task.estimatedDuration || 0) && (task.estimatedDuration || 0) > 0
                          ? "text-energy"
                          : "text-muted-foreground"
                      )}
                      title={`Actual: ${task.actualDuration || 0}m | Estimated: ${task.estimatedDuration || 0}m`}
                    >
                      <Timer className="h-3 w-3" />
                      <span>{task.actualDuration || 0}m</span>
                      {task.estimatedDuration ? <span>/ {task.estimatedDuration}m</span> : null}
                    </span>
                  </>
                )}
              </div>

              {/* Notes preview if any */}
              {task.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                  {task.notes}
                </p>
              )}

              {/* Tags if any */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {task.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] text-muted-foreground/80 bg-muted/60 px-1.5 py-0.2 rounded border border-border/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons — visible on hover / tap */}
            <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {/* Focus button */}
              {onSelectForFocus && !task.completed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectForFocus(task)}
                  aria-label="Focus on this task"
                  title="Focus on this task"
                  className="p-1.5 h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Timer className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Edit button */}
              {onUpdate && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditOpen(true)}
                  aria-label="Edit task"
                  title="Edit task"
                  className="p-1.5 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Delete button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                aria-label="Delete task"
                title="Delete task"
                className="p-1.5 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
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

      {onUpdate && (
        <EditTaskDialog
          task={task}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={onUpdate}
        />
      )}
    </>
  );
}