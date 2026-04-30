import { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Tabs } from './Tabs';
import { providerVisuals } from '../lib/providerVisuals';

export interface ProjectCost {
  name: string;
  model: string;
  turns: number;
  builds: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export type TurnKind = 'chat' | 'spec-extract' | 'build' | 'build-retry';

export interface TurnDetail {
  timestamp: string;
  kind: TurnKind;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  preview: string;
  fullMessage?: string;
}

export interface ProviderSummary {
  /** Provider id from the dynamic registry. */
  provider: string;
  totalTokens: number;
  totalCost: number;
  avgCostPerTurn: number;
  lastCall: string;
}

interface CostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectCost[];
  turns: TurnDetail[];
  providers: ProviderSummary[];
}

type ProjectSortKey = keyof ProjectCost;

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return tokens.toLocaleString();
}

function costHeatmapClass(cost: number, maxCost: number): string {
  if (maxCost <= 0) return 'bg-[var(--bg-hover)] text-[var(--text-primary)]';
  const intensity = cost / maxCost;
  if (intensity > 0.7) return 'bg-[#FEE2E2] dark:bg-[#5C1F1A] text-[var(--danger-text)]';
  if (intensity > 0.4) return 'bg-[#FEF3C7] dark:bg-[#5D3A0A] text-[var(--warning-text)]';
  return 'bg-[var(--bg-hover)] text-[var(--text-primary)]';
}

const KIND_CHIP: Record<TurnKind, string> = {
  chat: 'bg-[#E3F2FD] text-[#1565C0] dark:bg-[#1E3A5F] dark:text-[#90CAF9]',
  'spec-extract': 'bg-[#F3E5F5] text-[#6A1B9A] dark:bg-[#3E2352] dark:text-[#CE93D8]',
  build: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  'build-retry': 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
};

export function CostDetailModal({
  isOpen,
  onClose,
  projects,
  turns,
  providers,
}: CostDetailModalProps) {
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<ProjectSortKey>('cost');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (!isOpen) return null;

  const toggleSort = (key: ProjectSortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (aVal === bVal) return 0;
    return aVal > bVal ? modifier : -modifier;
  });

  const maxCost = Math.max(...projects.map((p) => p.cost), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] animate-[scaleIn_0.2s_ease-out] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">
            Cost Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <Tabs
            tabs={[
              {
                id: 'projects',
                label: 'By Project',
                content: (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[var(--text-sm)]">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="text-left py-3 px-3 text-[var(--text-tertiary)] font-medium cursor-pointer hover:text-[var(--text-primary)]" onClick={() => toggleSort('name')}>
                            Project
                          </th>
                          <th className="text-left py-3 px-3 text-[var(--text-tertiary)] font-medium cursor-pointer hover:text-[var(--text-primary)]" onClick={() => toggleSort('model')}>
                            Model
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium cursor-pointer hover:text-[var(--text-primary)]" onClick={() => toggleSort('turns')}>
                            Turns
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium cursor-pointer hover:text-[var(--text-primary)]" onClick={() => toggleSort('builds')}>
                            Builds
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium">
                            Tokens In/Out
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium cursor-pointer hover:text-[var(--text-primary)]" onClick={() => toggleSort('cost')}>
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedProjects.map((project, index) => (
                          <tr key={index} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="py-3 px-3 text-[var(--text-primary)] font-medium">
                              {project.name}
                            </td>
                            <td className="py-3 px-3 text-[var(--text-secondary)]">
                              {project.model}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-primary)]">
                              {project.turns}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-primary)]">
                              {project.builds}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                              {formatTokens(project.tokensIn)} / {formatTokens(project.tokensOut)}
                            </td>
                            <td className={`py-3 px-3 text-right font-mono font-medium ${costHeatmapClass(project.cost, maxCost)} rounded`}>
                              ${project.cost.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ),
              },
              {
                id: 'turns',
                label: 'By Turn',
                content: (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {turns.map((turn, index) => (
                      <div key={index} className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
                        <button
                          onClick={() => setExpandedTurn(expandedTurn === index ? null : index)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
                        >
                          {expandedTurn === index ? (
                            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                          )}
                          <div className="flex-1 grid grid-cols-12 gap-3 items-center text-[var(--text-sm)]">
                            <div className="col-span-2 text-[var(--text-tertiary)] font-mono">
                              {turn.timestamp}
                            </div>
                            <div className="col-span-2">
                              <span className={`px-2 py-0.5 rounded text-[var(--text-xs)] font-medium ${KIND_CHIP[turn.kind]}`}>
                                {turn.kind}
                              </span>
                            </div>
                            <div className="col-span-2 text-[var(--text-secondary)]">
                              {turn.model}
                            </div>
                            <div className="col-span-3 text-[var(--text-secondary)] font-mono text-right">
                              {formatTokens(turn.tokensIn + turn.tokensOut)}
                            </div>
                            <div className="col-span-2 text-right font-mono font-medium text-[var(--text-primary)]">
                              ${turn.cost.toFixed(3)}
                            </div>
                            <div className="col-span-1" />
                          </div>
                        </button>
                        {expandedTurn === index && (
                          <div className="px-3 pb-3 pt-1 border-t border-[var(--border-subtle)] bg-[var(--bg-hover)]">
                            <div className="text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
                              {turn.fullMessage ?? turn.preview}
                            </div>
                            <div className="flex gap-4 text-[var(--text-xs)] font-mono text-[var(--text-tertiary)]">
                              <span>In: {formatTokens(turn.tokensIn)}</span>
                              <span>Out: {formatTokens(turn.tokensOut)}</span>
                              <span>Total: {formatTokens(turn.tokensIn + turn.tokensOut)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: 'providers',
                label: 'By Provider',
                content: (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[var(--text-sm)]">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <th className="text-left py-3 px-3 text-[var(--text-tertiary)] font-medium">
                            Provider
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium">
                            Total Tokens
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium">
                            Total Cost
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium">
                            Avg / Turn
                          </th>
                          <th className="text-right py-3 px-3 text-[var(--text-tertiary)] font-medium">
                            Last Call
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {providers.map((provider, index) => (
                          <tr key={index} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="py-3 px-3">
                              <span className={`px-3 py-1 rounded-full text-[var(--text-xs)] font-medium ${providerVisuals(provider.provider).chipClass}`}>
                                {provider.provider}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-primary)]">
                              {formatTokens(provider.totalTokens)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-medium text-[var(--text-primary)]">
                              ${provider.totalCost.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                              ${provider.avgCostPerTurn.toFixed(3)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-[var(--text-tertiary)]">
                              {provider.lastCall}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
