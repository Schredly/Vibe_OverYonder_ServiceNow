import { Sparkles } from 'lucide-react';

interface BuildCostEstimateProps {
  minCost: number;
  maxCost: number;
  /** Reserved for the future "Save & Build vN" copy on the panel. Currently
   *  rendered by the parent button; kept on the type so the API stays
   *  stable when we move the label here. */
  version?: string;
  model: string;
  avgTokens: number;
  recentRefinementSize: 'small' | 'medium' | 'large';
}

export function BuildCostEstimate({
  minCost,
  maxCost,
  model,
  avgTokens,
  recentRefinementSize,
}: BuildCostEstimateProps) {
  const refinementLabels = {
    small: 'Small refinement',
    medium: 'Medium refinement',
    large: 'Large refinement',
  };

  return (
    <div className="space-y-3">
      {/* Cost Estimate */}
      <div className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Estimated Build Cost
          </span>
        </div>

        <div className="mb-3">
          <div className="text-[1.75rem] font-mono font-semibold text-[var(--text-primary)] leading-none">
            ${minCost.toFixed(2)} - ${maxCost.toFixed(2)}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
            Based on:
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              {refinementLabels[recentRefinementSize]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              Model: {model}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
              Avg {(avgTokens / 1000).toFixed(1)}k tokens per build
            </span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic px-1">
        Actual cost tracked after execution
      </div>
    </div>
  );
}
