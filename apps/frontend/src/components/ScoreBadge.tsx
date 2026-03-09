interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? 'text-red-400 bg-red-900/30 border-red-700' :
    pct >= 60 ? 'text-orange-400 bg-orange-900/30 border-orange-700' :
    pct >= 40 ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700' :
    'text-green-400 bg-green-900/30 border-green-700';
  const sz = size === 'sm' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-base px-3 py-1' : 'text-sm px-2 py-0.5';
  return (
    <span className={`inline-flex items-center font-mono font-bold rounded border ${color} ${sz}`}>
      {pct}
    </span>
  );
}
