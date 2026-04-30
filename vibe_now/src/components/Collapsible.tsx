import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export function Collapsible({ title, children, defaultOpen = false, icon }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-[var(--text-secondary)]">{icon}</span>}
          <span className="font-semibold text-[var(--text-primary)]">{title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="p-4 border-t border-[var(--border-subtle)] animate-[slideDown_0.2s_ease-out]">
          {children}
        </div>
      )}
    </div>
  );
}
