import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | string;
  size?: 'sm' | 'md' | 'lg' | string;
  loading?: boolean;
  disabled?: boolean;
  icon?: any;
  className?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-ts transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-800 hover:bg-primary-900 text-primary-50 focus:ring-primary-800 shadow-sm active:translate-y-0.5',
    secondary: 'bg-secondary-800 hover:bg-secondary-900 text-secondary-50 focus:ring-secondary-800 shadow-sm active:translate-y-0.5',
    accent: 'bg-accent-400 hover:bg-accent-600 text-neutral-900 font-semibold focus:ring-accent-400 shadow-sm active:translate-y-0.5',
    outline: 'border border-primary-800 text-primary-800 hover:bg-primary-50 focus:ring-primary-800',
    ghost: 'text-primary-800 hover:bg-primary-50/60 focus:ring-primary-800',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
