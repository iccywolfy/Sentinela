const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-900/50 text-red-300 border-red-600',
  HIGH: 'bg-orange-900/50 text-orange-300 border-orange-600',
  MEDIUM: 'bg-yellow-900/50 text-yellow-300 border-yellow-600',
  LOW: 'bg-blue-900/50 text-blue-300 border-blue-600',
  INFO: 'bg-gray-800 text-gray-300 border-gray-600',
};

interface SeverityBadgeProps {
  severity: string;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const cls = SEVERITY_COLORS[severity] || SEVERITY_COLORS.INFO;
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-semibold ${cls}`}>
      {severity}
    </span>
  );
}
