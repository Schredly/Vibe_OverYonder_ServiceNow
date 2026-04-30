import { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Globe,
  Rocket,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Bell,
  User,
  Figma,
  ArrowLeft as BackArrow,
  ArrowRight as FwdArrow,
  RotateCcw,
  Info,
  AlertTriangle,
  ImageIcon,
  FileType,
  Layers,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Button } from './Button';
import { deriveScopeSuffix } from '../lib/scope';
import type { BuildStatus, DeployLinks, DeployStatus, Project, ProjectAsset, Spec } from '../types';

interface PrototypeViewerProps {
  project: Project;
  spec: Spec;
  buildStatus: BuildStatus;
  deployStatus: DeployStatus;
  deployLinks?: DeployLinks | null;
  onClose: () => void;
  onDeploy: () => void;
}

type Surface = 'reference' | 'inspector' | 'workspace' | 'portal';

const mockRows = (slug: string) => [
  { id: `${slug.toUpperCase()}0001`, title: 'Initial request — onboarding', status: 'Open', priority: 'Moderate', assignee: 'Alex Rivera', created: '2 hours ago' },
  { id: `${slug.toUpperCase()}0002`, title: 'Follow-up: asset inventory', status: 'In Progress', priority: 'High', assignee: 'Sam Park', created: '5 hours ago' },
  { id: `${slug.toUpperCase()}0003`, title: 'Review and approve spec', status: 'Pending Approval', priority: 'Low', assignee: 'Jordan Lee', created: 'Yesterday' },
];

const statusTone = (s: string) => {
  const lower = s.toLowerCase();
  if (lower.includes('open')) return 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]';
  if (lower.includes('progress')) return 'bg-[var(--primary)]/15 text-[var(--primary)]';
  if (lower.includes('approval')) return 'bg-[var(--warning)]/15 text-[var(--warning)]';
  return 'bg-[var(--bg-hover)] text-[var(--text-secondary)]';
};

export function PrototypeViewer({
  project,
  spec,
  buildStatus,
  deployStatus,
  deployLinks,
  onClose,
  onDeploy,
}: PrototypeViewerProps) {
  const portalEnabled = spec.portal?.enabled ?? false;

  // Use the shared scope derivation so the preview, the deploy card, and the
  // right panel all show the same scope. Previously each computed its own slug.
  const scope = deriveScopeSuffix(project);
  const slug = scope.suffix;

  const logo = (spec.assets ?? []).find((a) => a.role === 'logo' && a.previewUrl);
  const icon = (spec.assets ?? []).find((a) => a.role === 'icon' && a.previewUrl);
  const figmaRefs = (spec.assets ?? []).filter((a: ProjectAsset) => a.kind === 'figma');
  const genericImages = (spec.assets ?? []).filter(
    (a) => (a.kind === 'image' || a.kind === 'logo') && a.previewUrl && a !== logo && a !== icon,
  );
  const allRefs = (spec.assets ?? []) as ProjectAsset[];
  const hasAnyAssets = allRefs.length > 0;

  // Default to "Reference design" when the user uploaded any assets, so the
  // first thing they see is their own input — not the generic mock workspace.
  const [surface, setSurface] = useState<Surface>(hasAnyAssets ? 'reference' : 'workspace');

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col animate-[fadeIn_0.2s_ease-out]">
      <header className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-3 flex items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[var(--text-sm)]">Back to conversation</span>
        </button>
        <div className="h-5 w-px bg-[var(--border-subtle)]" />
        <div className="flex-1 min-w-0">
          <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] truncate">
            {project.name}
          </div>
          <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono">
            x_1939459_{slug} · prototype preview
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full bg-[var(--warning)]/15 text-[var(--warning)] text-[var(--text-xs)] font-semibold"
          title="The Workspace and Service Portal tabs are placeholder mocks of a generic scoped app. Your uploaded Figma is on the Reference design tab and is not yet transpiled into the deployed portal — that's Phase 2 backend work."
        >
          Mock preview
        </span>
        {hasAnyAssets && (
          <a
            href={`${import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:5275'}/api/figma/preview-bundle/${encodeURIComponent(project.id)}?t=${Date.now()}`}
            target="_blank"
            rel="noreferrer"
            title="Open Reference design in a new tab"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors text-[var(--text-sm)]"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open in new tab</span>
          </a>
        )}
        {buildStatus === 'success' && deployStatus !== 'deployed' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Rocket className="w-4 h-4" />}
            onClick={onDeploy}
          >
            Deploy to ServiceNow
          </Button>
        )}
        {deployStatus === 'deployed' && deployLinks && (
          <a
            href={deployLinks.app}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--success-bg)] text-[var(--success-text)] text-[var(--text-sm)] font-semibold hover:underline"
          >
            View live app ↗
          </a>
        )}
      </header>

      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-6">
        <div className="flex gap-1">
          {hasAnyAssets && (
            <TabButton active={surface === 'reference'} onClick={() => setSurface('reference')}>
              <Layers className="w-4 h-4" />
              Reference design
            </TabButton>
          )}
          {hasAnyAssets && (
            <TabButton active={surface === 'inspector'} onClick={() => setSurface('inspector')}>
              <Eye className="w-4 h-4" />
              Inspector
            </TabButton>
          )}
          <TabButton active={surface === 'workspace'} onClick={() => setSurface('workspace')}>
            <Briefcase className="w-4 h-4" />
            Workspace <span className="text-[var(--text-tertiary)] text-[var(--text-xs)] ml-1">(mock)</span>
          </TabButton>
          {portalEnabled && (
            <TabButton active={surface === 'portal'} onClick={() => setSurface('portal')}>
              <Globe className="w-4 h-4" />
              Service Portal <span className="text-[var(--text-tertiary)] text-[var(--text-xs)] ml-1">(mock)</span>
            </TabButton>
          )}
        </div>
      </div>

      {/* Honesty banner — only on the placeholder mock tabs. The Reference
          design tab now renders the live Figma so no warning is needed. */}
      {(surface === 'workspace' || surface === 'portal') && (
        <div className="shrink-0 px-6 py-2 bg-[var(--warning)]/10 border-b border-[var(--warning)]/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] mt-0.5 shrink-0" />
          <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
            This tab is a placeholder mock of a generic ServiceNow scoped app — it does not render
            your uploaded Figma.{' '}
            {hasAnyAssets
              ? 'Switch to "Reference design" to see your design.'
              : 'Upload assets to see them on the Reference design tab.'}
          </p>
        </div>
      )}

      {scope.truncated && (
        <div className="shrink-0 px-6 py-2 bg-[var(--danger)]/10 border-b border-[var(--danger)]/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--danger)] mt-0.5 shrink-0" />
          <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Scope name truncated.</strong>{' '}
            <code className="font-mono">{scope.intended}</code> is{' '}
            {scope.intended.length} chars; PDIs cap scopes at 18 chars total ({scope.intended.length}{' '}
            after the <code className="font-mono">{`x_1939459_`}</code> prefix only leaves 8). Will deploy as{' '}
            <code className="font-mono">{scope.fullScope}</code>.
            {scope.source === 'project-name' && (
              <>
                {' '}
                Set a shorter <em>URL suffix</em> in the right panel to control this — the URL
                suffix is used as the scope name.
              </>
            )}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {surface === 'reference' ? (
          <LiveFigmaPreview projectId={project.id} />
        ) : surface === 'inspector' ? (
          <ReferenceSurface project={project} spec={spec} assets={allRefs} />
        ) : surface === 'workspace' ? (
          <WorkspaceSurface project={project} spec={spec} slug={slug} />
        ) : (
          <PortalSurface
            project={project}
            spec={spec}
            slug={slug}
            logo={logo}
            icon={icon}
            figmaRefs={figmaRefs}
            genericImages={genericImages}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-[var(--text-sm)] font-medium border-b-2 transition-colors ${
        active
          ? 'border-[var(--primary)] text-[var(--primary)]'
          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

function WorkspaceSurface({
  project,
  spec,
  slug,
}: {
  project: Project;
  spec: Spec;
  slug: string;
}) {
  const rows = mockRows(slug);
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 text-[var(--text-xs)] text-[var(--text-tertiary)]">
        <span>All</span>
        <span>›</span>
        <span>x_1939459_{slug}</span>
        <span>›</span>
        <span className="text-[var(--text-primary)]">Records</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[var(--text-primary)]">{project.name}</h1>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-1">
            {spec.description}
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          New Record
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            placeholder="Search records…"
            className="flex-1 bg-transparent outline-none text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <Filter className="w-4 h-4" />
          Filter
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--bg-hover)] text-[var(--text-xs)] text-[var(--text-tertiary)] uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Number</th>
              <th className="text-left px-4 py-3 font-semibold">Short description</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Priority</th>
              <th className="text-left px-4 py-3 font-semibold">Assignee</th>
              <th className="text-left px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="text-[var(--text-sm)] text-[var(--text-primary)]">
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-[var(--primary)]">{r.id}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[var(--text-xs)] font-medium ${statusTone(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{r.priority}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{r.assignee}</td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">{r.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {spec.technicalDetails.workflows.map((wf, i) => (
          <div
            key={i}
            className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          >
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] uppercase mb-1">
              Workflow
            </div>
            <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)]">
              {wf}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortalSurface({
  project,
  spec,
  slug,
  logo,
  icon,
  figmaRefs,
  genericImages,
}: {
  project: Project;
  spec: Spec;
  slug: string;
  logo?: ProjectAsset;
  icon?: ProjectAsset;
  figmaRefs: ProjectAsset[];
  genericImages: ProjectAsset[];
}) {
  const suffix = spec.portal?.urlSuffix ?? slug;
  const screens = genericImages.filter((a) => a.previewUrl);
  if (screens.length > 0) {
    return (
      <DesignFidelityPortal
        project={project}
        suffix={suffix}
        logo={logo}
        screens={screens}
        figmaRefs={figmaRefs}
      />
    );
  }
  return (
    <GenericPortal
      project={project}
      spec={spec}
      suffix={suffix}
      logo={logo}
      icon={icon}
      figmaRefs={figmaRefs}
    />
  );
}

function DesignFidelityPortal({
  project,
  suffix,
  logo,
  screens,
  figmaRefs,
}: {
  project: Project;
  suffix: string;
  logo?: ProjectAsset;
  screens: ProjectAsset[];
  figmaRefs: ProjectAsset[];
}) {
  const [activeId, setActiveId] = useState(screens[0]?.id);
  const active = screens.find((s) => s.id === activeId) ?? screens[0];
  const host = 'dev378814.service-now.com';

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
          <BackArrow className="w-3.5 h-3.5" />
          <FwdArrow className="w-3.5 h-3.5" />
          <RotateCcw className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
          {logo?.previewUrl ? (
            <img src={logo.previewUrl} alt="" className="h-4 w-auto" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          )}
          <span className="text-[var(--text-xs)] font-mono text-[var(--text-secondary)] truncate">
            https://{host}/{suffix}
            {active ? ` · ${active.name}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
          <Bell className="w-3.5 h-3.5" />
          <User className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <aside className="shrink-0 w-[200px] border-r border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-y-auto">
          <div className="px-3 py-3 text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Screens · {screens.length}
          </div>
          <ul className="px-2 space-y-1 pb-3">
            {screens.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={`w-full text-left rounded-[var(--radius-md)] border transition-colors overflow-hidden ${
                    s.id === active?.id
                      ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                      : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
                  }`}
                >
                  <img src={s.previewUrl} alt={s.name} className="w-full h-20 object-cover" />
                  <div className="px-2 py-1.5 text-[var(--text-xs)] text-[var(--text-secondary)] truncate font-mono">
                    {s.name}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {figmaRefs.length > 0 && (
            <div className="px-3 pb-4">
              <div className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Source files
              </div>
              <ul className="space-y-1">
                {figmaRefs.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-secondary)] font-mono truncate"
                  >
                    <Figma className="w-3 h-3 text-[var(--accent-cyan)] shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-primary)]">
          {active && (
            <div className="min-h-full flex flex-col">
              <div className="flex-1 flex items-start justify-center p-6">
                <img
                  src={active.previewUrl}
                  alt={active.name}
                  className="max-w-full h-auto rounded-[var(--radius-md)] shadow-[var(--shadow-xl)] border border-[var(--border-subtle)] bg-white"
                />
              </div>
              <div className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                <p className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
                  Visual-fidelity preview of <strong>{project.name}</strong>. The deployed Service
                  Portal is assembled from <code className="font-mono">sp_portal</code>,{' '}
                  <code className="font-mono">sp_page</code>, and AngularJS{' '}
                  <code className="font-mono">sp_widget</code> records generated from the spec — it
                  will share your logo and URL (<code className="font-mono">/{suffix}</code>) but
                  won't match this mockup pixel-for-pixel until the Figma-to-widget transpile lands.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function GenericPortal({
  project,
  spec,
  suffix,
  logo,
  icon,
  figmaRefs,
}: {
  project: Project;
  spec: Spec;
  suffix: string;
  logo?: ProjectAsset;
  icon?: ProjectAsset;
  figmaRefs: ProjectAsset[];
}) {
  return (
    <div>
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-subtle)] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo?.previewUrl ? (
            <img src={logo.previewUrl} alt="logo" className="h-9 w-auto" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-cyan)]" />
          )}
          <div>
            <div className="text-[var(--text-base)] font-semibold text-[var(--text-primary)]">
              {project.name}
            </div>
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono">
              /{suffix}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[var(--text-secondary)]">
          <Bell className="w-4 h-4" />
          <User className="w-4 h-4" />
        </div>
      </div>

      <div className="px-8 py-12 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-cyan)]/10 border-b border-[var(--border-subtle)]">
        <div className="max-w-3xl">
          <h1 className="text-[32px] font-semibold text-[var(--text-primary)] leading-tight">
            Welcome to {project.name}
          </h1>
          <p className="text-[var(--text-base)] text-[var(--text-secondary)] mt-3 leading-relaxed">
            {spec.description}
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="primary">Submit a request</Button>
            <Button variant="secondary">Browse catalog</Button>
          </div>
        </div>
      </div>
      <div className="px-8 pt-4">
        <div className="flex items-start gap-2 text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            No design mockups uploaded yet. Attach PNG/JPG/SVG screens or a Figma zip via the
            paperclip and this view will render them as the actual portal.
          </p>
        </div>
      </div>

      <div className="px-8 py-10">
        <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)] mb-4">
          Services
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {spec.features.slice(0, 6).map((f, i) => (
            <div
              key={i}
              className="p-5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--primary)]/40 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center mb-3">
                {icon?.previewUrl ? (
                  <img src={icon.previewUrl} alt="" className="w-6 h-6" />
                ) : (
                  <span className="text-[var(--primary)] font-semibold">{i + 1}</span>
                )}
              </div>
              <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-1">
                {f.split(' ').slice(0, 4).join(' ')}
              </div>
              <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">{f}</div>
            </div>
          ))}
        </div>

        {figmaRefs.length > 0 && (
          <>
            <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)] mt-10 mb-4">
              Design sources
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {figmaRefs.map((a) => (
                <div
                  key={a.id}
                  className="rounded-[var(--radius-lg)] border border-dashed border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/5 p-4 flex items-start gap-3"
                >
                  <Figma className="w-5 h-5 text-[var(--accent-cyan)] shrink-0" />
                  <div>
                    <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)]">
                      {a.name}
                    </div>
                    <div className="text-[var(--text-xs)] text-[var(--text-secondary)] mt-1">
                      Figma file queued for transpile at deploy time. Frames will emit AngularJS
                      widget templates; interactive behavior comes from the spec.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-8 py-6 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-xs)] text-[var(--text-tertiary)]">
        This is a local prototype. It reflects your spec and attached assets — it does not yet talk
        to a ServiceNow instance.
      </div>
    </div>
  );
}

// Live Figma preview — mounts the iframe served by the backend's
// /api/figma/preview-bundle endpoint, which renders the SAME widget HTML +
// compiled CSS that ships to Service Portal. This replaces the noisy
// inspector view as the default Reference-design experience.
function LiveFigmaPreview({ projectId }: { projectId: string }) {
  // The backend route picks up the latest uploaded zip from the workspace
  // and runs M2→M3→M4 if needed. We bust the cache on every mount with a
  // ts param so re-uploads aren't masked by a stale iframe document.
  //
  // Use the backend's absolute URL: Vite's `/api` proxy works for fetch but
  // is flaky for iframe document loads (the dev server's HTML middleware can
  // intercept the response before forwarding). Falls back to the dev-default
  // (localhost:5275) when VITE_API_URL is unset.
  const apiBase =
    import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:5275';
  const src = `${apiBase}/api/figma/preview-bundle/${encodeURIComponent(projectId)}?t=${Date.now()}`;
  // No sandbox attribute — this is a dev-only viewer of locally-generated
  // content from our own backend. AngularJS needs to actually run inside the
  // iframe to render the design.
  //
  // Sized via absolute fill rather than `h-full`: the parent surface area
  // uses `overflow-y-auto` which produces an auto-sized height, against
  // which `height: 100%` on the iframe collapses to 0 and the iframe goes
  // invisible. Absolute inset-0 against a relative wrapper that explicitly
  // sets a min-height in viewport units sidesteps that.
  return (
    <div
      className="relative bg-white"
      style={{ height: '100%', minHeight: 'calc(100vh - 180px)' }}
    >
      <iframe
        src={src}
        title="Figma preview"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
        }}
      />
    </div>
  );
}

// Reference-design surface: shows the user's uploaded assets as the dominant
// visual so they can verify what was ingested. Distinct from the Workspace /
// Portal mocks — those are generic scoped-app placeholders, this is the user's
// actual input.
function ReferenceSurface({
  project: _project,
  spec,
  assets,
}: {
  project: Project;
  spec: Spec;
  assets: ProjectAsset[];
}) {
  const imagesWithPreview = assets.filter((a) => a.previewUrl);
  const figmaFiles = assets.filter((a) => a.kind === 'figma');
  const otherFiles = assets.filter((a) => !a.previewUrl && a.kind !== 'figma');
  const totalBytes = assets.reduce((sum, a) => sum + a.size, 0);
  const formatSize = (n: number) =>
    n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
  const figmaMake = spec.figmaMake;

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--text-tertiary)]">
            Uploaded reference
          </span>
          {figmaMake && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] text-[var(--text-xs)] font-semibold">
              Figma Make detected
            </span>
          )}
        </div>
        <h2 className="text-[var(--text-2xl)] font-semibold text-[var(--text-primary)]">
          Your design
        </h2>
        <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-1">
          {assets.length} {assets.length === 1 ? 'file' : 'files'} · {formatSize(totalBytes)} total
        </p>
      </div>

      {figmaMake && <FigmaMakeReport figmaMake={figmaMake} assets={assets} />}

      {imagesWithPreview.length > 0 && (
        <div className="space-y-6 mt-8">
          <div className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--text-tertiary)]">
            Image previews
          </div>
          {imagesWithPreview.map((a) => (
            <figure
              key={a.id}
              className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]"
            >
              <img src={a.previewUrl} alt={a.name} className="w-full h-auto block" />
              <figcaption className="px-4 py-2 text-[var(--text-xs)] text-[var(--text-tertiary)] flex items-center justify-between border-t border-[var(--border-subtle)]">
                <span className="font-mono truncate flex-1">{a.name}</span>
                <span className="shrink-0">{formatSize(a.size)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {!figmaMake && imagesWithPreview.length === 0 && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center">
          <ImageIcon className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
            No previewable assets in the upload.
          </p>
        </div>
      )}

      {(figmaFiles.length > 0 || otherFiles.length > 0) && (
        <div className="mt-8">
          <div className="text-[var(--text-xs)] uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Files in this upload ({figmaFiles.length + otherFiles.length})
          </div>
          <ul className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] divide-y divide-[var(--border-subtle)] max-h-[420px] overflow-y-auto">
            {[...figmaFiles, ...otherFiles]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((a) => (
                <li
                  key={a.id}
                  className="px-4 py-2.5 flex items-center gap-3 text-[var(--text-sm)] text-[var(--text-primary)]"
                >
                  {a.kind === 'figma' ? (
                    <Figma className="w-4 h-4 text-[var(--accent-cyan)] shrink-0" />
                  ) : (
                    <FileType className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                  )}
                  <span className="font-mono truncate flex-1">{a.name}</span>
                  <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] shrink-0">
                    {formatSize(a.size)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Render a Figma Make export's parsed design tokens as visual swatches and
// list its components. This is the most concrete "we received your Figma"
// signal we can show without an in-browser bundler — color/typography/radii
// pulled directly from the user's :root CSS block.
function FigmaMakeReport({
  figmaMake,
  assets,
}: {
  figmaMake: NonNullable<Spec['figmaMake']>;
  assets: ProjectAsset[];
}) {
  const tokens = figmaMake.tokens;
  const tokenEntries = Object.entries(tokens);

  // Categorize tokens by name pattern. CSS custom-property naming is conven-
  // tion-based — Figma Make uses descriptive names like --primary, --color-X,
  // --background, --font-display, --radius-card, etc.
  const isColor = (name: string, value: string) => {
    if (/^(#|rgb|hsl|oklch)/i.test(value)) return true;
    return /color|background|foreground|primary|secondary|accent|muted|destructive|border|cluck-/i.test(name);
  };
  const isFont = (name: string) => /font|family/i.test(name) && !/weight|size/i.test(name);
  const isRadius = (name: string) => /radius/i.test(name);
  const isSpacing = (name: string) => /space|gap/i.test(name);

  const colorEntries = tokenEntries.filter(([n, v]) => isColor(n, v));
  const fontEntries = tokenEntries.filter(([n]) => isFont(n));
  const radiusEntries = tokenEntries.filter(([n]) => isRadius(n));
  const spacingEntries = tokenEntries.filter(([n]) => isSpacing(n));

  // Detect shadcn/ui default theme.css — Figma Make ships these defaults
  // when the source design doesn't define Figma Variables. The brand colors
  // then live as Tailwind utility classes inside the `.tsx` files (e.g.
  // `bg-orange-500`), not as CSS custom properties — so the swatch grid
  // shows monochrome shadcn defaults rather than the actual design.
  // Heuristic: --primary is near-black (#030213), --background is white,
  // --foreground is oklch(0.145 0 0). All three together = shadcn default.
  const isShadcnDefaults = (() => {
    const norm = (v: string | undefined) => (v ?? '').toLowerCase().replace(/\s+/g, '');
    const p = norm(tokens['--primary']);
    const b = norm(tokens['--background']);
    const f = norm(tokens['--foreground']);
    const matchesShadcnPrimary = p === '#030213' || p === '#020817' || p === '#09090b';
    const matchesShadcnBg = b === '#ffffff' || b === '#fff' || b === 'white';
    const matchesShadcnFg = f.startsWith('oklch(0.145') || f === '#020817' || f === '#0a0a0a';
    return matchesShadcnPrimary && matchesShadcnBg && matchesShadcnFg;
  })();

  // Sample a few Tailwind utility classes from App.tsx so the user can see
  // where their actual brand colors live when the CSS tokens are defaults.
  const tailwindBrandClasses = (() => {
    const appComp = assets.find((a) => a.name === figmaMake.appComponentName);
    if (!appComp?.text) return [] as string[];
    const re = /\b(bg|text|border|from|to|via|ring)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|stone|slate|zinc|neutral|gray)-(\d{2,3})\b/g;
    const found = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(appComp.text)) !== null) found.add(m[0]);
    return Array.from(found).slice(0, 24);
  })();

  const appComponent = assets.find((a) => a.name === figmaMake.appComponentName) ?? null;
  const appPreview = appComponent?.text?.split('\n').slice(0, 30).join('\n');

  return (
    <div className="space-y-6">
      {isShadcnDefaults && (
        <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--warning)] mt-0.5 shrink-0" />
          <div className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Tokens look like shadcn/ui defaults — not your brand.</strong>{' '}
            Your <code className="font-mono">theme.css</code> ships the stock shadcn palette ({tokens['--primary']} primary, white background, near-black foreground) which Figma Make includes when the source design doesn't use Figma Variables.
            {tailwindBrandClasses.length > 0 ? (
              <>
                {' '}Your actual brand colors are likely in Tailwind utility classes inside the <code className="font-mono">.tsx</code> files. Detected:{' '}
                <span className="font-mono">
                  {tailwindBrandClasses.slice(0, 8).join(', ')}
                  {tailwindBrandClasses.length > 8 ? '…' : ''}
                </span>
                .
              </>
            ) : (
              <> Either set up Figma Variables in the source design, or rely on the .tsx component source for the visual reference until Phase 2 live-render lands.</>
            )}
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-md)] border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 px-4 py-3 flex items-start gap-3">
        <Layers className="w-5 h-5 text-[var(--accent-cyan)] mt-0.5 shrink-0" />
        <div className="text-[var(--text-xs)] text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Figma Make export.</strong>{' '}
          {figmaMake.componentFiles.length} React component
          {figmaMake.componentFiles.length === 1 ? '' : 's'} and{' '}
          {Object.keys(tokens).length} design{' '}
          {Object.keys(tokens).length === 1 ? 'token' : 'tokens'} parsed from your{' '}
          {figmaMake.styleFiles.join(', ')} file{figmaMake.styleFiles.length === 1 ? '' : 's'}.
          The token swatches and component list below come directly from your upload.
          Live React rendering is Phase 2 — for now this is your design system, faithfully echoed.
        </div>
      </div>

      {colorEntries.length > 0 && (
        <section>
          <h3 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
            Colors ({colorEntries.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {colorEntries.map(([name, value]) => (
              <div
                key={name}
                className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden"
              >
                <div
                  className="h-16 w-full"
                  style={{ backgroundColor: value, backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.04) 75%), linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.04) 75%)', backgroundSize: '12px 12px', backgroundPosition: '0 0, 6px 6px' }}
                />
                <div className="px-2 py-1.5 border-t border-[var(--border-subtle)]">
                  <div className="font-mono text-[var(--text-xs)] text-[var(--text-primary)] truncate">
                    {name}
                  </div>
                  <div className="font-mono text-[var(--text-xs)] text-[var(--text-tertiary)] truncate">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {fontEntries.length > 0 && (
        <section>
          <h3 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
            Typography
          </h3>
          <div className="space-y-2">
            {fontEntries.map(([name, value]) => (
              <div
                key={name}
                className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3"
              >
                <div className="text-[var(--text-xs)] font-mono text-[var(--text-tertiary)] mb-1">
                  {name} = {value}
                </div>
                <div
                  className="text-[var(--text-2xl)] text-[var(--text-primary)]"
                  style={{ fontFamily: value }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(radiusEntries.length > 0 || spacingEntries.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {radiusEntries.length > 0 && (
            <div>
              <h3 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
                Radii
              </h3>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] divide-y divide-[var(--border-subtle)]">
                {radiusEntries.map(([name, value]) => (
                  <div key={name} className="px-3 py-2 flex items-center gap-3">
                    <div
                      className="w-8 h-8 bg-[var(--accent-cyan)]/30 border border-[var(--accent-cyan)]/50 shrink-0"
                      style={{ borderRadius: value }}
                    />
                    <div className="font-mono text-[var(--text-xs)] flex-1 truncate">
                      <span className="text-[var(--text-primary)]">{name}</span>
                      <span className="text-[var(--text-tertiary)]"> = {value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {spacingEntries.length > 0 && (
            <div>
              <h3 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
                Spacing
              </h3>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] divide-y divide-[var(--border-subtle)]">
                {spacingEntries.map(([name, value]) => (
                  <div key={name} className="px-3 py-2 flex items-center gap-3">
                    <div
                      className="bg-[var(--accent-cyan)]/30 border-r border-[var(--accent-cyan)]/50 h-3 shrink-0"
                      style={{ width: value }}
                    />
                    <div className="font-mono text-[var(--text-xs)] flex-1 truncate">
                      <span className="text-[var(--text-primary)]">{name}</span>
                      <span className="text-[var(--text-tertiary)]"> = {value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tailwindBrandClasses.length > 0 && (
        <section>
          <h3 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
            Tailwind brand classes from <code className="font-mono">{figmaMake.appComponentName}</code>
          </h3>
          <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mb-2">
            Likely the source of your actual brand colors when CSS tokens look like shadcn defaults.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tailwindBrandClasses.map((cls) => (
              <span
                key={cls}
                className="font-mono text-[var(--text-xs)] px-2 py-1 rounded-[var(--radius-md)] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
              >
                {cls}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
          React components ({figmaMake.componentFiles.length})
        </h3>
        <ul className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] divide-y divide-[var(--border-subtle)] max-h-[300px] overflow-y-auto">
          {figmaMake.componentFiles.map((c) => (
            <li
              key={c.name}
              className="px-3 py-2 flex items-center gap-3 text-[var(--text-sm)]"
            >
              <FileType className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" />
              <span className="font-mono truncate flex-1 text-[var(--text-primary)]">
                {c.name}
              </span>
              <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] shrink-0 font-mono">
                {c.lines} lines
              </span>
            </li>
          ))}
        </ul>
      </section>

      {appPreview && (
        <section>
          <h3 className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
            App.tsx (first 30 lines)
          </h3>
          <pre className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-xs)] font-mono text-[var(--text-secondary)] overflow-x-auto leading-relaxed">
            {appPreview}
          </pre>
        </section>
      )}
    </div>
  );
}
