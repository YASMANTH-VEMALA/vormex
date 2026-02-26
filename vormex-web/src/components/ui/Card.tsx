import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-neutral-900 rounded-lg shadow-md dark:shadow-neutral-800 p-6',
      className
    )}>
      {children}
    </div>
  );
}

