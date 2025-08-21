import { TaskCard } from './TaskCard';
import { ProgressBar } from './ProgressBar';
import { QuickTaskEntry } from './QuickTaskEntry';
import { FocusTimer } from './FocusTimer';
import { BadgeShowcase } from './BadgeShowcase';
import { useTaskManager } from '@/hooks/useTaskManager';
import { Button } from '@/components/ui/button';
import { CalendarDays, Brain, Zap } from 'lucide-react';

export function Dashboard() {
  const { 
    progress, 
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">
                ADHD Focus Hub
              </h1>
              <p className="text-muted-foreground">
                Transform your day into an adventure! 🚀
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <CalendarDays className="h-4 w-4 mr-2" />
                Today: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <ProgressBar progress={progress} />

            {/* Quick Add Task */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-energy" />
                <h2 className="text-xl font-semibold">Quick Add</h2>
              </div>
              <QuickTaskEntry onAddTask={addTask} />
            </div>

            {/* Today's Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-focus" />
                  <h2 className="text-xl font-semibold">Today's Tasks</h2>
                  <span className="text-sm text-muted-foreground">
                    ({upcomingTasks.length} remaining)
                  </span>
                </div>
              </div>

              {todayTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium mb-2">Ready to start your day?</h3>
                  <p className="text-sm">Add your first task above to begin your productivity journey!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Upcoming Tasks */}
                  {upcomingTasks.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Up Next ({upcomingTasks.length})
                      </h3>
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
                    <div className="space-y-3 pt-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Completed Today ({completedTasks.length}) 🎉
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
            </div>
          </div>

          {/* Right Column - Tools & Achievements */}
          <div className="space-y-6">
            {/* Focus Timer */}
            <FocusTimer />

            {/* Badge Showcase */}
            <BadgeShowcase badges={progress.badges} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gradient-focus p-4 rounded-lg text-focus-foreground">
                <div className="text-2xl font-bold">{progress.totalPoints}</div>
                <div className="text-sm opacity-90">Total Points</div>
              </div>
              
              <div className="bg-gradient-energy p-4 rounded-lg text-energy-foreground">
                <div className="text-2xl font-bold">{progress.streakDays}</div>
                <div className="text-sm opacity-90">Day Streak</div>
              </div>
            </div>

            {/* ADHD Tips */}
            <div className="bg-card p-4 rounded-lg border border-border shadow-card">
              <h3 className="font-semibold mb-3 text-primary">💡 ADHD Focus Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Break large tasks into smaller steps</li>
                <li>• Use the Pomodoro timer for focus sessions</li>
                <li>• Celebrate every completed task!</li>
                <li>• Take regular movement breaks</li>
                <li>• Set realistic daily goals</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}