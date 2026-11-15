import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', padding && 'p-5', className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number | null;
  subtext?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'green' | 'blue' | 'amber' | 'red';
}

const colorMap = {
  default: 'text-gray-900',
  green: 'text-emerald-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
};

export function StatCard({ label, value, subtext, icon, color = 'default' }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={cn('text-2xl font-bold mt-1', colorMap[color])}>
            {value ?? '—'}
          </p>
          {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
