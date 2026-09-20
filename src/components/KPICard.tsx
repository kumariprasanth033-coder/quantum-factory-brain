import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  id?: string;
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  icon: LucideIcon;
  variant?: 'blue' | 'purple' | 'amber' | 'emerald' | 'red';
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  id,
  title,
  value,
  unit,
  subtitle,
  trend,
  icon: Icon,
  variant = 'blue',
  onClick,
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-slate-900/70',
      border: 'border-slate-800 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      valColor: 'text-white',
    },
    purple: {
      bg: 'bg-slate-900/70',
      border: 'border-slate-800 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      valColor: 'text-white',
    },
    amber: {
      bg: 'bg-slate-900/70',
      border: 'border-slate-800 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      valColor: 'text-white',
    },
    emerald: {
      bg: 'bg-slate-900/70',
      border: 'border-slate-800 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      valColor: 'text-white',
    },
    red: {
      bg: 'bg-slate-900/70',
      border: 'border-slate-800 hover:border-red-500/40',
      iconBg: 'bg-red-500/10 text-red-400 border border-red-500/20',
      valColor: 'text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      id={id}
      onClick={onClick}
      className={`relative p-4 rounded-xl border ${style.bg} ${style.border} transition-all duration-200 shadow-sm ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono tracking-tight ${style.valColor}`}>
              {value}
            </span>
            {unit && <span className="text-xs font-medium text-slate-300">{unit}</span>}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs border-t border-slate-800/60 pt-2.5">
          {trend && (
            <span
              className={`font-semibold font-mono px-1.5 py-0.5 rounded text-[11px] ${
                trend.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-300 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
