import { TaskCard } from './TaskCard';
import { ProgressBar } from './ProgressBar';
import { QuickTaskEntry } from './QuickTaskEntry';
import { FocusTimer } from './FocusTimer';
import { BadgeShowcase } from './BadgeShowcase';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { 
    progress, 
    isLoading,
    error,
    addTask, 
    completeTask, 
    uncompleteTask, 
    deleteTask, 
    getTodayTasks 
  } = useTaskManager();

  const todayTasks = getTodayTasks();
  const upcomingTasks = todayTasks.filter(task => !task.completed);
  const completedTasks = todayTasks.filter(task => task.completed);

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              FocusFlow
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
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
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error} - using local state until connection is restored.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10">
          {/* Main Content — Tasks core focus (visually dominant) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Quick Add Task */}
            <section>
              <QuickTaskEntry onAddTask={addTask} />
            </section>

            {/* Today's Tasks */}
            <section className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Today's Tasks
                  </h2>
                  <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tabular-nums">
                    {upcomingTasks.length}
                  </span>
                </div>
                {completedTasks.length > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {completedTasks.length} completed
                  </span>
                )}
              </div>

              {isLoading && todayTasks.length === 0 ? (
                <div className="py-6 px-5 sm:px-6 rounded-xl border border-border/70 bg-card/30 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground animate-pulse">Loading tasks...</p>
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="py-6 px-5 sm:px-6 rounded-xl border border-border/70 bg-card/30 sm:flex sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">
                      No tasks scheduled for today
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Use the quick entry above to plan your priorities.
                    </p>
                  </div>
                  <div className="mt-2.5 sm:mt-0 flex-shrink-0">
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
                      Queue clear
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Upcoming Tasks */}
                  {upcomingTasks.length > 0 && (
                    <div className="space-y-2">
                      {upcomingTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={() => completeTask(task.id)}
                          onUncomplete={() => uncompleteTask(task.id)}
                          onDelete={() => deleteTask(task.id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {completedTasks.length > 0 && (
                    <div className="space-y-2 pt-6 border-t border-border/60 mt-6">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1">
                        Completed Today ({completedTasks.length})
                      </h3>
                      {completedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={() => completeTask(task.id)}
                          onUncomplete={() => uncompleteTask(task.id)}
                          onDelete={() => deleteTask(task.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar — Editorial Layout with Focus Session as Priority */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Focus Session — Visual Anchor */}
            <div className="rounded-xl border border-border/70 bg-card/40 p-5 sm:p-6 shadow-card">
              <FocusTimer />
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