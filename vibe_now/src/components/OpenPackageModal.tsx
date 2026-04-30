// Open existing package — discovery + import surface.
//
// Lists packages found on disk under workspaces/, sdk-examples/, and any
// VIBE_PACKAGES_ROOT entries; lets the user pick one and import it as a
// project. Re-importing the same path returns the existing project so the
// user can resume rather than fork.
//
// Wired to:
//   GET  /api/packages/discover
//   POST /api/packages/inspect-path  (custom-path entry)
//   POST /api/packages/import

import { useEffect, useMemo, useState } from 'react';
import {
  Folder,
  FolderOpen,
  CheckCircle2,
  Loader2,
  X,
  RefreshCw,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import {
  branchPackage,
  discoverPackages,
  importPackage,
  ingestPackage,
  inspectPackagePath,
  type DiscoveredPackage,
  type DiscoveredRoot,
  type ImportedPackage,
  type PackageIngestResult,
} from '../lib/apiClient';

export interface OpenPackagePayload {
  imported: ImportedPackage;
  ingest: PackageIngestResult | null;
  /** True when the user chose "save as new version and work from there".
   *  The new branch's version_number is on `branchedToVersion`. */
  branched: boolean;
  branchedToVersion?: number;
}

interface OpenPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the full open pipeline lands (import → ingest → optional
   *  branch). The frontend uses this to seed a Project from the result. */
  onImported: (payload: OpenPackagePayload) => void;
}

type IntentMode = 'continue' | 'branch';

type PhaseState =
  | { phase: 'idle' }
  | { phase: 'importing'; sourcePath: string }
  | { phase: 'ingesting'; sourcePath: string }
  | { phase: 'branching'; sourcePath: string }
  | { phase: 'done'; payload: OpenPackagePayload }
  | { phase: 'failed'; message: string };

function relativeTime(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t) || t === 0) return '—';
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.round(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function truncatePath(path: string, max: number = 56): string {
  if (path.length <= max) return path;
  const head = path.slice(0, 12);
  const tail = path.slice(-(max - 12 - 3));
  return `${head}…${tail}`;
}

export function OpenPackageModal({
  isOpen,
  onClose,
  onImported,
}: OpenPackageModalProps) {
  const [roots, setRoots] = useState<DiscoveredRoot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState<PhaseState>({ phase: 'idle' });
  const [customOpen, setCustomOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentMode>('continue');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { roots: next } = await discoverPackages();
      setRoots(next);
    } catch (err) {
      setError((err as Error).message ?? 'discovery failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void refresh();
      setSelectedPath(null);
      setSearch('');
      setPhase({ phase: 'idle' });
      setCustomOpen(false);
      setCustomPath('');
      setCustomError(null);
      setIntent('continue');
    }
  }, [isOpen]);

  // Filtered + flattened view for the search-across-all-roots case. We keep
  // grouping in the rendered UI when there's no search; flatten when the
  // user narrows so the matches surface together.
  const filteredRoots = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roots;
    return roots
      .map((r) => ({
        ...r,
        packages: r.packages.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.scope?.toLowerCase().includes(q) ||
            p.path.toLowerCase().includes(q) ||
            p.dirName.toLowerCase().includes(q),
        ),
      }))
      .filter((r) => r.packages.length > 0);
  }, [roots, search]);

  const totalCount = roots.reduce((sum, r) => sum + r.packages.length, 0);
  const visibleCount = filteredRoots.reduce((sum, r) => sum + r.packages.length, 0);

  const handleImport = async () => {
    if (!selectedPath) return;
    setPhase({ phase: 'importing', sourcePath: selectedPath });
    try {
      // 1. Fast import — copies files, snapshots v1.
      const imported = await importPackage({ sourcePath: selectedPath });

      // 2. LLM ingest — slow, but this is what makes the agent SDK-aware
      //    at the package level. Non-fatal on failure: the project still
      //    loads with metadata, and the user can re-trigger ingest later.
      setPhase({ phase: 'ingesting', sourcePath: selectedPath });
      let ingest: PackageIngestResult | null = null;
      try {
        ingest = await ingestPackage(imported.project.id);
      } catch (err) {
        console.warn('package ingest failed (project still opened)', err);
      }

      // 3. If the user chose "save as new version", snapshot a fresh
      //    branch off the import. The new version becomes the working
      //    target; v1 stays as the pristine import.
      let branched = false;
      let branchedToVersion: number | undefined;
      if (intent === 'branch') {
        setPhase({ phase: 'branching', sourcePath: selectedPath });
        try {
          const result = await branchPackage(
            imported.project.id,
            'Branched at open — fresh starting point',
          );
          branched = true;
          branchedToVersion = result.version.version_number;
        } catch (err) {
          console.warn('branch failed (continuing on v1)', err);
        }
      }

      const payload: OpenPackagePayload = {
        imported,
        ingest,
        branched,
        branchedToVersion,
      };
      setPhase({ phase: 'done', payload });
      // Brief pause so the user sees the success state before the modal
      // closes — same cadence as the doc-upload flow.
      setTimeout(() => {
        onImported(payload);
        onClose();
      }, 600);
    } catch (err) {
      setPhase({
        phase: 'failed',
        message: (err as Error).message ?? 'open failed',
      });
    }
  };

  const handleCustomImport = async () => {
    setCustomError(null);
    if (!customPath.trim()) {
      setCustomError('Path is required.');
      return;
    }
    try {
      const pkg = await inspectPackagePath(customPath.trim());
      setSelectedPath(pkg.path);
      setCustomOpen(false);
      // User still needs to click Open & Import on the now-selected card.
      // Don't auto-import — gives them a chance to confirm what was found.
    } catch (err) {
      setCustomError((err as Error).message ?? 'path is not a Now SDK package');
    }
  };

  const inFlight =
    phase.phase === 'importing' ||
    phase.phase === 'ingesting' ||
    phase.phase === 'branching';

  return (
    <Modal
      isOpen={isOpen}
      onClose={inFlight ? () => undefined : onClose}
      title="Open Existing Package"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
            {phase.phase === 'done' && (
              <span className="text-[var(--success-text)]">
                {phase.payload.imported.reused
                  ? 'Resumed existing project'
                  : phase.payload.branched
                    ? `Branched to v${phase.payload.branchedToVersion} — ready to refine`
                    : `Imported as ${phase.payload.imported.project.name}`}
              </span>
            )}
            {phase.phase === 'importing' && (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" />
                Copying source + snapshotting v1 …
              </span>
            )}
            {phase.phase === 'ingesting' && (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" />
                Reading the package — agent is reviewing every Fluent record (this takes 30–90s) …
              </span>
            )}
            {phase.phase === 'branching' && (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-[spin_1s_linear_infinite]" />
                Saving as a new version …
              </span>
            )}
            {phase.phase === 'failed' && (
              <span className="text-[var(--danger-text)]">{phase.message}</span>
            )}
            {phase.phase === 'idle' && selectedPath && (
              <span>Ready to open {truncatePath(selectedPath, 40)}</span>
            )}
            {phase.phase === 'idle' && !selectedPath && (
              <span>
                {visibleCount === 0
                  ? 'No packages match the filter.'
                  : `${visibleCount} of ${totalCount} package${totalCount === 1 ? '' : 's'}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={inFlight}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!selectedPath || inFlight || phase.phase === 'done'}
              icon={
                inFlight ? (
                  <Loader2 className="w-4 h-4 animate-[spin_1s_linear_infinite]" />
                ) : (
                  <FolderOpen className="w-4 h-4" />
                )
              }
            >
              {inFlight
                ? phase.phase === 'ingesting'
                  ? 'Reading…'
                  : phase.phase === 'branching'
                    ? 'Branching…'
                    : 'Importing…'
                : intent === 'branch'
                  ? 'Open & Save New Version'
                  : 'Open & Continue'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, scope, or path…"
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 text-[var(--text-sm)]"
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            title="Re-scan"
            className="p-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-[spin_1s_linear_infinite]' : ''}`}
            />
          </button>
        </div>

        {error && (
          <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/40 bg-[var(--danger-bg)] px-3 py-2 text-[var(--text-xs)] text-[var(--danger-text)]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIntent('continue')}
            disabled={inFlight}
            className={`text-left p-3 rounded-[var(--radius-md)] border transition-colors ${
              intent === 'continue'
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
            }`}
          >
            <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-0.5">
              Continue modifying
            </div>
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
              Keep iterating on v1. Save & Build later for v2.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIntent('branch')}
            disabled={inFlight}
            className={`text-left p-3 rounded-[var(--radius-md)] border transition-colors ${
              intent === 'branch'
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : 'border-[var(--border-subtle)] hover:border-[var(--primary)]/40'
            }`}
          >
            <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-0.5">
              Save as new version
            </div>
            <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] leading-relaxed">
              Snapshot a fresh v2 starting point before any edits.
            </div>
          </button>
        </div>

        <div className="space-y-5 max-h-[440px] overflow-y-auto pr-1">
          {filteredRoots.map((root) => (
            <RootSection
              key={root.path}
              root={root}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              disabled={inFlight}
            />
          ))}
          {!loading && filteredRoots.length === 0 && (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] px-4 py-8 text-center">
              <Folder className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                {search
                  ? `No packages match "${search}".`
                  : 'No packages found in the configured roots.'}
              </p>
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)] mt-1">
                Try refreshing, or open a custom path below.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-3">
          <button
            type="button"
            onClick={() => setCustomOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${customOpen ? '' : '-rotate-90'}`}
            />
            Open from a custom path
          </button>
          {customOpen && (
            <div className="mt-3 space-y-2">
              <Input
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/absolute/path/to/package"
              />
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                Must contain <code className="font-mono">now.config.json</code> and{' '}
                <code className="font-mono">src/fluent/</code>.
              </p>
              {customError && (
                <p className="text-[var(--text-xs)] text-[var(--danger-text)]">
                  {customError}
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCustomImport}
                  disabled={!customPath.trim()}
                >
                  Inspect path
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

interface RootSectionProps {
  root: DiscoveredRoot;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  disabled?: boolean;
}

function RootSection({ root, selectedPath, onSelect, disabled }: RootSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          In {root.label}/
        </h3>
        <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
          ({root.packages.length})
        </span>
      </div>
      <div className="space-y-2">
        {root.packages.map((pkg) => (
          <PackageRow
            key={pkg.path}
            pkg={pkg}
            selected={selectedPath === pkg.path}
            onSelect={() => !disabled && onSelect(pkg.path)}
          />
        ))}
      </div>
    </div>
  );
}

interface PackageRowProps {
  pkg: DiscoveredPackage;
  selected: boolean;
  onSelect: () => void;
}

function PackageRow({ pkg, selected, onSelect }: PackageRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-[var(--radius-md)] border px-3 py-3 transition-all flex items-center gap-3 ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-card)]'
      }`}
    >
      <div className="shrink-0 w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-hover)] flex items-center justify-center">
        {selected ? (
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
        ) : (
          <Folder className="w-4 h-4 text-[var(--text-tertiary)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)]">
            {pkg.name}
          </span>
          {pkg.scope && (
            <span className="font-mono text-[var(--text-xs)] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
              {pkg.scope}
            </span>
          )}
          <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
            {pkg.fluentFileCount} file{pkg.fluentFileCount === 1 ? '' : 's'}
          </span>
          {pkg.hasFigmaSource && (
            <span className="text-[var(--text-xs)] text-[var(--accent-cyan)]">
              · figma
            </span>
          )}
          {pkg.hasBuilt && (
            <span className="text-[var(--text-xs)] text-[var(--success-text)]">
              · built
            </span>
          )}
        </div>
        <div className="font-mono text-[var(--text-xs)] text-[var(--text-tertiary)] truncate" title={pkg.path}>
          {truncatePath(pkg.path)}
        </div>
      </div>
      <div className="shrink-0 text-[var(--text-xs)] text-[var(--text-tertiary)]">
        {relativeTime(pkg.lastModifiedAt)}
      </div>
      {selected && (
        <div className="shrink-0">
          <X
            className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            onClick={(e) => {
              e.stopPropagation();
              // Clicking the X clears the selection; the parent's empty
              // state copy then guides the user to pick again.
              onSelect();
            }}
          />
        </div>
      )}
    </button>
  );
}
