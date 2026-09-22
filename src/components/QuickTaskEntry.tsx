import { useState } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES, TASK_ICONS, RecurrenceType } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickTaskEntryProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
}

const WEEKDAYS = [
  { label: 'M', full: 'Mon', value: 1 },
  { label: 'T', full: 'Tue', value: 2 },
  { label: 'W', full: 'Wed', value: 3 },
  { label: 'T', full: 'Thu', value: 4 },
  { label: 'F', full: 'Fri', value: 5 },
  { label: 'S', full: 'Sat', value: 6 },
  { label: 'S', full: 'Sun', value: 0 }
];

export function QuickTaskEntry({ onAddTask }: QuickTaskEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [taskData, setTaskData] = useState({
    name: '',
    category: 'focus' as TaskCategory,
    icon: '🎯',
    startTime: '',
    endTime: '',
    priority: 'medium' as Task['priority'],
    estimatedDuration: 0,
    recurrenceType: 'none' as RecurrenceType,
    notes: '',
    tags: ''
  });
  const [customEst, setCustomEst] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayVal));
      }
    } else {
      setSelectedDays([...selectedDays, dayVal]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!taskData.name.trim()) return;

    // Auto-fill times if missing
    let finalStartTime = taskData.startTime;
    let finalEndTime = taskData.endTime;
    if (!finalStartTime || !finalEndTime) {
      const currentTime = getCurrentTime();
      finalStartTime = finalStartTime || currentTime;
      finalEndTime = finalEndTime || getEndTime(finalStartTime);
    }

    const estMinutes = customEst ? (parseInt(customEst, 10) || 0) : taskData.estimatedDuration;
    const parsedTags = taskData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onAddTask({
      name: taskData.name.trim(),
      category: taskData.category,
      icon: taskData.icon,
      startTime: finalStartTime,
      endTime: finalEndTime,
      priority: taskData.priority,
      estimatedDuration: estMinutes,
      actualDuration: 0,
      recurrenceType: taskData.recurrenceType,
      recurrenceRule: taskData.recurrenceType === 'weekly' ? { daysOfWeek: selectedDays } : {},
      notes: taskData.notes.trim(),
      tags: parsedTags,
      subtasks: []
    });
    
    // Reset form
    setTaskData({
      name: '',
      category: 'focus',
      icon: '🎯',
      startTime: '',
      endTime: '',
      priority: 'medium',
      estimatedDuration: 0,
      recurrenceType: 'none',
      notes: '',
      tags: ''
    });
    setCustomEst('');
    setShowMore(false);
    setIsExpanded(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const getEndTime = (startTime: string) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    date.setHours(date.getHours() + 1); // Default 1 hour duration
    return date.toTimeString().slice(0, 5);
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsExpanded(true);
          const currentTime = getCurrentTime();
          setTaskData(prev => ({
            ...prev,
            startTime: currentTime,
            endTime: getEndTime(currentTime)
          }));
        }}
        className="w-full h-12 sm:h-13 px-4 rounded-xl border border-border/80 bg-card/50 hover:bg-card hover:border-primary/50 shadow-card hover:shadow-task flex items-center justify-between transition-all duration-150 group text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors duration-150">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-150">
            Add a task for today...
          </span>
        </div>
        <span className="hidden sm:inline-flex text-xs font-medium text-muted-foreground/70 bg-muted/60 px-2 py-0.5 rounded border border-border/40">
          + Add
        </span>
      </button>
    );
  }

  const iconOptions = Object.entries(TASK_ICONS).filter(([key]) => {
    if (taskData.category === 'focus') {
      return ['study', 'work', 'reading', 'coding', 'planning'].includes(key);
    }
    if (taskData.category === 'energy') {
      return ['exercise', 'running', 'sports', 'walking', 'yoga'].includes(key);
    }
    if (taskData.category === 'creative') {
      return ['art', 'music', 'writing', 'design', 'cooking'].includes(key);
    }
    if (taskData.category === 'rest') {
      return ['meditation', 'sleep', 'relaxing', 'socializing', 'entertainment'].includes(key);
    }
    return false;
  });

  return (
    <div className="rounded-xl border border-border/90 bg-card p-4 sm:p-5 shadow-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Name */}
        <div>
          <Input
            placeholder="What do you want to accomplish?"
            value={taskData.name}
            onChange={(e) => setTaskData(prev => ({ ...prev, name: e.target.value }))}
            className="text-sm sm:text-base font-medium h-11 sm:h-12 px-3.5"
            autoFocus
          />
        </div>

        {/* Category and Icon Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select 
            value={taskData.category} 
            onValueChange={(value: TaskCategory) => {
              const category = TASK_CATEGORIES[value];
              setTaskData(prev => ({ 
                ...prev, 
                category: value,
                icon: category.defaultIcon 
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{category.defaultIcon}</span>
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={taskData.icon} 
            onValueChange={(value) => setTaskData(prev => ({ ...prev, icon: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Icon" />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map(([key, icon]) => (
                <SelectItem key={key} value={icon}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="capitalize">{key}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Range & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start</label>
            <Input
              type="time"
              value={taskData.startTime}
              onChange={(e) => {
                const startTime = e.target.value;
                setTaskData(prev => ({ 
                  ...prev, 
                  startTime,
                  endTime: prev.endTime || getEndTime(startTime)
                }));
              }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End</label>
            <Input
              type="time"
              value={taskData.endTime}
              onChange={(e) => {
                setTaskData(prev => ({ ...prev, endTime: e.target.value }));
              }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
            <Select 
              value={taskData.priority} 
              onValueChange={(value: Task['priority']) => setTaskData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recurrence & Estimated Duration row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
          {/* Recurrence */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Recurrence</label>
            <Select
              value={taskData.recurrenceType}
              onValueChange={(val: RecurrenceType) => setTaskData(prev => ({ ...prev, recurrenceType: val }))}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Recurrence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time Task</SelectItem>
                <SelectItem value="daily">Daily Repeat</SelectItem>
                <SelectItem value="weekly">Weekly Repeat</SelectItem>
                <SelectItem value="monthly">Monthly Repeat</SelectItem>
              </SelectContent>
            </Select>

            {taskData.recurrenceType === 'weekly' && (
              <div className="flex items-center gap-1 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">On:</span>
                {WEEKDAYS.map(w => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => toggleDay(w.value)}
                    className={cn(
                      "w-6 h-6 rounded text-[11px] font-semibold flex items-center justify-center transition-colors",
                      selectedDays.includes(w.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title={w.full}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Estimated Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Estimated Duration</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setTaskData(prev => ({
                      ...prev,
                      estimatedDuration: prev.estimatedDuration === mins && !customEst ? 0 : mins
                    }));
                    setCustomEst('');
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded border text-xs font-medium transition-colors",
                    taskData.estimatedDuration === mins && !customEst
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mins}m
                </button>
              ))}
              <Input
                type="number"
                min="1"
                placeholder="Custom"
                value={customEst}
                onChange={(e) => {
                  setCustomEst(e.target.value);
                  setTaskData(prev => ({ ...prev, estimatedDuration: 0 }));
                }}
                className="h-7 text-xs w-18 px-2"
              />
            </div>
          </div>
        </div>

        {/* Optional Notes & Tags collapsible */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-2 hover:underline"
          >
            {showMore ? '− Hide notes & tags' : '+ Add notes & tags'}
          </button>

          {showMore && (
            <div className="space-y-2 mt-2 pt-2 border-t border-border/50 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1">Notes</label>
                <Input
                  placeholder="Task notes, reminders, or details..."
                  value={taskData.notes}
                  onChange={(e) => setTaskData(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">Tags (comma separated)</label>
                <Input
                  placeholder="focus, project, work..."
                  value={taskData.tags}
                  onChange={(e) => setTaskData(prev => ({ ...prev, tags: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <Button 
            type="submit" 
            className="flex-1 h-10 text-sm font-semibold" 
            disabled={!taskData.name.trim()}
          >
            Add Task
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="h-10 px-4 text-sm font-medium"
            onClick={() => setIsExpanded(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}