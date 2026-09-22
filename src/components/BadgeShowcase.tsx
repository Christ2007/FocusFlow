import { Badge } from '@/types/tasks';
import { Trophy, Star, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeShowcaseProps {
  badges: Badge[];
  className?: string;
}

export function BadgeShowcase({ badges, className }: BadgeShowcaseProps) {
  const getBadgeIcon = (type: Badge['type']) => {
    switch (type) {
      case 'gold':
        return <Trophy className="h-3.5 w-3.5 text-badge-gold" />;
      case 'silver':
        return <Medal className="h-3.5 w-3.5 text-badge-silver" />;
      case 'bronze':
        return <Star className="h-3.5 w-3.5 text-badge-bronze" />;
      default:
        return null;
    }
  };

  if (badges.length === 0) {
    return (
      <section className={cn("space-y-2", className)}>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Milestones
        </h3>
        <p className="text-xs text-muted-foreground">
          Milestones appear here as tasks and streaks are completed.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Milestones
        </h3>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {badges.length} unlocked
        </span>
      </div>

      <div className="space-y-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-start gap-2.5 py-1.5 transition-colors"
          >
            <div className="mt-0.5 text-muted-foreground/70 flex-shrink-0">
              {getBadgeIcon(badge.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-foreground truncate">{badge.name}</span>
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 tabular-nums">
                  {badge.earnedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}