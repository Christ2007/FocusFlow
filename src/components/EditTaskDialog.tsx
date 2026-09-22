import { useState } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES, TASK_ICONS, RecurrenceType } from '@/types/tasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
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

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSave
}: EditTaskDialogProps) {
  if (!task) return null;

  return (
    <EditTaskForm
      key={task.id}
      task={task}
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

function EditTaskForm({
  task,
  open,
  onOpenChange,
  onSave
}: EditTaskDialogProps & { task: Task }) {
  const [name, setName] = useState(task.name);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [icon, setIcon] = useState(task.icon);
  const [priority, setPriority] = useState<Task['priority']>(task.priority);
  const [startTime, setStartTime] = useState(task.startTime);
  const [endTime, setEndTime] = useState(task.endTime);
  const [notes, setNotes] = useState(task.notes || '');
  const [tags, setTags] = useState((task.tags || []).join(', '));
  const [estimatedDuration, setEstimatedDuration] = useState<number>(task.estimatedDuration || 0);
  const [actualDuration, setActualDuration] = useState<number>(task.actualDuration || 0);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(task.recurrenceType || 'none');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    task.recurrenceRule?.daysOfWeek || [1, 2, 3, 4, 5]
  );
  const [customEst, setCustomEst] = useState(
    [0, 15, 30, 45, 60].includes(task.estimatedDuration || 0) ? '' : String(task.estimatedDuration || '')
  );

  const toggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayVal));
      }
    } else {
      setSelectedDays([...selectedDays, dayVal]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const parsedTags = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const estMinutes = customEst ? (parseInt(customEst, 10) || 0) : estimatedDuration;

    onSave(task.id, {
      name: name.trim(),
      category,
      icon,
      priority,
      startTime,
      endTime,
      notes: notes.trim(),
      tags: parsedTags,
      estimatedDuration: estMinutes,
      actualDuration: Number(actualDuration) || 0,
      recurrenceType,
      recurrenceRule: recurrenceType === 'weekly' ? { daysOfWeek: selectedDays } : {}
    });

    onOpenChange(false);
  };

  const iconOptions = Object.entries(TASK_ICONS).filter(([key]) => {
    if (category === 'focus') return ['study', 'work', 'reading', 'coding', 'planning'].includes(key);
    if (category === 'energy') return ['exercise', 'running', 'sports', 'walking', 'yoga'].includes(key);
    if (category === 'creative') return ['art', 'music', 'writing', 'design', 'cooking'].includes(key);
    if (category === 'rest') return ['meditation', 'sleep', 'relaxing', 'socializing', 'entertainment'].includes(key);
    return false;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Name */}
          <div className="space-y-1">
            <label className="font-medium text-foreground">Task Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name"
              className="text-sm h-9"
            />
          </div>

          {/* Category & Icon */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Category</label>
              <Select
                value={category}
                onValueChange={(val: TaskCategory) => {
                  setCategory(val);
                  setIcon(TASK_CATEGORIES[val].defaultIcon);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-1.5">
                        <span>{cat.defaultIcon}</span>
                        <span>{cat.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Icon</label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(([key, ic]) => (
                    <SelectItem key={key} value={ic}>
                      <span className="flex items-center gap-1.5">
                        <span>{ic}</span>
                        <span className="capitalize">{key}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Times & Priority */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Start</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">End</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Priority</label>
              <Select value={priority} onValueChange={(v: Task['priority']) => setPriority(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">Recurrence</label>
              <Select
                value={recurrenceType}
                onValueChange={(val: RecurrenceType) => setRecurrenceType(val)}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrenceType === 'weekly' && (
              <div className="flex items-center justify-between gap-1 pt-1">
                <span className="text-[11px] text-muted-foreground">Repeat on:</span>
                <div className="flex gap-1">
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
              </div>
            )}
          </div>

          {/* Estimated Duration & Actual Duration */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <label className="font-medium text-foreground block">Estimated Duration</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setEstimatedDuration(mins);
                    setCustomEst('');
                  }}
                  className={cn(
                    "h-7 rounded border text-[11px] font-medium transition-colors",
                    estimatedDuration === mins && !customEst
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mins === 0 ? 'None' : `${mins}m`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-muted-foreground">Custom min:</span>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 75"
                value={customEst}
                onChange={(e) => {
                  setCustomEst(e.target.value);
                  setEstimatedDuration(0);
                }}
                className="h-7 text-xs w-24"
              />
              <span className="text-[11px] text-muted-foreground ml-auto">
                Actual logged: <strong className="text-foreground">{actualDuration}m</strong>
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1 pt-1 border-t border-border/60">
            <label className="font-medium text-foreground">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Task details, instructions, links..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="font-medium text-foreground">Tags (comma separated)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, project, health..."
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
