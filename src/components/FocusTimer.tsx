import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Eye } from 'lucide-react';
import { useWakeLock } from '@/hooks/useWakeLock';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Task } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  className?: string;
  tasks?: Task[];
  selectedTaskId?: string | null;
  onSelectTask?: (id: string | null) => void;
  onLogSession?: (taskId: string | null, minutes: number) => void;
}

const FOCUS_DURATION_SECONDS = 25 * 60;
const BREAK_DURATION_SECONDS = 5 * 60;
const MIN_LOGGABLE_SECONDS = 30;

export function FocusTimer({
  className,
  tasks = [],
  selectedTaskId,
  onSelectTask,
  onLogSession
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  // Screen Wake Lock: keep the display on while the timer runs. The timer's
  // `isRunning` state is the single source of truth; the hook no-ops on
  // unsupported browsers and never touches timer state.
  const { isHeld: wakeLockHeld } = useWakeLock(isRunning);
  const [localSelectedTask, setLocalSelectedTask] = useState<string | null>(null);
  const { toast } = useToast();

  // Timestamp-based timing state (refs so interval callbacks never go stale)
  const endAtRef = useRef<number | null>(null);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusElapsedMsRef = useRef(0);
  const focusSegmentStartRef = useRef<number | null>(null);
  const sessionTaskIdRef = useRef<string | null>(null);
  const completingRef = useRef(false);

  const currentTaskId = selectedTaskId !== undefined ? selectedTaskId : localSelectedTask;
  const currentTask = tasks.find(t => t.id === currentTaskId);

  // Mirror latest values into refs so timer callbacks always see fresh data
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const currentTaskRef = useRef(currentTask);
  currentTaskRef.current = currentTask;
  const currentTaskIdRef = useRef(currentTaskId);
  currentTaskIdRef.current = currentTaskId;
  const onLogSessionRef = useRef(onLogSession);
  onLogSessionRef.current = onLogSession;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const handleSelectTask = (id: string | null) => {
    if (onSelectTask) {
      onSelectTask(id);
    } else {
      setLocalSelectedTask(id);
    }
  };

  // Play alarm sound when timer ends
  const playAlarm = () => {
    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      
      const playBeep = (frequency: number, duration: number, delay: number) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };

      playBeep(800, 0.2, 0);
      playBeep(800, 0.2, 300);
      playBeep(800, 0.2, 600);
    } catch {
      // Audio playback fallback
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Bank the currently running focus segment into the accumulated elapsed time
  const captureFocusSegment = useCallback(() => {
    if (modeRef.current === 'focus' && focusSegmentStartRef.current != null) {
      focusElapsedMsRef.current += Date.now() - focusSegmentStartRef.current;
      focusSegmentStartRef.current = null;
    }
  }, []);

  // Log accumulated focus time to the server (attributed to the task the
  // session was started with). Returns the number of minutes logged.
  const commitElapsedFocusTime = useCallback((): number => {
    captureFocusSegment();
    let minutesLogged = 0;
    if (modeRef.current === 'focus' && focusElapsedMsRef.current > 0) {
      const elapsedSeconds = focusElapsedMsRef.current / 1000;
      if (elapsedSeconds >= MIN_LOGGABLE_SECONDS) {
        minutesLogged = Math.max(1, Math.round(elapsedSeconds / 60));
        onLogSessionRef.current?.(sessionTaskIdRef.current, minutesLogged);
      }
    }
    focusElapsedMsRef.current = 0;
    return minutesLogged;
  }, [captureFocusSegment]);

  const clearSwitchTimeout = useCallback(() => {
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }
    completingRef.current = false;
  }, []);

  const switchMode = useCallback(() => {
    clearSwitchTimeout();
    setIsRunning(false);
    endAtRef.current = null;
    commitElapsedFocusTime();
    const newMode = modeRef.current === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? FOCUS_DURATION_SECONDS : BREAK_DURATION_SECONDS);
  }, [clearSwitchTimeout, commitElapsedFocusTime]);

  const handleTimerComplete = useCallback(() => {
    if (completingRef.current) return;
    completingRef.current = true;
    setIsRunning(false);
    endAtRef.current = null;
    playAlarm();

    if (modeRef.current === 'focus') {
      const minutesLogged = commitElapsedFocusTime();
      const task = currentTaskRef.current;
      toastRef.current({
        title: "Focus session complete! 🎯",
        description: task
          ? `Logged ${minutesLogged}m on "${task.name}". Time for a well-deserved break!`
          : "Great work! Time for a well-deserved break."
      });
    } else {
      toastRef.current({
        title: "Break's over!",
        description: "Ready to tackle your next focus session?"
      });
    }

    switchTimeoutRef.current = setTimeout(() => {
      completingRef.current = false;
      switchMode();
    }, 2000);
  }, [commitElapsedFocusTime, switchMode]);

  const resetTimer = () => {
    clearSwitchTimeout();
    setIsRunning(false);
    endAtRef.current = null;
    commitElapsedFocusTime();
    setTimeLeft(mode === 'focus' ? FOCUS_DURATION_SECONDS : BREAK_DURATION_SECONDS);
  };

  const toggleTimer = () => {
    if (isRunning) {
      // Pause: freeze remaining time and bank elapsed focus time
      captureFocusSegment();
      endAtRef.current = null;
      setIsRunning(false);
      return;
    }
    if (timeLeft <= 0 || completingRef.current) return;
    // Start/resume from an absolute timestamp so the countdown stays
    // accurate even when the tab is throttled in the background
    endAtRef.current = Date.now() + timeLeft * 1000;
    if (mode === 'focus') {
      if (focusElapsedMsRef.current === 0) {
        sessionTaskIdRef.current = currentTaskId;
      }
      focusSegmentStartRef.current = Date.now();
    }
    setIsRunning(true);
  };

  // Countdown loop — computes remaining time from the target timestamp
  // instead of decrementing state, so it cannot drift or go negative.
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (endAtRef.current == null) return;
      const remaining = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleTimerComplete();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, handleTimerComplete]);

  // If the associated task changes mid-session, attribute the already
  // accumulated focus time to the previous task before switching.
  const previousTaskIdRef = useRef(currentTaskId);
  useEffect(() => {
    if (previousTaskIdRef.current === currentTaskId) return;
    commitElapsedFocusTime();
    previousTaskIdRef.current = currentTaskId;
    sessionTaskIdRef.current = currentTaskId;
    if (isRunningRef.current && modeRef.current === 'focus') {
      focusSegmentStartRef.current = Date.now();
    }
  }, [currentTaskId, commitElapsedFocusTime]);

  // Clean up the pending auto mode-switch on unmount
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    };
  }, []);

  const totalSeconds = mode === 'focus' ? FOCUS_DURATION_SECONDS : BREAK_DURATION_SECONDS;
  const progressPercentage = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const activeTasks = tasks.filter(t => !t.completed);

  return (
    <section className={cn("space-y-4", className)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full transition-colors duration-200",
              isRunning ? (mode === 'focus' ? "bg-primary animate-pulse" : "bg-energy animate-pulse") : "bg-muted-foreground/40"
            )} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {mode === 'focus' ? 'Focus Session' : 'Short Break'}
            </h3>
            {wakeLockHeld && (
              <span
                title="Screen kept awake while the timer runs"
                aria-label="Screen kept awake while the timer runs"
                className="text-muted-foreground/60 select-none"
              >
                <Eye className="h-3 w-3" />
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={switchMode}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 py-1.5 px-3 rounded-md hover:bg-accent/60"
          >
            Switch to {mode === 'focus' ? 'break' : 'focus'}
          </button>
        </div>

        {/* Task Selector for Association */}
        {mode === 'focus' && (
          <div className="mt-3">
            <Select
              value={currentTaskId || "none"}
              onValueChange={(val) => handleSelectTask(val === "none" ? null : val)}
            >
              <SelectTrigger className="h-8 text-xs bg-background border-border/80">
                <SelectValue placeholder="Associate with task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No task associated</span>
                </SelectItem>
                {activeTasks.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center justify-between gap-2 max-w-[200px] truncate">
                      <span className="truncate">{t.icon} {t.name}</span>
                      {t.estimatedDuration ? (
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          ({t.actualDuration || 0}/{t.estimatedDuration}m)
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentTask && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span className="truncate">Focusing on: <strong className="text-foreground">{currentTask.name}</strong></span>
                <span className="tabular-nums flex-shrink-0">
                  {currentTask.actualDuration || 0}m logged
                  {currentTask.estimatedDuration ? ` / ${currentTask.estimatedDuration}m est.` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Timer Display */}
        <div className="flex flex-col items-center gap-5 pt-3">
          {/* Progress Ring */}
          <div className="relative w-40 h-40 sm:w-44 sm:h-44">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="hsl(var(--muted))"
                strokeWidth="5"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke={mode === 'focus' ? "hsl(var(--primary))" : "hsl(var(--energy))"}
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progressPercentage / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Time in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                role="timer"
                aria-label={`${mode === 'focus' ? 'Focus' : 'Break'} time remaining`}
                className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight tabular-nums text-foreground"
              >
                {formatTime(timeLeft)}
              </span>
              <span
                aria-live="polite"
                className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground mt-1"
              >
                {isRunning ? (mode === 'focus' ? 'Focusing' : 'Resting') : 'Paused'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 w-full max-w-[220px]">
            <Button
              size="default"
              onClick={toggleTimer}
              className="flex-1 h-10 text-sm font-semibold tracking-wide"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-1.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1.5" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              size="icon"
              variant="outline"
              onClick={resetTimer}
              aria-label="Reset timer"
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}