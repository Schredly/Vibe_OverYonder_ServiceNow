import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[var(--text-primary)] text-[var(--text-sm)] font-medium mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-3 py-2 ${icon ? 'pl-10' : ''} bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all duration-200 ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[var(--danger)] text-[var(--text-sm)] mt-1">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[var(--text-primary)] text-[var(--text-sm)] font-medium mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all duration-200 resize-none ${error ? 'border-[var(--danger)]' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[var(--danger)] text-[var(--text-sm)] mt-1">{error}</p>}
    </div>
  );
}
