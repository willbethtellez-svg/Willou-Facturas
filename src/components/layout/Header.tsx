'use client';

import { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-willou-dark font-display">{title}</h1>
        {subtitle && <p className="text-willou-gray mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
