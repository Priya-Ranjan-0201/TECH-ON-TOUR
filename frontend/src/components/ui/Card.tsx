import React from 'react';

export default function Card({
  children,
  variant = 'default',
  hover = false,
  className = '',
  ...props
}) {
  const baseStyles = 'rounded-ts border transition-all duration-200 text-neutral-900 dark:text-neutral-100';

  const variants = {
    default: 'bg-[#FDFBF7] dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-ts-card',
    glass: 'bg-[#FDFBF7]/95 backdrop-blur-md border-primary-800/15 shadow-ts-glass',
    elevated: 'bg-[#FDFBF7] dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-md',
    bordered: 'bg-transparent border-neutral-200 dark:border-neutral-800',
    primary: 'bg-gradient-to-br from-[#FDFBF7] to-primary-50/50 border-primary-800/20 shadow-ts-card',
  };

  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant] || variants.default} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
