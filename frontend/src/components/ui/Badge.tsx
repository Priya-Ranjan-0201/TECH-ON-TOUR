import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: string;
  color?: string;
  size?: string;
  icon?: any;
  className?: string;
}

export default function Badge({
  children,
  variant = 'verified',
  color,
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full tracking-wide transition-colors';

  const colorStyles: Record<string, string> = {
    red: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    critical: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    orange: 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    high: 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    yellow: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    amber: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    moderate: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    green: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    low: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    blue: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  };

  const variants = {
    verified: 'bg-secondary-50 text-secondary-800 border border-secondary-800/20',
    gem: 'bg-secondary-50 text-secondary-900 border border-secondary-900/30',
    pricing: 'bg-accent-50 text-accent-900 border border-accent-800/20',
    alert: 'bg-alert-50 text-alert-800 border border-alert-600/30',
    neutral: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    primary: 'bg-primary-50 text-primary-800 border border-primary-800/20',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  const activeStyle = (color && colorStyles[color.toLowerCase()]) || variants[variant] || variants.verified;

  return (
    <span
      className={`${baseStyles} ${activeStyle} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
