import { useState } from 'react';
import { providerVisuals } from '../lib/providerVisuals';

interface CostFooterChipProps {
  /** Provider id from the dynamic registry (e.g. "OpenAI", "Anthropic", "xAI"). */
  provider: string;
  model: string;
  totalSpend: number;
  tokensIn: number;
  tokensOut: number;
  onClick: () => void;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return tokens.toString();
}

export function CostFooterChip({
  provider,
  model,
  totalSpend,
  tokensIn,
  tokensOut,
  onClick,
}: CostFooterChipProps) {
  const [showTokens, setShowTokens] = useState(false);
  const { dot } = providerVisuals(provider);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setShowTokens(true)}
      onMouseLeave={() => setShowTokens(false)}
      className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full hover:border-[var(--border-default)] transition-all h-8"
    >
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-[var(--text-sm)] text-[var(--text-secondary)] font-medium">
          {model}
        </span>
      </div>
      <div className="h-3 w-px bg-[var(--border-subtle)]" />
      <span className="text-[var(--text-sm)] font-mono text-[var(--text-primary)]">
        ${totalSpend.toFixed(2)}
      </span>
      {showTokens && (
        <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono">
          {formatTokens(tokensIn)} in / {formatTokens(tokensOut)} out
        </span>
      )}
    </button>
  );
}
