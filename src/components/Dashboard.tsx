import { useState, useEffect } from 'react';
import { TaskCard } from './TaskCard';
import { ProgressBar } from './ProgressBar';
import { QuickTaskEntry } from './QuickTaskEntry';
import { FocusTimer } from './FocusTimer';
import { BadgeShowcase } from './BadgeShowcase';
import { TaskSearchFilter, TaskFilterState } from './TaskSearchFilter';
import { AnalyticsPage } from './AnalyticsPage';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/tasks';
import { Sun, Moon, AlertCircle, BarChart3, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { 
    tasks,
    progress, 
    isLoading,
    error,
    addTask, 
    updateTask,
    completeTask, 
    uncompleteTask, 
    deleteTask, 
    logFocusSession,
    getTodayTasks 
  } = useTaskManager();

  // Navigation state (Dashboard vs Analytics) with URL synchronization
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/analytics')) {
      return 'analytics';
    }
    return 'dashboard';
  });

  // Task selection for Focus Timer
  const [selectedFocusTaskId, setSelectedFocusTaskId] = useState<string | null>(null);

  // Search & Filter state
  const [filters, setFilters] = useState<TaskFilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    recurrence: 'all'
  });

  // Sync browser URL with view
  const navigateTo = (view: 'dashboard' | 'analytics') => {
    setCurrentView(view);
    const newPath = view === 'analytics' ? '/analytics' : '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/analytics')) {
        setCurrentView('analytics');
      } else {
        setCurrentView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const todayTasks = getTodayTasks();
  const upcomingTodayTasks = todayTasks.filter(task => !task.completed);
  const completedTodayTasks = todayTasks.filter(task => task.completed);

  // Determine if active filtering is in effect
  const isFiltering =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.recurrence !== 'all';

  // Apply search & filters across all tasks
  const filteredTasks = tasks.filter((task: Task) => {
    // 1. Search by name, notes, or tags
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const nameMatch = task.name.toLowerCase().includes(q);
      const notesMatch = (task.notes || '').toLowerCase().includes(q);
      const tagsMatch = (task.tags || []).some(t => t.toLowerCase().includes(q));
      if (!nameMatch && !notesMatch && !tagsMatch) return false;
    }

    // 2. Status filter
    if (filters.status === 'active' && task.completed) return false;
    if (filters.status === 'completed' && !task.completed) return false;

    // 3. Priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

    // 4. Category filter
    if (filters.category !== 'all' && task.category !== filters.category) return false;

    // 5. Recurrence filter
    const isRecurring = task.recurrenceType && task.recurrenceType !== 'none';
    if (filters.recurrence === 'recurring' && !isRecurring) return false;
    if (filters.recurrence === 'onetime' && isRecurring) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0"
              onClick={() => navigateTo('dashboard')}
            >
              <span className="w-2 h-2 rounded-full bg-primary" />
              <h1 className="hidden sm:block text-base sm:text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
                FocusFlow
              </h1>
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className={cn(
                  "px-2 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 flex-shrink-0",
                  currentView === 'dashboard'
                    ? "bg-accent text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Tasks
              </button>
              <button
                type="button"
                onClick={() => navigateTo('analytics')}
                className={cn(
                  "px-2 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 flex-shrink-0",
                  currentView === 'analytics'
                    ? "bg-accent text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <span className="hidden md:inline text-xs sm:text-sm font-medium text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error} - using local state until connection is restored.</span>
          </div>
        )}

        {/* View Switch: Dashboard vs Analytics Page.
            The dashboard stays mounted (only hidden) so the focus timer and
            quick-entry state survive navigation between views. */}
        {currentView === 'analytics' && <AnalyticsPage />}
        <div className={cn(
          // Tablet proportions (7/5 split, 32px gutter) are kept at every large
          // width so desktop matches the roomier tablet layout.
          "grid grid-cols-1 lg:grid-cols-12 gap-8",
          currentView === 'analytics' && "hidden"
        )}>
            {/* Main Content — Tasks core focus */}
            <div className="lg:col-span-7 space-y-6 min-w-0">
              {/* Quick Add Task */}
              <section>
                <QuickTaskEntry onAddTask={addTask} />
              </section>

              {/* Search & Filter Bar */}
              <section>
                <TaskSearchFilter
                  filters={filters}
                  onFilterChange={setFilters}
                />
              </section>

              {/* Tasks List */}
              <section className="space-y-3.5">
                {isFiltering ? (
                  /* Filtered view */
                  <div>
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-semibold tracking-tight text-foreground">
                          Filtered Tasks
                        </h2>
                        <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tabular-nums">
                          {filteredTasks.length}
                        </span>
                      </div>
                    </div>

                    {filteredTasks.length === 0 ? (
                      <div className="py-8 px-5 rounded-xl border border-border/70 bg-card/30 text-center space-y-2">
                        <p className="text-sm font-medium text-foreground">No tasks match your filters</p>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting or resetting your search term and filters.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters({
                            search: '',
                            status: 'all',
                            priority: 'all',
                            category: 'all',
                            recurrence: 'all'
                          })}
                          className="mt-2 text-xs"
                        >
                          Clear all filters
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onComplete={() => completeTask(task.id)}
                            onUncomplete={() => uncompleteTask(task.id)}
                            onDelete={() => deleteTask(task.id)}
                            onUpdate={updateTask}
                            onSelectForFocus={(t) => setSelectedFocusTaskId(t.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Today's Tasks View */
                  <div>
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-semibold tracking-tight text-foreground">
                          Today's Tasks
                        </h2>
                        <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tabular-nums">
                          {upcomingTodayTasks.length}
                        </span>
                      </div>
                      {completedTodayTasks.length > 0 && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {completedTodayTasks.length} completed
                        </span>
                      )}
                    </div>

                    {isLoading && todayTasks.length === 0 ? (
                      <div className="py-6 px-5 sm:px-6 rounded-xl border border-border/70 bg-card/30 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground animate-pulse">Loading tasks...</p>
                      </div>
                    ) : todayTasks.length === 0 ? (
                      <div className="py-7 px-6 sm:px-8 rounded-xl border border-border/70 bg-card/30 sm:flex sm:items-center sm:justify-between gap-4 sm:gap-8">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground tracking-tight">
                            No tasks scheduled for today
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Use the quick entry above to plan your priorities.
                          </p>
                        </div>
                        <div className="mt-3 sm:mt-0 flex-shrink-0">
                          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
                            Queue clear
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Upcoming Tasks */}
                        {upcomingTodayTasks.length > 0 && (
                          <div className="space-y-2">
                            {upcomingTodayTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={() => completeTask(task.id)}
                                onUncomplete={() => uncompleteTask(task.id)}
                                onDelete={() => deleteTask(task.id)}
                                onUpdate={updateTask}
                                onSelectForFocus={(t) => setSelectedFocusTaskId(t.id)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Completed Tasks */}
                        {completedTodayTasks.length > 0 && (
                          <div className="space-y-2 pt-6 border-t border-border/60 mt-6">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1">
                              Completed Today ({completedTodayTasks.length})
                            </h3>
                            {completedTodayTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={() => completeTask(task.id)}
                                onUncomplete={() => uncompleteTask(task.id)}
                                onDelete={() => deleteTask(task.id)}
                                onUpdate={updateTask}
                                onSelectForFocus={(t) => setSelectedFocusTaskId(t.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar — Editorial Layout with Focus Session as Priority */}
            <div className="min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 lg:col-span-5">
              {/* Focus Session — Visual Anchor */}
              <div className="md:col-span-2 lg:col-span-1 rounded-xl border border-border/70 bg-card/40 p-4 sm:p-6 shadow-card">
                <FocusTimer
                  tasks={tasks}
                  selectedTaskId={selectedFocusTaskId}
                  onSelectTask={setSelectedFocusTaskId}
                  onLogSession={logFocusSession}
                />
              </div>

              {/* Daily Progress — Editorial Section */}
              <div className="border-t border-border/60 pt-5">
                <ProgressBar progress={progress} />
              </div>

              {/* Milestones — Editorial Section */}
              <div className="border-t border-border/60 pt-5">
                <BadgeShowcase badges={progress.badges} />
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}