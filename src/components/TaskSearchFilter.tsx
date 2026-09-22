import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { TASK_CATEGORIES } from '@/types/tasks';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TaskFilterState {
  search: string;
  status: 'all' | 'active' | 'completed';
  priority: 'all' | 'low' | 'medium' | 'high';
  category: 'all' | 'focus' | 'energy' | 'creative' | 'rest';
  recurrence: 'all' | 'recurring' | 'onetime';
}

interface TaskSearchFilterProps {
  filters: TaskFilterState;
  onFilterChange: (filters: TaskFilterState) => void;
  className?: string;
}

export function TaskSearchFilter({
  filters,
  onFilterChange,
  className
}: TaskSearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.priority !== 'all' ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.recurrence !== 'all' ? 1 : 0);

  const handleReset = () => {
    onFilterChange({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      recurrence: 'all'
    });
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Search Bar + Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground select-none" />
          <Input
            type="text"
            placeholder="Search tasks by name, notes, or tags..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-card/60 focus:bg-card border-border/80"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          type="button"
          variant={showFilters || activeFilterCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-9 px-3 text-xs font-medium gap-1.5 flex-shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[10px] font-semibold leading-tight">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Expandable Filter Controls */}
      {showFilters && (
        <div className="p-3 rounded-lg border border-border/80 bg-card/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 animate-in fade-in-50 duration-150">
          {/* Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Status</label>
            <Select
              value={filters.status}
              onValueChange={(val: TaskFilterState['status']) =>
                onFilterChange({ ...filters, status: val })
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Priority</label>
            <Select
              value={filters.priority}
              onValueChange={(val: TaskFilterState['priority']) =>
                onFilterChange({ ...filters, priority: val })
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Category</label>
            <Select
              value={filters.category}
              onValueChange={(val: TaskFilterState['category']) =>
                onFilterChange({ ...filters, category: val })
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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

          {/* Recurrence */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Type</label>
            <Select
              value={filters.recurrence}
              onValueChange={(val: TaskFilterState['recurrence']) =>
                onFilterChange({ ...filters, recurrence: val })
              }
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="recurring">Recurring Only</SelectItem>
                <SelectItem value="onetime">One-time Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
