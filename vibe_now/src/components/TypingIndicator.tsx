import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div
      className="flex gap-3 mb-6 animate-[slideDown_0.2s_ease-out]"
      role="status"
      aria-live="polite"
      aria-label="AI is thinking"
    >
      <div className="shrink-0">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-cyan)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white animate-[spin_2s_linear_infinite]" />
        </div>
      </div>
      <div className="flex flex-col gap-1 items-start">
        <div className="px-4 py-3 rounded-[var(--radius-lg)] rounded-bl-sm bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="flex gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-[bounce_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-[bounce_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-[bounce_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: '300ms' }}
              />
            </span>
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              AI consultant is thinking…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
