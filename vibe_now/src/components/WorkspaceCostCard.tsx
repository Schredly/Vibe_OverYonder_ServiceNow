import { providerVisuals } from '../lib/providerVisuals';

export interface ProviderBreakdown {
  /** Provider id from the dynamic registry. */
  provider: string;
  spend: number;
  percentage: number;
}

interface WorkspaceCostCardProps {
  totalSpend: number;
  /** Last N days of spend (typically 14). The sparkline scales to the max value. */
  dailySpend: number[];
  providers: ProviderBreakdown[];
  onViewDetails: () => void;
}

export function WorkspaceCostCard({
  totalSpend,
  dailySpend,
  providers,
  onViewDetails,
}: WorkspaceCostCardProps) {
  // Guard against an all-zero spend history so the sparkline still renders
  // (max=0 would divide-by-zero into NaN%).
  const maxSpend = Math.max(...dailySpend, 0.01);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          This Workspace
        </span>
      </div>

      <div className="mb-4">
        <div className="text-[1.75rem] font-mono font-semibold text-[var(--text-primary)] leading-none">
          ${totalSpend.toFixed(2)}
        </div>
        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1">
          Total spend
        </div>
      </div>

      <div className="mb-4 h-12 flex items-end gap-0.5">
        {dailySpend.map((spend, index) => (
          <div
            key={index}
            className="flex-1 bg-[var(--primary)] opacity-60 hover:opacity-100 transition-opacity rounded-t-sm"
            style={{ height: `${(spend / maxSpend) * 100}%` }}
            title={`Day ${index + 1}: $${spend.toFixed(2)}`}
          />
        ))}
      </div>

      <div className="mb-3">
        <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--bg-hover)]">
          {providers.map((p) => (
            <div
              key={p.provider}
              className="transition-all"
              style={{
                width: `${p.percentage}%`,
                backgroundColor: providerVisuals(p.provider).dot,
              }}
              title={`${p.provider}: $${p.spend.toFixed(2)} (${p.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {providers.map((p) => (
          <div key={p.provider} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: providerVisuals(p.provider).dot }}
            />
            <span className="text-[var(--text-xs)] text-[var(--text-secondary)]">
              {p.provider}
            </span>
            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono">
              {p.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onViewDetails}
        className="text-[var(--text-xs)] text-[var(--primary)] hover:underline"
      >
        View details
      </button>
    </div>
  );
}
