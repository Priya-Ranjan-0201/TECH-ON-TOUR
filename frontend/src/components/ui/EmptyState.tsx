import React from 'react';
import { MapPinOff } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No destinations found',
  description = 'Try adjusting your state filter or search keywords to explore other authentic circuits across India.',
  actionLabel = 'Reset Filters',
  onAction,
  icon: Icon = MapPinOff,
  className = '',
}) {
  return (
    <div className={`text-center py-12 px-4 rounded-ts border border-dashed border-neutral-300 bg-neutral-50/50 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-primary-900 mb-1">{title}</h3>
      <p className="text-xs text-neutral-600 max-w-md mx-auto mb-4">{description}</p>
      {onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
