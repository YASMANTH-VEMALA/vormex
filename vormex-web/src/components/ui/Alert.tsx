import React from 'react';
import { cn } from '@/lib/utils';

export interface AlertProps {
  type: 'success' | 'error';
  message: string;
  className?: string;
}

export function Alert({ type, message, className = '' }: AlertProps) {
  const baseClasses = 'p-3 rounded-md text-sm';
  const typeClasses = {
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800',
  };

  return (
    <div className={cn(baseClasses, typeClasses[type], className)}>
      {message}
    </div>
  );
}

