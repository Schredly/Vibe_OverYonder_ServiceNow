import {
  CheckCircle2,
  Rocket,
  Paperclip,
  Figma,
  Image as ImageIcon,
  FileType,
  Hammer,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { ProposalCard } from './ProposalCard';
import type { DeployLinks, Message, MessageRole, ProjectAsset, ProposalState, Spec } from '../types';

interface ChatBubbleProps {
  role: MessageRole;
  message: string;
  timestamp?: string;
  avatar?: string;
  kind?: Message['kind'];
  proposalSpec?: Spec;
  proposalState?: ProposalState;
  assets?: ProjectAsset[];
  deployLinks?: DeployLinks;
  onApproveProposal?: () => void;
  onDeclineProposal?: () => void;
  onViewPrototype?: () => void;
}

const assetIcon = (a: ProjectAsset) => {
  if (a.kind === 'figma') return <Figma className="w-4 h-4" />;
  if (a.kind === 'image' || a.kind === 'logo') return <ImageIcon className="w-4 h-4" />;
  return <FileType className="w-4 h-4" />;
};

const fmtKB = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes > 1024 * 100 ? 0 : 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ChatBubble({
  role,
  message,
  timestamp,
  avatar,
  kind = 'text',
  proposalSpec,
  proposalState,
  assets,
  deployLinks,
  onApproveProposal,
  onDeclineProposal,
  onViewPrototype,
}: ChatBubbleProps) {
  const isUser = role === 'user';

  if (kind === 'build-success') {
    return (
      <div className="flex gap-3 mb-6 animate-[slideDown_0.3s_ease-out]">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--accent-cyan)] text-white">
            <Hammer className="w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <div className="rounded-[var(--radius-lg)] rounded-bl-sm bg-[var(--bg-card)] border border-[var(--accent-cyan)]/40 px-4 py-3 space-y-3">
            <div className="flex items-center gap-2 text-[var(--accent-cyan)] text-[var(--text-sm)] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Build succeeded
            </div>
            <p className="text-[var(--text-base)] text-[var(--text-primary)] whitespace-pre-wrap">
              {message}
            </p>
            {onViewPrototype && (
              <button
                onClick={onViewPrototype}
                className="text-[var(--text-sm)] text-[var(--primary)] font-semibold hover:underline"
              >
                View Prototype →
              </button>
            )}
          </div>
          {timestamp && (
            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] px-1">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (kind === 'build-failed') {
    return (
      <div className="flex gap-3 mb-6 animate-[slideDown_0.3s_ease-out]">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--danger)] text-white">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <div className="rounded-[var(--radius-lg)] rounded-bl-sm bg-[var(--danger-bg)] border border-[var(--danger)]/40 px-4 py-3">
            <div className="flex items-center gap-2 text-[var(--danger-text)] text-[var(--text-sm)] font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              Build failed
            </div>
            <p className="text-[var(--text-base)] text-[var(--text-primary)] whitespace-pre-wrap">
              {message}
            </p>
          </div>
          {timestamp && (
            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] px-1">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (kind === 'assets-received' && assets && assets.length > 0) {
    return (
      <div className="flex gap-3 flex-row-reverse mb-6 animate-[slideDown_0.3s_ease-out]">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary)] text-white">
            <Paperclip className="w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 max-w-[85%] flex flex-col gap-1 items-end">
          <div className="rounded-[var(--radius-lg)] rounded-br-sm bg-[var(--primary)]/10 border border-[var(--primary)]/30 px-4 py-3">
            <div className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] mb-2">
              {message}
            </div>
            <ul className="space-y-1.5">
              {assets.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-primary)]"
                >
                  <span className="text-[var(--primary)]">{assetIcon(a)}</span>
                  <span className="font-mono truncate max-w-[220px]">{a.name}</span>
                  <span className="text-[var(--text-tertiary)] text-[var(--text-xs)]">
                    {fmtKB(a.size)}
                  </span>
                  {a.role && a.role !== 'other' && (
                    <span className="text-[var(--text-xs)] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                      {a.role}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {timestamp && (
            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] px-1">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (kind === 'proposal' && proposalSpec) {
    const state: 'pending' | 'approved' | 'declined' =
      proposalState === 'approved' || proposalState === 'declined' ? proposalState : 'pending';
    return (
      <div className="flex gap-3 mb-6 animate-[slideDown_0.3s_ease-out]">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--accent-cyan)] text-white">
            AI
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1 items-start min-w-0">
          <ProposalCard
            spec={proposalSpec}
            state={state}
            onApprove={onApproveProposal ?? (() => {})}
            onDecline={onDeclineProposal ?? (() => {})}
          />
          {timestamp && (
            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] px-1">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (kind === 'deploy-success') {
    return (
      <div className="flex gap-3 mb-6 animate-[slideDown_0.3s_ease-out]">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--success)] text-white">
            <Rocket className="w-4 h-4" />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <div className="rounded-[var(--radius-lg)] rounded-bl-sm bg-[var(--success-bg)] border border-[var(--success)]/30 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 text-[var(--success-text)]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[var(--text-sm)] font-semibold">Deployed successfully</span>
            </div>
            <p className="text-[var(--text-base)] text-[var(--text-primary)] whitespace-pre-wrap">
              {message}
            </p>
            {deployLinks && (
              <div className="space-y-1 pt-1">
                <a
                  href={deployLinks.app}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--primary)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open scoped app in dev378814
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
                <div className="text-[var(--text-xs)] text-[var(--text-tertiary)] font-mono pt-1">
                  {deployLinks.scope}
                </div>
              </div>
            )}
          </div>
          {timestamp && (
            <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] px-1">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 animate-[slideDown_0.3s_ease-out]`}
    >
      <div className="shrink-0">
        {avatar ? (
          <img src={avatar} alt={role} className="w-8 h-8 rounded-full" />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isUser ? 'bg-[var(--primary)] text-white' : 'bg-[var(--accent-cyan)] text-white'
            }`}
          >
            {isUser ? 'U' : 'AI'}
          </div>
        )}
      </div>
      <div
        className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}
      >
        <div
          className={`px-4 py-3 rounded-[var(--radius-lg)] ${
            isUser
              ? 'bg-[var(--primary)] text-white rounded-br-sm'
              : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-sm'
          }`}
        >
          <p className="text-[var(--text-base)] leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        {timestamp && (
          <span className="text-[var(--text-xs)] text-[var(--text-tertiary)] px-1">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
