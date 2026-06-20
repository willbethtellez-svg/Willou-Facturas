'use client';

import { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode | string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-willou-purple mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-willou-dark mb-2">{title}</h3>
      <p className="text-willou-gray text-center mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
