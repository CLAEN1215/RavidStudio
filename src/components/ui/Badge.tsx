import { cn, getRecommendationColor, getRecommendationLabel, getScoreColor } from '@/lib/utils';
import type { RecommendationLabel } from '@/types';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm',
      score >= 80 ? 'bg-emerald-100 text-emerald-700' :
      score >= 60 ? 'bg-blue-100 text-blue-700' :
      score >= 40 ? 'bg-amber-100 text-amber-700' :
      'bg-red-100 text-red-700',
      className
    )}>
      {score}
    </span>
  );
}

interface RecommendationBadgeProps {
  recommendation: RecommendationLabel | string;
  className?: string;
}

export function RecommendationBadge({ recommendation, className }: RecommendationBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      getRecommendationColor(recommendation),
      className
    )}>
      {getRecommendationLabel(recommendation)}
    </span>
  );
}

interface ConfidenceBadgeProps {
  confidence: string;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const colorMap: Record<string, string> = {
    HIGH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
    LOW: 'bg-amber-50 text-amber-700 border-amber-200',
    ESTIMATED: 'bg-purple-50 text-purple-700 border-purple-200',
    AI_INTERPRETED: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs border',
      colorMap[confidence] ?? colorMap.LOW,
      className
    )}>
      {confidence.replace('_', ' ')}
    </span>
  );
}
