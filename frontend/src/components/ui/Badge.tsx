import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: string;
  size?: string;
  icon?: any;
  className?: string;
}

export default function Badge({
  children,
  variant = 'verified',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full tracking-wide transition-colors';

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

  return (
    <span
      className={`${baseStyles} ${variants[variant] || variants.verified} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
