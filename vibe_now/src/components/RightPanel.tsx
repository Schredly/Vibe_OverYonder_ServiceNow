import {
  FileCode,
  Download,
  Rocket,
  Hammer,
  Eye,
  Settings as SettingsIcon,
  ChevronRight,
  CheckCircle2,
  Lock,
  Globe,
  Image as ImageIcon,
  Figma,
  FileType,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useMemo } from 'react';
import type {
  BuildStatus,
  ConsultantMode,
  DeployLinks,
  DeployStatus,
  ProjectAsset,
} from '../types';
import { Button } from './Button';
import { Collapsible } from './Collapsible';
import { StatusChip } from './StatusChip';
import { Card } from './Card';
import { DonutChart } from './DonutChart';
import { TrendSparkline } from './TrendSparkline';
import { VersionHistory } from './VersionHistory';
import { useUsageSummary, deriveProjectView, padDailySpend } from '../lib/usageHooks';
import { providerVisuals } from '../lib/providerVisuals';
import type { ProposalState, Spec } from '../types';

interface RightPanelProps {
  spec: Spec | null;
  proposalState?: ProposalState;
  buildStatus?: BuildStatus;
  deployStatus?: DeployStatus;
  deployLinks?: DeployLinks | null;
  onBuild?: () => void;
  /** When called without arguments, deploys the project's current
   *  greenfield workspace (legacy path). When called with a `versionId`,
   *  deploys the frozen snapshot at that version. */
  onDeploy?: (versionId?: string) => void;
  onViewPrototype?: () => void;
  onExport?: () => void;
  onPortalChange?: (portal: { enabled: boolean; urlSuffix?: string }) => void;
  consultantMode?: ConsultantMode;
  onOpenSettings?: () => void;
  /** When set, the View Prototype panel renders a "↗ new tab" button next
   *  to the inline-viewer button so users can park the preview elsewhere
   *  and keep working in vibe_now. */
  projectId?: string | null;
  /** Click handler for the "View analytics" link in the Usage & Cost card.
   *  When omitted, the link is hidden — App owns the modal state. */
  onOpenCostAnalytics?: () => void;
}

export function RightPanel({
  spec,
  proposalState = 'none',
  buildStatus = 'idle',
  deployStatus = 'idle',
  deployLinks,
  onBuild,
  onDeploy,
  onViewPrototype,
  onExport,
  onPortalChange,
  consultantMode = 'on',
  onOpenSettings,
  projectId,
  onOpenCostAnalytics,
}: RightPanelProps) {
  const { summary } = useUsageSummary(true);
  const projectView = deriveProjectView(summary, projectId ?? null);
  const projectRollup = projectView.rollup;
  // Same default as LiveFigmaPreview so the new-tab URL matches the inline iframe.
  const previewNewTabUrl = useMemo(() => {
    if (!projectId) return null;
    const base = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:5275';
    return `${base}/api/figma/preview-bundle/${encodeURIComponent(projectId)}?t=${Date.now()}`;
  }, [projectId]);
  const isConsultant = consultantMode === 'on';
  const approved = proposalState === 'approved';
  const building = buildStatus === 'building';
  const built = buildStatus === 'success';
  const deploying = deployStatus === 'deploying';
  const deployed = deployStatus === 'deployed';
  const buildLabel =
    buildStatus === 'building' ? 'Building…' : buildStatus === 'success' ? 'Rebuild' : 'Build';
  const deployLabel = deploying ? 'Deploying…' : deployed ? 'Deployed' : 'Deploy';
  return (
    <aside className="w-[420px] h-screen bg-[var(--bg-card)] border-l border-[var(--border-subtle)] flex flex-col shrink-0">
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode className="w-5 h-5 text-[var(--accent-cyan)] shrink-0" />
            <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">
              Living Spec
            </h2>
          </div>
          {approved && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-bg)] text-[var(--success-text)] text-[var(--text-xs)] font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Approved
            </span>
          )}
        </div>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
          {approved
            ? 'Spec locked. Ready to build and deploy.'
            : 'Updates live as the conversation progresses.'}
        </p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-2 inline-flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          title="Change in Settings"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConsultant ? 'bg-[var(--primary)]' : 'bg-[var(--text-tertiary)]'
            }`}
          />
          {isConsultant
            ? 'Guided by consultant-style recommendations'
            : 'Focused on direct build planning'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {spec ? (
          <>
            <Card padding="md">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{spec.title}</h3>
              <p className="text-[var(--text-base)] text-[var(--text-secondary)] leading-relaxed">
                {spec.description}
              </p>
            </Card>

            <UsageAndCostCard
              projectRollup={projectRollup}
              workspaceTotalSpend={projectView.workspaceTotalSpend}
              providerMix={projectView.workspaceProviderMix}
              dailySpend={projectView.workspaceDailySpend}
              onOpenAnalytics={onOpenCostAnalytics}
            />

            <VersionHistory
              projectId={projectId ?? null}
              onDeployVersion={onDeploy ? (v) => onDeploy(v.id) : undefined}
            />

            <Collapsible
              title="Features"
              defaultOpen
              icon={<ChevronRight className="w-4 h-4" />}
            >
              <ul className="space-y-2">
                {spec.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-[var(--text-base)] text-[var(--text-primary)]"
                  >
                    <span className="text-[var(--accent-cyan)] mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Collapsible>

            <Collapsible title="End-user Portal" defaultOpen icon={<Globe className="w-4 h-4" />}>
              <PortalEditor spec={spec} onPortalChange={onPortalChange} />
            </Collapsible>

            <Collapsible title="UI Track" defaultOpen icon={<Layers className="w-4 h-4" />}>
              <UiTrackSummary spec={spec} />
            </Collapsible>

            {spec.assets && spec.assets.length > 0 && (
              <Collapsible
                title={`Brand Assets (${spec.assets.length})`}
                defaultOpen
                icon={<ImageIcon className="w-4 h-4" />}
              >
                <ul className="space-y-2">
                  {spec.assets.map((a: ProjectAsset) => {
                    const icon =
                      a.kind === 'figma' ? (
                        <Figma className="w-4 h-4 text-[var(--accent-cyan)]" />
                      ) : a.kind === 'image' || a.kind === 'logo' ? (
                        <ImageIcon className="w-4 h-4 text-[var(--accent-cyan)]" />
                      ) : (
                        <FileType className="w-4 h-4 text-[var(--accent-cyan)]" />
                      );
                    const kb =
                      a.size < 1024
                        ? `${a.size} B`
                        : a.size < 1024 * 1024
                          ? `${(a.size / 1024).toFixed(a.size > 1024 * 100 ? 0 : 1)} KB`
                          : `${(a.size / (1024 * 1024)).toFixed(1)} MB`;
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-primary)]"
                      >
                        {icon}
                        <span className="font-mono truncate flex-1">{a.name}</span>
                        {a.role && a.role !== 'other' && (
                          <span className="text-[var(--text-xs)] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                            {a.role}
                          </span>
                        )}
                        <span className="text-[var(--text-tertiary)] text-[var(--text-xs)] shrink-0">
                          {kb}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Collapsible>
            )}

            <Collapsible title="Technical Details" icon={<SettingsIcon className="w-4 h-4" />}>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[var(--text-sm)] font-semibold text-[var(--text-tertiary)] uppercase mb-2">
                    Tables
                  </h4>
                  {spec.tables.length > 0 ? (
                    <div className="space-y-3">
                      {spec.tables.map((t) => (
                        <div
                          key={t.name}
                          className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <code className="font-mono text-[var(--text-sm)] text-[var(--text-primary)]">
                              {t.name}
                            </code>
                            {t.extends && (
                              <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                                extends <code className="font-mono">{t.extends}</code>
                              </span>
                            )}
                          </div>
                          {t.columns.length > 0 ? (
                            <ul className="space-y-1">
                              {t.columns.map((c) => (
                                <li
                                  key={c.name}
                                  className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--text-secondary)] font-mono"
                                >
                                  <span>{c.name}</span>
                                  <span className="text-[var(--text-tertiary)]">·</span>
                                  <span className="text-[var(--text-tertiary)]">
                                    {c.type === 'reference' && c.reference
                                      ? `→ ${c.reference}`
                                      : c.type}
                                  </span>
                                  {c.mandatory && (
                                    <span className="text-[var(--warning)]">required</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic">
                              no columns yet
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {spec.technicalDetails.tables.map((table, index) => (
                        <StatusChip key={index} status="neutral">
                          {table}
                        </StatusChip>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-[var(--text-sm)] font-semibold text-[var(--text-tertiary)] uppercase mb-2">
                    Workflows
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {spec.technicalDetails.workflows.map((workflow, index) => (
                      <StatusChip key={index} status="info">
                        {workflow}
                      </StatusChip>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[var(--text-sm)] font-semibold text-[var(--text-tertiary)] uppercase mb-2">
                    UI Components
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {spec.technicalDetails.ui_components.map((component, index) => (
                      <StatusChip key={index} status="success">
                        {component}
                      </StatusChip>
                    ))}
                  </div>
                </div>
              </div>
            </Collapsible>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <FileCode className="w-12 h-12 text-[var(--text-tertiary)] mb-3" />
            <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
              The Living Spec will take shape here as the conversation progresses.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[var(--border-subtle)] space-y-3">
        {spec && !approved && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[var(--text-xs)]">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Approve the summary in the conversation to unlock Build.</span>
          </div>
        )}
        {spec && approved && !built && !building && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[var(--text-xs)]">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>A successful Build unlocks Deploy.</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="md"
            icon={
              <Hammer className={`w-4 h-4 ${building ? 'animate-[spin_2s_linear_infinite]' : ''}`} />
            }
            className="w-full"
            disabled={!spec || !approved || building || deploying}
            onClick={onBuild}
          >
            {buildLabel}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={
              <Rocket className={`w-4 h-4 ${deploying ? 'animate-[spin_2s_linear_infinite]' : ''}`} />
            }
            className="w-full"
            disabled={!spec || !built || deploying}
            onClick={onDeploy ? () => onDeploy() : undefined}
          >
            {deployLabel}
          </Button>
        </div>
        {built && spec?.portal?.enabled && spec.portal.urlSuffix && (
          <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] -mt-1">
            Will deploy portal to{' '}
            <code className="font-mono text-[var(--text-secondary)]">/{spec.portal.urlSuffix}</code>
            {' '}— edit suffix above to change.
          </div>
        )}
        {built && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={<Eye className="w-4 h-4" />}
              className="flex-1"
              onClick={onViewPrototype}
            >
              View Prototype
            </Button>
            {previewNewTabUrl && (
              <a
                href={previewNewTabUrl}
                target="_blank"
                rel="noreferrer"
                title="Open prototype in a new tab"
                className="inline-flex items-center justify-center px-3 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
        {deployed && deployLinks && (
          <div className="space-y-2 px-3 py-3 rounded-[var(--radius-md)] bg-[var(--success-bg)] border border-[var(--success)]/30">
            <div className="flex items-center gap-2 text-[var(--success-text)] text-[var(--text-sm)] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Live on dev378814
            </div>
            <a
              href={deployLinks.app}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--primary)] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open scoped app
            </a>
            {deployLinks.portal && (
              <a
                href={deployLinks.portal}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--primary)] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Service Portal
              </a>
            )}
            {deployLinks.rollbackUrl && (
              <a
                href={deployLinks.rollbackUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-secondary)] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Rollback (undo this install)
              </a>
            )}
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono">
              {deployLinks.scope}
            </div>
          </div>
        )}
        <Button
          variant="secondary"
          size="md"
          icon={<Download className="w-4 h-4" />}
          className="w-full"
          disabled={!spec}
          onClick={onExport}
        >
          Export Specification
        </Button>
      </div>
    </aside>
  );
}

function UiTrackSummary({ spec }: { spec: Spec }) {
  const ui = spec.uiTrack;
  const customUiNeeded = ui?.customUiNeeded ?? null;
  const inputTier = ui?.inputTier ?? null;
  const fidelity = ui?.expectedFidelity ?? null;
  const audience = ui?.audienceTier ?? 'audience-a';

  const gateChip = (() => {
    if (customUiNeeded === null)
      return { variant: 'neutral' as const, label: 'Gate not yet answered' };
    if (customUiNeeded === false)
      return { variant: 'success' as const, label: 'Backend only — Track B skipped' };
    return { variant: 'info' as const, label: 'Custom UI — Track B running' };
  })();

  const tierChip = (() => {
    if (customUiNeeded !== true) return null;
    if (inputTier === null) return { variant: 'neutral' as const, label: 'Tier not yet classified' };
    if (inputTier === 'sketch') return { variant: 'info' as const, label: 'Tier 1 — Sketch' };
    if (inputTier === 'partial-figma')
      return { variant: 'info' as const, label: 'Tier 2 — Partial Figma' };
    return { variant: 'success' as const, label: 'Tier 3 — Full Figma' };
  })();

  const fidelityChip = (() => {
    if (customUiNeeded !== true) return null;
    if (fidelity === null) return null;
    if (fidelity === 'approximate')
      return { variant: 'warning' as const, label: 'Faithfulness: approximate' };
    if (fidelity === 'medium') return { variant: 'info' as const, label: 'Faithfulness: medium' };
    return { variant: 'success' as const, label: 'Faithfulness: high' };
  })();

  const audienceLabel =
    audience === 'audience-b'
      ? 'Paid Technology Partner — Path C available'
      : 'PDI / non-partner — Path A (Service Portal) only';

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
          Audience
        </div>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)] leading-relaxed">
          {audienceLabel}
        </p>
      </div>

      <div>
        <div className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
          Track-B gate
        </div>
        <StatusChip status={gateChip.variant}>{gateChip.label}</StatusChip>
      </div>

      {tierChip && (
        <div>
          <div className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
            Input fidelity tier
          </div>
          <StatusChip status={tierChip.variant}>{tierChip.label}</StatusChip>
        </div>
      )}

      {fidelityChip && (
        <div>
          <div className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
            Expected output
          </div>
          <StatusChip status={fidelityChip.variant}>{fidelityChip.label}</StatusChip>
        </div>
      )}

      {customUiNeeded === null && (
        <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
          Answer the Service Portal question in the chat to set this. See{' '}
          <code className="font-mono">vibe_overyonder.md §0.4</code> for the audience/tier model.
        </p>
      )}

      {customUiNeeded === true && inputTier === null && (
        <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
          Attach a screenshot, partial Figma frames, or a full Figma export to classify the tier.
        </p>
      )}
    </div>
  );
}

function PortalEditor({
  spec,
  onPortalChange,
}: {
  spec: Spec;
  onPortalChange?: (p: { enabled: boolean; urlSuffix?: string }) => void;
}) {
  const enabled = spec.portal?.enabled === true;
  const suffix = spec.portal?.urlSuffix ?? '';
  const handleToggle = () => onPortalChange?.({ enabled: !enabled, urlSuffix: suffix });
  const handleSuffix = (v: string) => {
    const clean = v
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '')
      .slice(0, 40);
    onPortalChange?.({ enabled, urlSuffix: clean });
  };
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleToggle}
        role="switch"
        aria-checked={enabled}
        className="w-full flex items-center justify-between gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] hover:border-[var(--primary)]/40 transition-colors text-left"
      >
        <div className="min-w-0">
          <div className="text-[var(--text-base)] font-semibold text-[var(--text-primary)]">
            Service Portal
          </div>
          <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
            {enabled ? 'Enabled — will be built and deployed' : 'Off — workspace only'}
          </div>
        </div>
        <span
          className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border-subtle)]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </span>
      </button>

      <div className={enabled ? '' : 'opacity-60'}>
        <label className="block text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
          URL suffix
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-sm)] text-[var(--text-tertiary)] font-mono">/</span>
          <input
            value={suffix}
            onChange={(e) => handleSuffix(e.target.value)}
            placeholder="e.g. fieldmkt"
            className="flex-1 px-2 py-1.5 font-mono text-[var(--text-sm)] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
          {suffix.length > 0 && (
            <button
              type="button"
              onClick={() => handleSuffix('')}
              title="Clear stored suffix"
              className="px-2 py-1 text-[var(--text-xs)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]"
            >
              Clear
            </button>
          )}
        </div>
        {suffix.length > 0 && (
          <p className="mt-2 text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
            Scope name will be{' '}
            <code className="font-mono text-[var(--text-secondary)]">
              x_1939459_{suffix.length > 8 ? suffix.slice(0, 8) : suffix}
            </code>
            {suffix.length > 8 && (
              <span className="text-[var(--danger)]">
                {' '}
                — "{suffix}" is {suffix.length} chars; PDIs cap scopes at 18 (8 after the
                prefix). Will truncate.
              </span>
            )}
            {!enabled && (
              <span className="block mt-1 text-[var(--warning)]">
                Portal toggle is off — suffix is stored but won't be deployed until you enable it.
              </span>
            )}
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-2 flex items-start gap-2">
        <Lock className="w-3.5 h-3.5 text-[var(--warning)] mt-0.5 shrink-0" />
        <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
          The portal the backend deploys today is a <strong>bare page</strong> at{' '}
          <code className="font-mono">/{suffix || 'your-suffix'}</code> with your logo attached —
          not a reproduction of your Figma mockup. The Figma-to-widget transpile is Phase 2 backend
          work and isn't running yet. The design-fidelity preview is a local visual target.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Usage & Cost card — bound to the live /api/usage/summary feed via the
// useUsageSummary hook upstream. The "rollup" prop is the active project's
// row when one exists; the workspace fields are aggregated across all
// projects so the card stays useful even before the user has any spend on
// the active project.
// ---------------------------------------------------------------------------

interface UsageAndCostCardProps {
  projectRollup:
    | {
        totalTokens: number;
        inputTokens: number;
        outputTokens: number;
        rawCost: number;
        billableCost: number;
        turns: number;
        builds: number;
      }
    | null;
  workspaceTotalSpend: number;
  providerMix: { provider: string; billableCost: number; totalTokens: number }[];
  dailySpend: { day: string; rawCost: number; billableCost: number }[];
  onOpenAnalytics?: () => void;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return tokens.toLocaleString();
}

function UsageAndCostCard({
  projectRollup,
  workspaceTotalSpend,
  providerMix,
  dailySpend,
  onOpenAnalytics,
}: UsageAndCostCardProps) {
  const projectTotal = projectRollup?.totalTokens ?? 0;
  const projectInput = projectRollup?.inputTokens ?? 0;
  const projectOutput = projectRollup?.outputTokens ?? 0;
  const projectCost = projectRollup?.billableCost ?? 0;
  const turns = projectRollup?.turns ?? 0;
  const avgPerTurn = turns > 0 ? projectCost / turns : 0;

  // Build donut segments from the workspace provider mix. Skip providers
  // with zero spend to avoid empty wedges. Total over visible providers
  // drives the percentage so "67% Anthropic / 33% OpenAI" sums to 100.
  const totalProviderSpend = providerMix.reduce(
    (sum, p) => sum + p.billableCost,
    0,
  );
  const donutSegments = providerMix
    .filter((p) => p.billableCost > 0)
    .map((p) => ({
      provider: p.provider,
      percentage:
        totalProviderSpend > 0 ? (p.billableCost / totalProviderSpend) * 100 : 0,
      color: providerVisuals(p.provider).dot,
    }));

  // Pad daily spend out to 14 days so the sparkline has a stable width even
  // when the user only had spend on a few days.
  const sparkData = padDailySpend(dailySpend, 14);

  // Forecast next 10 turns at the current avg-per-turn rate. Read-only;
  // no model assumptions beyond "the next 10 turns cost about as much as
  // the recent ones."
  const forecast = avgPerTurn * 10;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <span className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Usage &amp; Cost
        </span>
        {onOpenAnalytics && (
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="text-[var(--text-xs)] text-[var(--primary)] hover:underline"
          >
            View analytics
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">
              Project tokens
            </div>
            <div className="text-[1.25rem] font-mono font-semibold text-[var(--text-primary)] leading-none">
              {formatTokens(projectTotal)}
            </div>
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1 font-mono">
              {formatTokens(projectInput)} in / {formatTokens(projectOutput)} out
            </div>
          </div>
          <div>
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-1">
              Project cost
            </div>
            <div className="text-[1.25rem] font-mono font-semibold text-[var(--text-primary)] leading-none">
              ${projectCost.toFixed(2)}
            </div>
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1 font-mono">
              {turns} turn{turns === 1 ? '' : 's'} · ${avgPerTurn.toFixed(3)} avg
            </div>
          </div>
        </div>

        {donutSegments.length > 0 && (
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
              Workspace provider mix · ${workspaceTotalSpend.toFixed(2)} total
            </div>
            <DonutChart segments={donutSegments} size={64} />
          </div>
        )}

        {sparkData.some((v) => v > 0) && (
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                Last 14 days
              </div>
              {forecast > 0 && (
                <div className="text-[var(--text-xs)] font-mono text-[var(--accent-cyan)]">
                  Next 10 turns ~ ${forecast.toFixed(2)}
                </div>
              )}
            </div>
            <TrendSparkline
              data={sparkData}
              width={340}
              height={28}
              color="var(--accent-cyan)"
            />
          </div>
        )}

        {projectTotal === 0 && (
          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] italic">
            No refinements yet for this project — costs land here as you chat.
          </p>
        )}
      </div>
    </div>
  );
}
