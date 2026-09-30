import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  delta?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  highlight?: 'emerald' | 'rose' | 'amber' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  delta,
  highlight = 'neutral',
}) => {
  const getValueColor = () => {
    switch (highlight) {
      case 'emerald':
        return 'text-emerald-400';
      case 'rose':
        return 'text-rose-400';
      case 'amber':
        return 'text-amber-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.015] border border-white/[0.07] hover:border-white/[0.14] transition-all shadow-md group">
      {/* Label and Delta */}
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
        <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
        {delta && (
          <span
            className={`font-mono text-[10px] tabular-nums font-bold px-2 py-0.5 rounded-full ${
              delta.isNeutral
                ? 'text-slate-400 bg-white/[0.04]'
                : delta.isPositive
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="mt-3 flex items-baseline">
        <span className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${getValueColor()}`}>
          {value}
        </span>
      </div>

      {/* Subtext info */}
      {subtext && (
        <div className="mt-1 text-[11px] text-slate-400 font-mono truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};

