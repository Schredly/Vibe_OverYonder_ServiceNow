import { useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

export interface Repo {
  name: string;
  fullName: string;
  lastUpdated: string;
}

interface RepoPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (repoFullName: string) => void;
  anchorEl: HTMLElement | null;
  /** Real repos from the backend's GET /api/github/repos. Empty until the
   *  GitHub backend lands; the popover renders the empty state cleanly. */
  repos?: Repo[];
  loading?: boolean;
}

export function RepoPickerPopover({
  isOpen,
  onClose,
  onSelect,
  anchorEl,
  repos = [],
  loading = false,
}: RepoPickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  return (
    <div
      ref={popoverRef}
      className="fixed z-[60] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] animate-[scaleIn_0.15s_ease-out] w-80"
      style={{
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
      }}
    >
      <div className="p-2 max-h-64 overflow-y-auto">
        <div className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-2">
          Your Repositories
        </div>
        {loading && (
          <div className="px-3 py-3 text-[var(--text-xs)] text-[var(--text-tertiary)]">
            Loading…
          </div>
        )}
        {!loading && repos.length === 0 && (
          <div className="px-3 py-3 text-[var(--text-xs)] text-[var(--text-tertiary)]">
            Connect GitHub in Settings to list your repos.
          </div>
        )}
        {repos.map((repo) => (
          <button
            key={repo.fullName}
            onClick={() => {
              onSelect(repo.fullName);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[var(--text-sm)] font-medium text-[var(--text-primary)] truncate">
                {repo.name}
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--text-tertiary)] mt-0.5">
                <Clock className="w-3 h-3" />
                Updated {repo.lastUpdated}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
