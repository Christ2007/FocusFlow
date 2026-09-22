import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  className?: string;
}

export function FocusTimer({ className }: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const { toast } = useToast();

  // Create alarm sound function
  const playAlarm = () => {
    // Create audio context for alarm sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a series of beeps for the alarm
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

    // Play alarm sequence - 3 beeps
    playBeep(800, 0.2, 0);
    playBeep(800, 0.2, 300);
    playBeep(800, 0.2, 600);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const switchMode = () => {
    setIsRunning(false);
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      
      // Play alarm sound when timer ends
      playAlarm();
      
      if (mode === 'focus') {
        toast({
          title: "Focus session complete!",
          description: "Great work! Time for a well-deserved break."
        });
      } else {
        toast({
          title: "Break's over!",
          description: "Ready to tackle your next focus session?"
        });
      }
      
      // Auto-switch to break/focus
      setTimeout(() => {
        switchMode();
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, toast]);

  const totalSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progressPercentage = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <section className={cn("space-y-5", className)}>
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
          </div>
          <button
            type="button"
            onClick={switchMode}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 py-1 px-2.5 rounded-md hover:bg-accent/60"
          >
            Switch to {mode === 'focus' ? 'break' : 'focus'}
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center gap-6 py-1">
          {/* Progress Ring */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48">
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
              <span className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight tabular-nums text-foreground">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground mt-1">
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