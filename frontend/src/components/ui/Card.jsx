import React from 'react';

export default function Card({
  children,
  variant = 'default',
  hover = false,
  className = '',
  ...props
}) {
  const baseStyles = 'rounded-ts border transition-all duration-200';

  const variants = {
    default: 'bg-neutral-50 border-neutral-200 shadow-ts-card',
    glass: 'bg-neutral-50/90 backdrop-blur-md border-primary-800/15 shadow-ts-glass',
    elevated: 'bg-neutral-50 border-neutral-200 shadow-md',
    bordered: 'bg-transparent border-neutral-200',
    primary: 'bg-gradient-to-br from-ivory to-primary-50/40 border-primary-800/20 shadow-ts-card',
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
