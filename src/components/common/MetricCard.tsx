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
        return 'text-[#10b981]';
      case 'rose':
        return 'text-[#ef4444]';
      case 'amber':
        return 'text-[#f59e0b]';
      default:
        return 'text-[#f0f2f5]';
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-md border border-[#181a22] bg-[#0c0e13] p-3 transition-colors hover:border-[#222634]">
      {/* Label and Delta */}
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#696f7e]">
        <span>{label}</span>
        {delta && (
          <span
            className={`font-mono text-[10px] tabular-nums font-medium ${
              delta.isNeutral
                ? 'text-[#696f7e]'
                : delta.isPositive
                ? 'text-[#10b981]'
                : 'text-[#ef4444]'
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="mt-2 flex items-baseline">
        <span className={`text-xl font-semibold font-mono tabular-nums tracking-tight ${getValueColor()}`}>
          {value}
        </span>
      </div>

      {/* Subtext info */}
      {subtext && (
        <div className="mt-1 text-[11px] text-[#555a66] font-mono truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
