import { useState } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES, TASK_ICONS } from '@/types/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock } from 'lucide-react';

interface QuickTaskEntryProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
}

export function QuickTaskEntry({ onAddTask }: QuickTaskEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [taskData, setTaskData] = useState({
    name: '',
    category: 'focus' as TaskCategory,
    icon: '🎯',
    startTime: '',
    endTime: '',
    priority: 'medium' as Task['priority']
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Form submitted with data:', taskData);
    
    if (!taskData.name.trim()) {
      console.log('Validation failed: Task name is required');
      return;
    }

    // Auto-fill times if missing
    let finalTaskData = { ...taskData };
    if (!finalTaskData.startTime || !finalTaskData.endTime) {
      const currentTime = getCurrentTime();
      finalTaskData.startTime = finalTaskData.startTime || currentTime;
      finalTaskData.endTime = finalTaskData.endTime || getEndTime(finalTaskData.startTime);
    }

    console.log('Calling onAddTask with:', finalTaskData);
    onAddTask(finalTaskData);
    
    // Reset form
    setTaskData({
      name: '',
      category: 'focus',
      icon: '🎯',
      startTime: '',
      endTime: '',
      priority: 'medium'
    });
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
    date.setHours(parseInt(hours), parseInt(minutes));
    date.setHours(date.getHours() + 1); // Default 1 hour duration
    return date.toTimeString().slice(0, 5);
  };

  if (!isExpanded) {
    return (
      <Card className="p-3 sm:p-4 border-dashed border-2 border-primary/30 hover:border-primary/50 transition-colors">
        <Button
          onClick={() => {
            console.log('Expanding form');
            setIsExpanded(true);
            const currentTime = getCurrentTime();
            setTaskData(prev => ({
              ...prev,
              startTime: currentTime,
              endTime: getEndTime(currentTime)
            }));
          }}
          variant="ghost"
          className="w-full h-12 sm:h-14 text-muted-foreground hover:text-primary text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          <span className="hidden sm:inline">Add a new task...</span>
          <span className="sm:hidden">Add task...</span>
        </Button>
      </Card>
    );
  }

  const iconOptions = Object.entries(TASK_ICONS).filter(([key, icon]) => {
    // Filter icons based on selected category
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
    <Card className="p-3 sm:p-4 animate-slide-up">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Task Name */}
        <Input
          placeholder="What do you want to accomplish?"
          value={taskData.name}
          onChange={(e) => {
            console.log('Task name changed:', e.target.value);
            setTaskData(prev => ({ ...prev, name: e.target.value }));
          }}
          className="text-sm sm:text-base h-11 sm:h-12"
          autoFocus
        />

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
                    <span className="text-lg">{icon}</span>
                    <span className="capitalize">{key}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Start Time</label>
            <Input
              type="time"
              value={taskData.startTime}
              onChange={(e) => {
                const startTime = e.target.value;
                console.log('Start time changed:', startTime);
                setTaskData(prev => ({ 
                  ...prev, 
                  startTime,
                  endTime: prev.endTime || getEndTime(startTime)
                }));
              }}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">End Time</label>
            <Input
              type="time"
              value={taskData.endTime}
              onChange={(e) => {
                console.log('End time changed:', e.target.value);
                setTaskData(prev => ({ ...prev, endTime: e.target.value }));
              }}
            />
          </div>
        </div>

        {/* Priority */}
        <Select 
          value={taskData.priority} 
          onValueChange={(value: Task['priority']) => setTaskData(prev => ({ ...prev, priority: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            type="button" 
            className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-medium" 
            disabled={!taskData.name.trim()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Add Task button clicked', { 
                disabled: !taskData.name.trim(),
                taskData 
              });
              handleSubmit();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="h-11 sm:h-12 px-3 sm:px-4 text-sm sm:text-base"
            onClick={() => setIsExpanded(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}