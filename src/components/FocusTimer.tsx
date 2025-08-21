import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FocusTimerProps {
  className?: string;
}

export function FocusTimer({ className }: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const { toast } = useToast();

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
      
      if (mode === 'focus') {
        toast({
          title: "Focus session complete! 🎉",
          description: "Great work! Time for a well-deserved break."
        });
      } else {
        toast({
          title: "Break's over! ⚡",
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

  const progressPercentage = mode === 'focus' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      <div className="text-center space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="font-semibold text-base sm:text-lg">
            {mode === 'focus' ? 'Focus Time' : 'Break Time'}
          </h3>
        </div>

        {/* Timer Display */}
        <div className="relative">
          <div className="text-3xl sm:text-4xl font-mono font-bold text-foreground mb-3 sm:mb-4">
            {formatTime(timeLeft)}
          </div>
          
          {/* Progress Ring Visual */}
          <div className="mx-auto mb-4 sm:mb-6 relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke={mode === 'focus' ? "hsl(var(--focus))" : "hsl(var(--energy))"}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progressPercentage / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Mode Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`text-lg sm:text-2xl p-2 sm:p-3 rounded-full ${
                mode === 'focus' 
                  ? 'bg-focus/10 text-focus' 
                  : 'bg-energy/10 text-energy'
              }`}>
                {mode === 'focus' ? '🎯' : '☕'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Button
            size="default"
            variant={mode === 'focus' ? 'focus' : 'energy'}
            onClick={toggleTimer}
            className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button
            size="default"
            variant="outline"
            onClick={resetTimer}
            className="h-10 sm:h-12 w-10 sm:w-12 p-0"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Mode Switch */}
        <Button
          variant="ghost"
          onClick={switchMode}
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground h-8 sm:h-10"
        >
          Switch to {mode === 'focus' ? 'Break' : 'Focus'} Mode
        </Button>

        {/* Tips */}
        <div className="text-xs text-muted-foreground mt-3 sm:mt-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
          {mode === 'focus' ? (
            <div>
              💡 <strong>Focus tip:</strong> Minimize distractions and work on one task at a time.
            </div>
          ) : (
            <div>
              🌟 <strong>Break tip:</strong> Step away from your workspace and move around!
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}