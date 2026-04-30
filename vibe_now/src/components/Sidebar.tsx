import {
  Plus,
  Settings,
  FileText,
  Trash2,
  Pencil,
  Zap,
  Sparkles,
  FolderOpen,
  Folder,
  Github,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './Button';
import { ThemeToggle } from './ThemeToggle';
import { StatusChip } from './StatusChip';
import { WorkspaceCostCard } from './WorkspaceCostCard';
import { ProjectKebabMenu } from './ProjectKebabMenu';
import { useUsageSummary, padDailySpend } from '../lib/usageHooks';
import type { ConsultantMode, Project, ProjectStatus, StatusVariant } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectSelect: (id: string) => void;
  onNewIdea: () => void;
  onProjectDelete: (id: string) => void;
  onProjectEdit: (id: string) => void;
  consultantMode?: ConsultantMode;
  onOpenSettings?: () => void;
  /** When set, the workspace cost card's "View details" link calls this.
   *  Without it, the card still renders but the link is hidden. */
  onOpenCostAnalytics?: () => void;
  /** Click handler for the "Open existing package" button below New Idea. */
  onOpenPackage?: () => void;
  /** GitHub-storage actions surfaced via the per-project kebab menu. The
   *  backend (vibe_now_api/routes/github.ts — landing in a follow-up turn)
   *  exposes the matching endpoints; until then these resolve to no-ops
   *  passed in from App.tsx so the menu items are visible but inert. */
  onProjectPushToGithub?: (projectId: string) => void;
  onProjectPullFromGithub?: (projectId: string) => void;
  onProjectUnlinkGithub?: (projectId: string) => void;
  onProjectSwitchToLocal?: (projectId: string) => void;
}

const STATUS_VARIANT: Record<ProjectStatus, StatusVariant> = {
  active: 'info',
  deployed: 'success',
  draft: 'neutral',
};

export function Sidebar({
  projects,
  activeProjectId,
  onProjectSelect,
  onNewIdea,
  onProjectDelete,
  onProjectEdit,
  consultantMode = 'on',
  onOpenSettings,
  onOpenCostAnalytics,
  onOpenPackage,
  onProjectPushToGithub,
  onProjectPullFromGithub,
  onProjectUnlinkGithub,
  onProjectSwitchToLocal,
}: SidebarProps) {
  const isConsultant = consultantMode === 'on';
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const kebabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { summary } = useUsageSummary(true);
  const totalSpend = (summary?.byProject ?? []).reduce(
    (sum, p) => sum + p.billableCost,
    0,
  );
  const totalProviderSpend = (summary?.byProvider ?? []).reduce(
    (sum, p) => sum + p.billableCost,
    0,
  );
  const providerBreakdown = (summary?.byProvider ?? [])
    .filter((p) => p.billableCost > 0)
    .map((p) => ({
      provider: p.provider,
      spend: p.billableCost,
      percentage:
        totalProviderSpend > 0 ? (p.billableCost / totalProviderSpend) * 100 : 0,
    }));
  const dailySpend = padDailySpend(summary?.dailySpend ?? [], 14);
  const showCostCard = totalSpend > 0 || providerBreakdown.length > 0;
  return (
    <aside className="w-[280px] h-screen bg-[var(--bg-card)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">Vibe OverYonder</h1>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={onNewIdea}
          className="w-full"
        >
          New Idea
        </Button>
        {onOpenPackage && (
          <Button
            variant="secondary"
            size="md"
            icon={<FolderOpen className="w-4 h-4" />}
            onClick={onOpenPackage}
            className="w-full mt-2"
          >
            Open Existing Package
          </Button>
        )}
      </div>

      {showCostCard && (
        <div className="px-4 pt-4">
          <WorkspaceCostCard
            totalSpend={totalSpend}
            dailySpend={dailySpend}
            providers={providerBreakdown}
            onViewDetails={onOpenCostAnalytics ?? (() => {})}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 px-2">
          Your Projects
        </div>
        <div className="space-y-1">
          {projects.length === 0 && (
            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] px-2 py-1">
              No projects yet. Click "New Idea" to get started.
            </p>
          )}
          {projects.map((project) => {
            const isActive = activeProjectId === project.id;
            const storage = project.storage ?? { type: 'local' as const };
            return (
              <div
                key={project.id}
                className={`group relative rounded-[var(--radius-md)] transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FFF0EB] dark:bg-[#3D2418] border border-[var(--primary)]/20'
                    : 'hover:bg-[var(--bg-hover)] border border-transparent'
                }`}
              >
                <button
                  onClick={() => onProjectSelect(project.id)}
                  className="w-full text-left p-3 pr-16"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[var(--text-base)] font-medium line-clamp-1 ${
                        isActive ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {project.name}
                    </span>
                    <StatusChip status={STATUS_VARIANT[project.status]}>
                      {project.status}
                    </StatusChip>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                      {project.lastModified}
                    </span>
                    <StorageChip storage={storage} />
                  </div>
                </button>
                {/* Kebab is always visible (storage actions are not destructive
                    and need to be discoverable). The pencil/trash group below
                    stays hover-revealed because those operations are higher-risk. */}
                <button
                  ref={(el) => {
                    kebabRefs.current[project.id] = el;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenKebabId(openKebabId === project.id ? null : project.id);
                  }}
                  aria-label={`Storage actions for ${project.name}`}
                  className="absolute top-2 right-2 p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-2 right-9 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectEdit(project.id);
                    }}
                    aria-label={`Edit ${project.name}`}
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-active)] hover:text-[var(--accent-cyan)] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectDelete(project.id);
                    }}
                    aria-label={`Delete ${project.name}`}
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--bg-active)] hover:text-[var(--danger)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {openKebabId && (() => {
        const project = projects.find((p) => p.id === openKebabId);
        const storage = project?.storage ?? { type: 'local' as const };
        return (
          <ProjectKebabMenu
            isOpen={true}
            onClose={() => setOpenKebabId(null)}
            anchorEl={kebabRefs.current[openKebabId] ?? null}
            storage={storage}
            onPushNow={() => onProjectPushToGithub?.(openKebabId)}
            onPullFromRepo={() => onProjectPullFromGithub?.(openKebabId)}
            onOpenInGitHub={() => {
              if (storage.repoPath) {
                window.open(`https://github.com/${storage.repoPath}`, '_blank', 'noreferrer');
              }
            }}
            onUnlinkRepo={() => onProjectUnlinkGithub?.(openKebabId)}
            onSwitchToLocal={() => onProjectSwitchToLocal?.(openKebabId)}
          />
        );
      })()}

      <div className="p-4 border-t border-[var(--border-subtle)] space-y-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span className="flex items-center gap-3">
            <Sparkles
              className={`w-4 h-4 ${isConsultant ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}
            />
            <span className="text-[var(--text-base)]">Consultant Mode</span>
          </span>
          <span
            className={`text-[var(--text-xs)] font-semibold px-2 py-0.5 rounded-full ${
              isConsultant
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
            }`}
          >
            {isConsultant ? 'On' : 'Off'}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-[var(--text-base)]">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <FileText className="w-4 h-4" />
          <span className="text-[var(--text-base)]">Activity Logs</span>
        </button>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[var(--text-base)] text-[var(--text-secondary)]">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

// Storage indicator on each project row. Three states:
//   local        — neutral chip, folder icon, label "Local"
//   github       — primary outlined chip, github icon, mono `<owner>/<repo>` truncated
//   push-failed  — warning chip with the "!" icon and "Push failed" label, full
//                  error in the title attribute so hovering shows context
function StorageChip({ storage }: { storage: NonNullable<Project['storage']> }) {
  if (storage.type === 'github' && storage.repoPath) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full border border-[var(--primary)]/30 text-[var(--primary)] text-[var(--text-xs)] font-mono max-w-[160px]"
        title={`https://github.com/${storage.repoPath}`}
      >
        <Github className="w-3 h-3 shrink-0" />
        <span className="truncate">{storage.repoPath}</span>
      </span>
    );
  }
  if (storage.type === 'push-failed') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning-text)] text-[var(--text-xs)] font-medium"
        title={storage.lastError ?? 'Push failed — retry from the kebab menu.'}
      >
        <AlertTriangle className="w-3 h-3 shrink-0" />
        Push failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text-tertiary)] text-[var(--text-xs)]">
      <Folder className="w-3 h-3 shrink-0" />
      Local
    </span>
  );
}
