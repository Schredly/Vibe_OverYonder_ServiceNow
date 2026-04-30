import React from 'react';
import type { StatusVariant } from '../types';

interface StatusChipProps {
  status: StatusVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const STYLES: Record<StatusVariant, string> = {
  success: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
  info: 'bg-[#E3F2FD] text-[#1565C0] dark:bg-[#1E3A5F] dark:text-[#90CAF9]',
  neutral: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
};

export function StatusChip({ status, children, icon }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[var(--text-xs)] font-medium ${STYLES[status]}`}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {children}
    </span>
  );
}
