import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import {
  DailyAnalyticsResponse,
  WeeklyAnalyticsResponse,
  MonthlyAnalyticsResponse,
  AnalyticsPeriod
} from '@/types/analytics';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [data, setData] = useState<
    DailyAnalyticsResponse | WeeklyAnalyticsResponse | MonthlyAnalyticsResponse | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { apiCall } = useApi();

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Send the browser's UTC offset so day boundaries follow the user's own
      // calendar. The container/server usually runs in UTC, while the dates the
      // user picks are local — without this, anything logged just after local
      // midnight lands on the previous day.
      const tzOffset = -new Date().getTimezoneOffset();
      const res = await apiCall(`/analytics?period=${period}&date=${selectedDate}&tzOffset=${tzOffset}`);
      if (res?.success) {
        setData(res);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Could not load analytics from server.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, period, selectedDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Navigate date period
  const handleShiftPeriod = (direction: 'prev' | 'next') => {
    const parts = selectedDate.split('-');
    const current = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    if (period === 'daily') {
      current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    } else if (period === 'weekly') {
      current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    } else if (period === 'monthly') {
      current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1));
    }

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleResetToToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  };

  // Format date range label for current view
  const getDateRangeLabel = () => {
    if (!data) return selectedDate;
    if (period === 'daily') {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    if (period === 'weekly') {
      const w = data as WeeklyAnalyticsResponse;
      if (!w.startDate || !w.endDate) return selectedDate;
      const s = new Date(w.startDate + 'T00:00:00');
      const e = new Date(w.endDate + 'T00:00:00');
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (period === 'monthly') {
      const m = data as MonthlyAnalyticsResponse;
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), (m.month || parseInt(parts[1], 10)) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return selectedDate;
  };

  // Only trust the payload when it matches the currently selected period,
  // so stale data from a previous period is never rendered as current.
  const summary = data && data.period === period ? data.summary : {
    tasksCompleted: 0,
    tasksCreated: 0,
    completionRate: 0,
    totalFocusMinutes: 0,
    totalPoints: 0,
    estimatedMinutes: 0,
    actualMinutes: 0
  };

  const formatMinutes = (mins: number) => {
    if (!mins || mins <= 0) return '0m';
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    if (hours === 0) return `${remaining}m`;
    if (remaining === 0) return `${hours}h`;
    return `${hours}h ${remaining}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Period Selector & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Productivity Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real performance, focus time, and task duration metrics.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily / Weekly / Monthly Switch */}
          <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
            {(['daily', 'weekly', 'monthly'] as AnalyticsPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                  period === p
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Date Navigator */}
          <div className="inline-flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShiftPeriod('prev')}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={handleResetToToday}
              className="px-2.5 h-9 text-xs font-medium border border-border/80 rounded-md bg-background text-foreground hover:bg-muted/40 transition-colors tabular-nums min-w-[140px] text-center"
              title="Click to reset to today"
            >
              {getDateRangeLabel()}
            </button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShiftPeriod('next')}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Completed */}
        <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight mt-1.5">
            {summary.tasksCompleted}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {summary.tasksCreated} created
          </div>
        </div>

        {/* Completion Rate */}
        <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Rate</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight mt-1.5">
            {summary.completionRate}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            of planned tasks
          </div>
        </div>

        {/* Focus Time */}
        <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Focus Time</span>
            <Clock className="h-4 w-4 text-focus" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight mt-1.5">
            {formatMinutes(summary.totalFocusMinutes)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            in focus sessions
          </div>
        </div>

        {/* Total Points */}
        <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Points</span>
            <Award className="h-4 w-4 text-badge-gold" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight mt-1.5">
            {summary.totalPoints}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            productivity score
          </div>
        </div>

        {/* Estimated Task Time */}
        <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Estimated</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight mt-1.5">
            {formatMinutes(summary.estimatedMinutes)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            planned duration
          </div>
        </div>

        {/* Actual Task Time */}
        <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Actual Time</span>
            <Flame className="h-4 w-4 text-energy" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground tracking-tight mt-1.5">
            {formatMinutes(summary.actualMinutes)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            time spent on tasks
          </div>
        </div>
      </div>

      {/* Visualizations Section */}
      {isLoading ? (
        <div className="py-16 text-center rounded-xl border border-border/70 bg-card/30">
          <p className="text-xs text-muted-foreground animate-pulse">Loading analytics data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {period === 'daily' && data?.period === 'daily' && <DailyAnalyticsView data={data} />}
          {period === 'weekly' && data?.period === 'weekly' && <WeeklyAnalyticsView data={data} />}
          {period === 'monthly' && data?.period === 'monthly' && <MonthlyAnalyticsView data={data} />}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// DAILY ANALYTICS VIEW
// -------------------------------------------------------------
const dailyChartConfig: ChartConfig = {
  count: {
    label: "Completed Tasks",
    color: "hsl(var(--primary))"
  },
  estimatedMinutes: {
    label: "Estimated (min)",
    color: "hsl(var(--focus))"
  },
  actualMinutes: {
    label: "Actual (min)",
    color: "hsl(var(--energy))"
  }
};

function DailyAnalyticsView({ data }: { data: DailyAnalyticsResponse | null }) {
  if (!data) return null;

  const categoryData = data.categoryBreakdown || [];
  const hasCategoryData = categoryData.some(c => c.count > 0);
  const timeData = data.timeComparison || [];
  const hasTimeData = timeData.some(t => t.estimatedMinutes > 0 || t.actualMinutes > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 [&>*]:min-w-0">
      {/* Completed Tasks by Category */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Tasks Completed by Category
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribution across Focus, Energy, Creative, and Rest.
          </p>
        </div>

        {!hasCategoryData ? (
          <EmptyChartState />
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ChartContainer config={dailyChartConfig} className="h-full w-full">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* Estimated vs Actual Time Comparison */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Estimated vs. Actual Duration
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparison for completed tasks with time tracking.
          </p>
        </div>

        {!hasTimeData ? (
          <EmptyChartState message="Not enough duration data for today" />
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ChartContainer config={dailyChartConfig} className="h-full w-full">
              <BarChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  unit="m"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="estimatedMinutes"
                  fill="hsl(var(--focus))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="actualMinutes"
                  fill="hsl(var(--energy))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// WEEKLY ANALYTICS VIEW
// -------------------------------------------------------------
const weeklyChartConfig: ChartConfig = {
  completed: {
    label: "Completed Tasks",
    color: "hsl(var(--primary))"
  },
  created: {
    label: "Created Tasks",
    color: "hsl(var(--muted-foreground))"
  },
  estimatedMinutes: {
    label: "Estimated (min)",
    color: "hsl(var(--focus))"
  },
  actualMinutes: {
    label: "Actual (min)",
    color: "hsl(var(--energy))"
  }
};

function WeeklyAnalyticsView({ data }: { data: WeeklyAnalyticsResponse | null }) {
  if (!data) return null;

  const days = data.dailyBreakdown || [];
  const hasCompletedTasks = days.some(d => d.completed > 0);
  const hasTimeData = days.some(d => d.estimatedMinutes > 0 || d.actualMinutes > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 [&>*]:min-w-0">
      {/* Weekly Activity (Mon - Sun) */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Tasks Completed (Monday – Sunday)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily task completion across the week.
            </p>
          </div>
        </div>

        {!hasCompletedTasks ? (
          <EmptyChartState message="Not enough completed task data for this week" />
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ChartContainer config={weeklyChartConfig} className="h-full w-full">
              <BarChart data={days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="shortDay"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="completed"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* Weekly Estimated vs Actual Time Comparison */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Estimated vs. Actual Duration by Day
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total minutes estimated versus actual time spent per day.
          </p>
        </div>

        {!hasTimeData ? (
          <EmptyChartState message="Not enough duration data for this week" />
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ChartContainer config={weeklyChartConfig} className="h-full w-full">
              <BarChart data={days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="shortDay"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  unit="m"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="estimatedMinutes"
                  fill="hsl(var(--focus))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="actualMinutes"
                  fill="hsl(var(--energy))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MONTHLY ANALYTICS VIEW
// -------------------------------------------------------------
const monthlyChartConfig: ChartConfig = {
  completed: {
    label: "Completed Tasks",
    color: "hsl(var(--primary))"
  },
  estimatedMinutes: {
    label: "Estimated (min)",
    color: "hsl(var(--focus))"
  },
  actualMinutes: {
    label: "Actual (min)",
    color: "hsl(var(--energy))"
  }
};

function MonthlyAnalyticsView({ data }: { data: MonthlyAnalyticsResponse | null }) {
  if (!data) return null;

  const trendData = data.trendData || [];
  const hasActivity = trendData.some(d => d.completed > 0);
  const hasTimeData = trendData.some(d => d.estimatedMinutes > 0 || d.actualMinutes > 0);

  return (
    <div className="space-y-6">
      {/* Monthly Productivity Trend Line Chart */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Monthly Productivity Trend
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tasks completed day-by-day throughout the month.
          </p>
        </div>

        {!hasActivity ? (
          <EmptyChartState message="Not enough activity recorded for this month" />
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ChartContainer config={monthlyChartConfig} className="h-full w-full">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* Monthly Estimated vs Actual Time */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Monthly Estimated vs. Actual Time
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Duration distribution across days of the month.
          </p>
        </div>

        {!hasTimeData ? (
          <EmptyChartState message="Not enough duration data recorded for this month" />
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ChartContainer config={monthlyChartConfig} className="h-full w-full">
              <BarChart data={trendData.filter(d => d.estimatedMinutes > 0 || d.actualMinutes > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  unit="m"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="estimatedMinutes"
                  fill="hsl(var(--focus))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="actualMinutes"
                  fill="hsl(var(--energy))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Clean Empty Chart State
// -------------------------------------------------------------
function EmptyChartState({ message = "Not enough data yet" }: { message?: string }) {
  return (
    <div className="h-56 sm:h-64 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-center p-6">
      <div className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
        <TrendingUp className="h-4 w-4 opacity-60" />
      </div>
      <p className="text-xs font-semibold text-foreground tracking-tight">{message}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
        Data visualizations will appear automatically as you track tasks and focus sessions.
      </p>
    </div>
  );
}
