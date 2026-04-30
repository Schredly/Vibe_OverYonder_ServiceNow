import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tabs } from './Tabs';
import { Button } from './Button';
import { TrendSparkline } from './TrendSparkline';
import { useUsageSummary, useVersionRollups } from '../lib/usageHooks';
import { providerVisuals } from '../lib/providerVisuals';

interface ProjectAnalytics {
  name: string;
  tokens: number;
  cost: number;
  lastUsed: string;
  trend: number[];
  trendDirection: 'up' | 'down' | 'flat';
}

interface VersionAnalytics {
  version: string;
  date: string;
  tokens: number;
  cost: number;
}

interface ProviderAnalytics {
  provider: 'Anthropic' | 'OpenAI' | 'xAI' | 'Google';
  totalTokens: number;
  totalCost: number;
  avgCostPerToken: number;
  projectsUsed: number;
  lastUsed: string;
  trend: 'up' | 'down' | 'flat';
}

interface PricingRule {
  provider: string;
  model: string;
  inputPrice: number;
  outputPrice: number;
  unit: '1K' | '1M';
  markup: number;
  bundledTokens: number;
}

interface CostAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, the Versions tab loads versions for this project. When null,
   *  the tab still loads but shows versions across all projects. */
  activeProjectId?: string | null;
}

export function CostAnalyticsModal({
  isOpen,
  onClose,
  activeProjectId,
}: CostAnalyticsModalProps) {
  // Pricing tab — local edit state. Persistence to /api/pricing will land
  // alongside the pricing-edit endpoint; until then edits don't survive
  // a modal close. Backend pricing seed in vibe_now_api/src/lib/pricing.ts
  // remains the source of truth for cost computation.
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    { provider: 'Anthropic', model: 'Claude Opus 4.7', inputPrice: 15, outputPrice: 75, unit: '1M', markup: 0, bundledTokens: 0 },
    { provider: 'OpenAI', model: 'GPT-5', inputPrice: 2.5, outputPrice: 10, unit: '1M', markup: 0, bundledTokens: 0 },
    { provider: 'OpenAI', model: 'GPT-5 Mini', inputPrice: 0.25, outputPrice: 2, unit: '1M', markup: 0, bundledTokens: 0 },
    { provider: 'Anthropic', model: 'Claude Sonnet 4.6', inputPrice: 3, outputPrice: 15, unit: '1M', markup: 0, bundledTokens: 0 },
    { provider: 'Google', model: 'Gemini 2.5 Pro', inputPrice: 1.25, outputPrice: 5, unit: '1M', markup: 0, bundledTokens: 0 },
  ]);

  // Live usage rollups — refresh on a 10s interval while the modal is open.
  const { summary } = useUsageSummary(isOpen);
  const { versions } = useVersionRollups(activeProjectId ?? null);

  if (!isOpen) return null;

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toLocaleString();
  };

  // Backend-derived projects, versions, providers. Trend arrays are flat
  // until per-project per-day breakdowns land — for now we surface a
  // single-point "trend" so the UI doesn't break.
  const projectsData: ProjectAnalytics[] = (summary?.byProject ?? []).map((p) => ({
    name: p.projectName,
    tokens: p.totalTokens,
    cost: p.billableCost,
    lastUsed: '—',
    trend: [p.billableCost],
    trendDirection: 'flat' as const,
  }));

  const versionsData: VersionAnalytics[] = versions.map((v) => ({
    version: `v${v.versionNumber}`,
    date: '—',
    tokens: v.totalTokens,
    cost: v.billableCost,
  }));

  const providersData: ProviderAnalytics[] = (summary?.byProvider ?? []).map((p) => ({
    // The component types provider as a closed union historically; cast at the
    // boundary so an unknown provider id (xAI added later, etc.) still renders.
    provider: p.provider as ProviderAnalytics['provider'],
    totalTokens: p.totalTokens,
    totalCost: p.billableCost,
    avgCostPerToken: p.totalTokens > 0 ? p.billableCost / p.totalTokens : 0,
    projectsUsed: 0,
    lastUsed: p.lastCallAt ?? '—',
    trend: 'flat' as const,
  }));

  // Provider colors come from the same registry the cost cards use so dot,
  // chip, and donut all match.
  const providerColors = (provider: string) => providerVisuals(provider).dot;

  const getTrendIcon = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-[var(--danger)]" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-[var(--success)]" />;
      default:
        return <Minus className="w-4 h-4 text-[var(--text-tertiary)]" />;
    }
  };

  // Guard against an empty versions list — Math.max() with no args is -∞,
  // which would NaN-out the bar heights below.
  const maxCost = versionsData.length > 0 ? Math.max(...versionsData.map((v) => v.cost)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] animate-[scaleIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">
              Cost Analytics
            </h2>
            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-1">
              Comprehensive workspace cost analysis and pricing configuration
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Content */}
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
                          <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-semibold">
                            Project
                          </th>
                          <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-semibold">
                            Tokens
                          </th>
                          <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-semibold">
                            Cost
                          </th>
                          <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-semibold">
                            Last Used
                          </th>
                          <th className="text-right py-3 px-4 text-[var(--text-tertiary)] font-semibold">
                            Trend
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectsData.map((project, index) => (
                          <tr
                            key={index}
                            className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[var(--text-primary)]">
                                  {project.name}
                                </span>
                                {getTrendIcon(project.trendDirection)}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-mono text-[var(--text-primary)]">
                              {formatTokens(project.tokens)}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                              ${project.cost.toFixed(2)}
                            </td>
                            <td className="py-4 px-4 text-[var(--text-tertiary)] font-mono text-sm">
                              {project.lastUsed}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex justify-end">
                                <TrendSparkline
                                  data={project.trend}
                                  width={80}
                                  height={24}
                                  color={
                                    project.trendDirection === 'up'
                                      ? 'var(--danger)'
                                      : project.trendDirection === 'down'
                                      ? 'var(--success)'
                                      : 'var(--text-tertiary)'
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ),
              },
              {
                id: 'versions',
                label: 'By Version',
                content: (
                  <div className="space-y-6">
                    <div className="flex items-end gap-2 h-64">
                      {versionsData.map((version, index) => (
                        <div key={index} className="flex-1 flex flex-col justify-end items-center gap-2">
                          <div className="text-center mb-2">
                            <div className="text-[var(--text-xs)] font-mono font-semibold text-[var(--text-primary)]">
                              ${version.cost.toFixed(2)}
                            </div>
                            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono">
                              {formatTokens(version.tokens)}
                            </div>
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-[var(--primary)] to-[var(--accent-cyan)] rounded-t-md hover:opacity-80 transition-opacity cursor-pointer"
                            style={{ height: `${(version.cost / maxCost) * 200}px` }}
                            title={`${version.version}: $${version.cost.toFixed(2)}`}
                          />
                          <div className="text-center mt-2">
                            <div className="text-[var(--text-xs)] font-semibold text-[var(--text-primary)]">
                              {version.version}
                            </div>
                            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                              {version.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4 pt-6 border-t border-[var(--border-subtle)]">
                      <div className="bg-[var(--bg-hover)] rounded-[var(--radius-md)] p-4">
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">
                          Total Versions
                        </div>
                        <div className="text-[1.5rem] font-mono font-semibold text-[var(--text-primary)]">
                          {versionsData.length}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-hover)] rounded-[var(--radius-md)] p-4">
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">
                          Avg Cost/Version
                        </div>
                        <div className="text-[1.5rem] font-mono font-semibold text-[var(--text-primary)]">
                          ${(versionsData.reduce((sum, v) => sum + v.cost, 0) / versionsData.length).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-hover)] rounded-[var(--radius-md)] p-4">
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">
                          Total Tokens
                        </div>
                        <div className="text-[1.5rem] font-mono font-semibold text-[var(--text-primary)]">
                          {formatTokens(versionsData.reduce((sum, v) => sum + v.tokens, 0))}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-hover)] rounded-[var(--radius-md)] p-4">
                        <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">
                          Highest Cost
                        </div>
                        <div className="text-[1.5rem] font-mono font-semibold text-[var(--text-primary)]">
                          ${maxCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: 'providers',
                label: 'By Provider',
                content: (
                  <div className="grid grid-cols-2 gap-4">
                    {providersData.map((provider, index) => (
                      <div
                        key={index}
                        className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 hover:shadow-[var(--shadow-md)] transition-all"
                      >
                        {/* Provider Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: providerColors(provider.provider) }}
                            />
                            <h3 className="font-semibold text-[var(--text-primary)]">
                              {provider.provider}
                            </h3>
                          </div>
                          {getTrendIcon(provider.trend)}
                        </div>

                        {/* Metrics Grid */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                              Total Cost
                            </span>
                            <span className="text-[1.25rem] font-mono font-semibold text-[var(--text-primary)]">
                              ${provider.totalCost.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between items-baseline">
                            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                              Total Tokens
                            </span>
                            <span className="text-[var(--text-base)] font-mono text-[var(--text-secondary)]">
                              {formatTokens(provider.totalTokens)}
                            </span>
                          </div>

                          <div className="flex justify-between items-baseline">
                            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                              Avg Cost/Token
                            </span>
                            <span className="text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
                              ${provider.avgCostPerToken.toFixed(8)}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-between items-baseline">
                            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                              Projects Used
                            </span>
                            <span className="text-[var(--text-sm)] font-mono text-[var(--text-secondary)]">
                              {provider.projectsUsed}
                            </span>
                          </div>

                          <div className="flex justify-between items-baseline">
                            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                              Last Used
                            </span>
                            <span className="text-[var(--text-xs)] font-mono text-[var(--text-tertiary)]">
                              {provider.lastUsed}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: 'pricing',
                label: 'Pricing Rules',
                content: (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {pricingRules.map((rule, index) => (
                      <div
                        key={index}
                        className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5"
                      >
                        {/* Rule Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: providerColors(rule.provider) }}
                          />
                          <h3 className="font-semibold text-[var(--text-primary)]">
                            {rule.provider}
                          </h3>
                          <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                            / {rule.model}
                          </span>
                        </div>

                        {/* Pricing Fields */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
                              Input Token Price
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">$</span>
                              <input
                                type="number"
                                value={rule.inputPrice}
                                onChange={(e) => {
                                  const newRules = [...pricingRules];
                                  newRules[index].inputPrice = parseFloat(e.target.value);
                                  setPricingRules(newRules);
                                }}
                                className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
                              Output Token Price
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">$</span>
                              <input
                                type="number"
                                value={rule.outputPrice}
                                onChange={(e) => {
                                  const newRules = [...pricingRules];
                                  newRules[index].outputPrice = parseFloat(e.target.value);
                                  setPricingRules(newRules);
                                }}
                                className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
                              Unit
                            </label>
                            <select
                              value={rule.unit}
                              onChange={(e) => {
                                const newRules = [...pricingRules];
                                newRules[index].unit = e.target.value as '1K' | '1M';
                                setPricingRules(newRules);
                              }}
                              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                            >
                              <option value="1K">Per 1K</option>
                              <option value="1M">Per 1M</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
                              Markup %
                            </label>
                            <input
                              type="number"
                              value={rule.markup}
                              onChange={(e) => {
                                const newRules = [...pricingRules];
                                newRules[index].markup = parseFloat(e.target.value);
                                setPricingRules(newRules);
                              }}
                              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
                              Bundle Included Tokens
                            </label>
                            <input
                              type="number"
                              value={rule.bundledTokens}
                              onChange={(e) => {
                                const newRules = [...pricingRules];
                                newRules[index].bundledTokens = parseInt(e.target.value);
                                setPricingRules(newRules);
                              }}
                              placeholder="0 = no bundle"
                              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                      <Button variant="ghost" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={() => console.log('Saved:', pricingRules)}>
                        Save Pricing Rules
                      </Button>
                    </div>
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
