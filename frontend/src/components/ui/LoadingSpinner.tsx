import React from 'react';
import { Compass } from 'lucide-react';

export default function LoadingSpinner({
  size = 'md',
  message = 'Loading verified destinations...',
  className = '',
}) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`${sizes[size]} rounded-full border-2 border-primary-100 border-t-primary-800 animate-spin`} />
        <Compass className={`absolute ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-2.5 h-2.5'} text-accent-400`} />
      </div>
      {message && <p className="text-xs font-medium text-neutral-600 animate-pulse">{message}</p>}
    </div>
  );
}
