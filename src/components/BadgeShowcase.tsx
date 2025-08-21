import { Badge } from '@/types/tasks';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeShowcaseProps {
  badges: Badge[];
  className?: string;
}

export function BadgeShowcase({ badges, className }: BadgeShowcaseProps) {
  const getBadgeStyle = (type: Badge['type']) => {
    switch (type) {
      case 'gold':
        return 'bg-badge-gold text-white shadow-lg border-badge-gold/30';
      case 'silver':
        return 'bg-badge-silver text-foreground shadow-md border-badge-silver/30';
      case 'bronze':
        return 'bg-badge-bronze text-white shadow-md border-badge-bronze/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getBadgeIcon = (type: Badge['type']) => {
    switch (type) {
      case 'gold':
        return <Trophy className="h-4 w-4" />;
      case 'silver':
        return <Medal className="h-4 w-4" />;
      case 'bronze':
        return <Star className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (badges.length === 0) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <div className="text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Complete tasks to earn your first badge!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Achievements</h3>
          <span className="text-sm text-muted-foreground">({badges.length})</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 hover:scale-105 animate-bounce-in",
                getBadgeStyle(badge.type)
              )}
            >
              <div className="flex-shrink-0 text-2xl">
                {badge.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{badge.name}</h4>
                  {getBadgeIcon(badge.type)}
                </div>
                <p className="text-sm opacity-90 truncate">{badge.description}</p>
              </div>
              
              <div className="text-xs opacity-75">
                {badge.earnedAt.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {badges.length >= 3 && (
          <div className="text-center pt-3 border-t">
            <div className="text-sm font-medium text-primary animate-pulse-glow">
              🌟 Badge Collector!
            </div>
            <div className="text-xs text-muted-foreground">
              You're building an impressive collection!
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}