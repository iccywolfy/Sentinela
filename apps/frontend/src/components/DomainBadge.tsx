const DOMAIN_COLORS: Record<string, string> = {
  GEOPOLITICAL: 'bg-blue-900/40 text-blue-300 border-blue-700',
  ECONOMIC: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  MILITARY: 'bg-red-900/40 text-red-300 border-red-700',
  CYBER: 'bg-purple-900/40 text-purple-300 border-purple-700',
  HUMANITARIAN: 'bg-amber-900/40 text-amber-300 border-amber-700',
  ENVIRONMENTAL: 'bg-teal-900/40 text-teal-300 border-teal-700',
  SOCIAL: 'bg-pink-900/40 text-pink-300 border-pink-700',
  TECHNOLOGICAL: 'bg-cyan-900/40 text-cyan-300 border-cyan-700',
};

interface DomainBadgeProps {
  domain: string;
}

export function DomainBadge({ domain }: DomainBadgeProps) {
  const cls = DOMAIN_COLORS[domain] || 'bg-gray-800 text-gray-300 border-gray-600';
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${cls}`}>
      {domain}
    </span>
  );
}
