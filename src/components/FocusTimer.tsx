import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Eye, Settings2 } from 'lucide-react';
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
import { useApi } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
const TIMER_DURATION_MINUTES_MIN = 1;
const TIMER_DURATION_MINUTES_MAX = 240;

interface TimerPreferences {
  focusDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
}

const DEFAULT_TIMER_PREFERENCES: TimerPreferences = {
  focusDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15
};

const isValidDuration = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= TIMER_DURATION_MINUTES_MIN &&
  value <= TIMER_DURATION_MINUTES_MAX;

const sanitizeTimerPreferences = (value: unknown): TimerPreferences => {
  if (!value || typeof value !== 'object') return DEFAULT_TIMER_PREFERENCES;
  const preferences = value as Partial<TimerPreferences>;
  return isValidDuration(preferences.focusDurationMinutes) &&
    isValidDuration(preferences.shortBreakDurationMinutes) &&
    isValidDuration(preferences.longBreakDurationMinutes)
    ? preferences as TimerPreferences
    : DEFAULT_TIMER_PREFERENCES;
};

export function FocusTimer({
  className,
  tasks = [],
  selectedTaskId,
  onSelectTask,
  onLogSession
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION_SECONDS);
  const [intervalDurationSeconds, setIntervalDurationSeconds] = useState(FOCUS_DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [breakType, setBreakType] = useState<'short' | 'long'>('short');
  const [preferences, setPreferences] = useState<TimerPreferences>(DEFAULT_TIMER_PREFERENCES);
  const [durationDrafts, setDurationDrafts] = useState<Record<keyof TimerPreferences, string>>({
    focusDurationMinutes: String(DEFAULT_TIMER_PREFERENCES.focusDurationMinutes),
    shortBreakDurationMinutes: String(DEFAULT_TIMER_PREFERENCES.shortBreakDurationMinutes),
    longBreakDurationMinutes: String(DEFAULT_TIMER_PREFERENCES.longBreakDurationMinutes)
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Screen Wake Lock: keep the display on while the timer runs. The timer's
  // `isRunning` state is the single source of truth; the hook no-ops on
  // unsupported browsers and never touches timer state.
  const { isHeld: wakeLockHeld } = useWakeLock(isRunning);
  const [localSelectedTask, setLocalSelectedTask] = useState<string | null>(null);
  const { toast } = useToast();
  const { apiCall } = useApi();

  // Timestamp-based timing state (refs so interval callbacks never go stale)
  const endAtRef = useRef<number | null>(null);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusElapsedMsRef = useRef(0);
  const focusSegmentStartRef = useRef<number | null>(null);
  const sessionTaskIdRef = useRef<string | null>(null);
  const completingRef = useRef(false);
  const intervalHasStartedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentTaskId = selectedTaskId !== undefined ? selectedTaskId : localSelectedTask;
  const currentTask = tasks.find(t => t.id === currentTaskId);

  // Mirror latest values into refs so timer callbacks always see fresh data
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const breakTypeRef = useRef(breakType);
  breakTypeRef.current = breakType;
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const intervalDurationSecondsRef = useRef(intervalDurationSeconds);
  intervalDurationSecondsRef.current = intervalDurationSeconds;
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
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

  const getConfiguredDurationSeconds = useCallback((timerMode: 'focus' | 'break', timerBreakType = breakTypeRef.current) => {
    const minutes = timerMode === 'focus'
      ? preferencesRef.current.focusDurationMinutes
      : timerBreakType === 'long'
        ? preferencesRef.current.longBreakDurationMinutes
        : preferencesRef.current.shortBreakDurationMinutes;
    return minutes * 60;
  }, []);

  const prepareNewInterval = useCallback((timerMode: 'focus' | 'break', timerBreakType = breakTypeRef.current) => {
    const durationSeconds = getConfiguredDurationSeconds(timerMode, timerBreakType);
    intervalHasStartedRef.current = false;
    setIntervalDurationSeconds(durationSeconds);
    setTimeLeft(durationSeconds);
  }, [getConfiguredDurationSeconds]);

  useEffect(() => {
    let isMounted = true;

    apiCall('/timer-preferences')
      .then((res) => {
        if (!isMounted) return;
        const loadedPreferences = sanitizeTimerPreferences(res?.preferences);
        setPreferences(loadedPreferences);
        setDurationDrafts({
          focusDurationMinutes: String(loadedPreferences.focusDurationMinutes),
          shortBreakDurationMinutes: String(loadedPreferences.shortBreakDurationMinutes),
          longBreakDurationMinutes: String(loadedPreferences.longBreakDurationMinutes)
        });

        // Only update the untouched, not-yet-started timer. An active or paused
        // interval retains the duration it was created with.
        if (!isRunningRef.current && !intervalHasStartedRef.current && timeLeftRef.current === intervalDurationSecondsRef.current) {
          const loadedDurationSeconds = (modeRef.current === 'focus'
            ? loadedPreferences.focusDurationMinutes
            : breakTypeRef.current === 'long'
              ? loadedPreferences.longBreakDurationMinutes
              : loadedPreferences.shortBreakDurationMinutes) * 60;
          setIntervalDurationSeconds(loadedDurationSeconds);
          setTimeLeft(loadedDurationSeconds);
        }
      })
      .catch(() => {
        // The timer remains usable with the established defaults while offline.
      });

    return () => {
      isMounted = false;
    };
  }, [apiCall]);

  // ---------------------------------------------------------------------------
  // Timer alarm audio.
  //
  // iOS/Safari creates every AudioContext in the "suspended" state and only
  // allows it to run once it has been resumed from a user gesture. The alarm
  // used to build a brand new context inside the countdown callback — i.e.
  // outside any gesture — so on iPad it stayed silent. Safari also caps the
  // number of live contexts per page, so creating one per session eventually
  // broke audio entirely. We therefore keep a single context for the life of
  // the timer, prime it on the first tap, and reuse it when a session ends.
  // ---------------------------------------------------------------------------
  const getAudioContext = useCallback((): AudioContext | null => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioCtx = window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      audioContextRef.current = new AudioCtx();
    } catch {
      audioContextRef.current = null;
    }
    return audioContextRef.current;
  }, []);

  // Must run inside a user gesture (Start, Reset, mode switch) so iOS unlocks
  // the context before the countdown finishes unattended.
  const unlockAlarmAudio = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Declaring "playback" stops iPadOS from silencing the alarm with the
    // hardware mute switch. Unsupported browsers simply ignore it.
    try {
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'playback';
    } catch {
      // Ignore — the alarm still plays where AudioSession is unsupported.
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch(() => {});
    }

    // A one-frame silent buffer is what actually completes the unlock on iOS.
    try {
      const source = audioContext.createBufferSource();
      source.buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
      source.connect(audioContext.destination);
      source.start(0);
    } catch {
      // Ignore.
    }
  }, [getAudioContext]);

  // Play alarm sound when timer ends
  const playAlarm = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const playBeeps = () => {
      const playBeep = (frequency: number, duration: number, delay: number) => {
        setTimeout(() => {
          try {
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
          } catch {
            // Ignore a single failed beep rather than losing the whole alarm.
          }
        }, delay);
      };

      playBeep(800, 0.2, 0);
      playBeep(800, 0.2, 300);
      playBeep(800, 0.2, 600);
    };

    // iOS can re-suspend the context after the screen locks or the page is
    // backgrounded, so resume before playing instead of assuming it is running.
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(playBeeps).catch(() => {});
      return;
    }

    playBeeps();
  }, [getAudioContext]);

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
  //
  // `exactMinutes` is used when pausing: it logs only complete minutes and
  // keeps the sub-minute remainder banked, so repeated pause/resume cycles can
  // update the task straight away without rounding the same seconds twice.
  // The default preserves the original end-of-session behavior (minimum one
  // minute, rounded to the nearest minute).
  const commitElapsedFocusTime = useCallback((exactMinutes = false): number => {
    captureFocusSegment();
    let minutesLogged = 0;

    if (modeRef.current === 'focus' && focusElapsedMsRef.current > 0) {
      const elapsedSeconds = focusElapsedMsRef.current / 1000;

      if (exactMinutes) {
        minutesLogged = Math.floor(elapsedSeconds / 60);
        focusElapsedMsRef.current -= minutesLogged * 60000;
      } else if (elapsedSeconds >= MIN_LOGGABLE_SECONDS) {
        minutesLogged = Math.max(1, Math.round(elapsedSeconds / 60));
        focusElapsedMsRef.current = 0;
      } else {
        focusElapsedMsRef.current = 0;
      }
    } else if (!exactMinutes) {
      // Preserve the original unconditional reset for end-of-session commits.
      focusElapsedMsRef.current = 0;
    }

    if (minutesLogged > 0) {
      onLogSessionRef.current?.(sessionTaskIdRef.current, minutesLogged);
    }

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
    if (newMode === 'break') {
      // Preserve the original timer behavior: focus completion starts a short
      // break unless the user explicitly chooses a long break before starting.
      setBreakType('short');
      prepareNewInterval(newMode, 'short');
    } else {
      prepareNewInterval(newMode);
    }
  }, [clearSwitchTimeout, commitElapsedFocusTime, prepareNewInterval]);

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
  }, [commitElapsedFocusTime, switchMode, playAlarm]);

  const resetTimer = () => {
    clearSwitchTimeout();
    unlockAlarmAudio();
    setIsRunning(false);
    endAtRef.current = null;
    commitElapsedFocusTime();
    prepareNewInterval(mode);
  };

  const switchBreakType = (nextBreakType: 'short' | 'long') => {
    if (mode !== 'break' || isRunning || intervalHasStartedRef.current) return;
    setBreakType(nextBreakType);
    prepareNewInterval('break', nextBreakType);
  };

  const saveTimerPreferences = async (nextPreferences?: TimerPreferences) => {
    const values = nextPreferences || (Object.entries(durationDrafts).reduce((result, [key, value]) => {
      const parsed = Number(value);
      return { ...result, [key]: parsed };
    }, {} as TimerPreferences));

    if (!isValidDuration(values.focusDurationMinutes) ||
      !isValidDuration(values.shortBreakDurationMinutes) ||
      !isValidDuration(values.longBreakDurationMinutes)) {
      setSettingsError(`Enter whole-minute durations from ${TIMER_DURATION_MINUTES_MIN} to ${TIMER_DURATION_MINUTES_MAX}.`);
      return;
    }

    setIsSavingPreferences(true);
    setSettingsError(null);
    try {
      const res = await apiCall('/timer-preferences', {
        method: 'PUT',
        body: JSON.stringify(values)
      });
      const savedPreferences = sanitizeTimerPreferences(res?.preferences);
      setPreferences(savedPreferences);
      setDurationDrafts({
        focusDurationMinutes: String(savedPreferences.focusDurationMinutes),
        shortBreakDurationMinutes: String(savedPreferences.shortBreakDurationMinutes),
        longBreakDurationMinutes: String(savedPreferences.longBreakDurationMinutes)
      });
      // Apply saved values straight away when this is the untouched timer
      // shown before its first Start. Started (including paused) intervals
      // retain their captured duration so elapsed-session behavior is intact.
      if (!isRunningRef.current && !intervalHasStartedRef.current) {
        const durationSeconds = (modeRef.current === 'focus'
          ? savedPreferences.focusDurationMinutes
          : breakTypeRef.current === 'long'
            ? savedPreferences.longBreakDurationMinutes
            : savedPreferences.shortBreakDurationMinutes) * 60;
        setIntervalDurationSeconds(durationSeconds);
        setTimeLeft(durationSeconds);
      }
      toast({ title: 'Timer settings saved', description: 'The displayed timer has been updated.' });
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not save timer settings.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const resetTimerPreferences = () => {
    const defaults = { ...DEFAULT_TIMER_PREFERENCES };
    setDurationDrafts({
      focusDurationMinutes: String(defaults.focusDurationMinutes),
      shortBreakDurationMinutes: String(defaults.shortBreakDurationMinutes),
      longBreakDurationMinutes: String(defaults.longBreakDurationMinutes)
    });
    saveTimerPreferences(defaults);
  };

  const toggleTimer = () => {
    if (isRunning) {
      // Pause: freeze remaining time and log the banked focus time right away
      // so the associated task's logged total updates instantly.
      endAtRef.current = null;
      setIsRunning(false);
      commitElapsedFocusTime(true);
      return;
    }
    if (timeLeft <= 0 || completingRef.current) return;
    // Unlock alarm audio while we still have a user gesture (see unlockAlarmAudio)
    unlockAlarmAudio();
    // Start/resume from an absolute timestamp so the countdown stays
    // accurate even when the tab is throttled in the background
    endAtRef.current = Date.now() + timeLeft * 1000;
    intervalHasStartedRef.current = true;
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

  // Clean up the pending auto mode-switch and the alarm audio on unmount
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      if (audioContext && typeof audioContext.close === 'function') {
        void audioContext.close().catch(() => {});
      }
    };
  }, []);

  const progressPercentage = intervalDurationSeconds > 0
    ? Math.max(0, Math.min(100, ((intervalDurationSeconds - timeLeft) / intervalDurationSeconds) * 100))
    : 0;
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
              {mode === 'focus' ? 'Focus Session' : breakType === 'long' ? 'Long Break' : 'Short Break'}
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
          <div className="flex items-center gap-1">
            {mode === 'break' && (
              <button
                type="button"
                onClick={() => switchBreakType(breakType === 'short' ? 'long' : 'short')}
                disabled={isRunning || intervalHasStartedRef.current}
                title={isRunning || intervalHasStartedRef.current ? 'Choose the break length before starting the break' : undefined}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 py-1.5 px-2 rounded-md hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use {breakType === 'short' ? 'long' : 'short'} break
              </button>
            )}
            <button
              type="button"
              onClick={switchMode}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 py-1.5 px-3 rounded-md hover:bg-accent/60"
            >
              Switch to {mode === 'focus' ? 'break' : 'focus'}
            </button>
          </div>
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

          <div className="w-full max-w-md border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={() => setSettingsOpen(open => !open)}
              aria-expanded={settingsOpen}
              aria-controls="timer-settings-panel"
              className="w-full flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-2"><Settings2 className="h-3.5 w-3.5" /> Timer settings</span>
              <span>{settingsOpen ? 'Hide' : 'Customize'}</span>
            </button>

            {settingsOpen && (
              <div id="timer-settings-panel" className="mt-3 space-y-3 text-left">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Set durations in minutes. Changes apply to the next interval and never alter an active or paused timer.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    ['focusDurationMinutes', 'Focus duration'],
                    ['shortBreakDurationMinutes', 'Short break'],
                    ['longBreakDurationMinutes', 'Long break']
                  ] as [keyof TimerPreferences, string][]).map(([key, label]) => (
                    <div key={key} className="space-y-1.5 min-w-0">
                      <Label htmlFor={`timer-${key}`} className="text-xs">{label}</Label>
                      <div className="relative">
                        <Input
                          id={`timer-${key}`}
                          type="number"
                          inputMode="numeric"
                          min={TIMER_DURATION_MINUTES_MIN}
                          max={TIMER_DURATION_MINUTES_MAX}
                          step="1"
                          value={durationDrafts[key]}
                          onChange={(event) => {
                            setDurationDrafts(current => ({ ...current, [key]: event.target.value }));
                            setSettingsError(null);
                          }}
                          aria-describedby={settingsError ? 'timer-settings-error' : undefined}
                          aria-invalid={Boolean(settingsError)}
                          className="h-9 pr-11 text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground">min</span>
                      </div>
                    </div>
                  ))}
                </div>
                {settingsError && (
                  <p id="timer-settings-error" role="alert" className="text-xs text-destructive">
                    {settingsError}
                  </p>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={resetTimerPreferences} disabled={isSavingPreferences} className="justify-start px-2 text-xs">
                    Reset to defaults
                  </Button>
                  <Button type="button" size="sm" onClick={() => saveTimerPreferences()} disabled={isSavingPreferences} className="text-xs">
                    {isSavingPreferences ? 'Saving…' : 'Save durations'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}