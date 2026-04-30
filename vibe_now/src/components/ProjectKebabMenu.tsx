import { useRef, useEffect } from 'react';
import { Upload, Download, ExternalLink, Unlink, HardDrive } from 'lucide-react';

interface ProjectKebabMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  storage: {
    type: 'local' | 'github' | 'push-failed';
    repoPath?: string;
  };
  onPushNow?: () => void;
  onPullFromRepo?: () => void;
  onOpenInGitHub?: () => void;
  onUnlinkRepo?: () => void;
  onSwitchToLocal?: () => void;
}

export function ProjectKebabMenu({
  isOpen,
  onClose,
  anchorEl,
  storage,
  onPushNow,
  onPullFromRepo,
  onOpenInGitHub,
  onUnlinkRepo,
  onSwitchToLocal,
}: ProjectKebabMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
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

  const menuItems = [];

  // "Push to GitHub" is always available — the modal itself enforces
  // whether the project is currently linked. Users with github-storage
  // projects (opened from a package) need this so they can push edits
  // back as an update or as a new versioned subfolder.
  menuItems.push({
    icon: Upload,
    label: storage.type === 'push-failed' ? 'Retry push' : 'Push to GitHub',
    onClick: onPushNow,
  });

  if (storage.type === 'github' || storage.type === 'push-failed') {
    menuItems.push({
      icon: Download,
      label: 'Pull from repo',
      onClick: onPullFromRepo,
    });
    menuItems.push({
      icon: ExternalLink,
      label: 'Open in GitHub',
      onClick: onOpenInGitHub,
    });
    menuItems.push({
      icon: Unlink,
      label: 'Unlink repo',
      onClick: onUnlinkRepo,
    });
    menuItems.push({
      icon: HardDrive,
      label: 'Switch to local-only',
      onClick: onSwitchToLocal,
    });
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[60] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] animate-[scaleIn_0.15s_ease-out] w-48 py-1"
      style={{
        top: `${rect.bottom + 4}px`,
        right: `${window.innerWidth - rect.right}px`,
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick?.();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-left"
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="text-[var(--text-sm)]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
