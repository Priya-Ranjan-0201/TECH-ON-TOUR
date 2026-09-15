import React from 'react';

export type DataLabelType = 'Actual Data' | 'Predicted Data' | 'Estimated Data' | 'AI Recommendation';

interface DataBadgeProps {
  label: DataLabelType | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const DataBadge: React.FC<DataBadgeProps> = ({ label, size = 'xs', className = '' }) => {
  let badgeStyle = 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';

  if (label === 'Actual Data') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
  } else if (label === 'Predicted Data') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
  } else if (label === 'Estimated Data') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
  } else if (label === 'AI Recommendation') {
    badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
  }

  const sizeStyle = size === 'xs' 
    ? 'text-[10px] px-2 py-0.5' 
    : size === 'sm' 
    ? 'text-[11px] px-2.5 py-0.5' 
    : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold rounded-full border shadow-2xs tracking-tight ${badgeStyle} ${sizeStyle} ${className}`}
      title={`Data Provenance: ${label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      <span>{label}</span>
    </span>
  );
};
