import { useRef, useEffect, useState, FormEvent, KeyboardEvent } from 'react';
import { Send, Sparkles, Maximize2, Minimize2, Paperclip, X } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { Button } from './Button';
import { TypingIndicator } from './TypingIndicator';
import { SaveAndBuildPill } from './SaveAndBuildPill';
import type { ConsultantMode, Message, ProposalState } from '../types';

interface WorkspaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onAttachAssets?: (files: File[]) => void;
  canAttach?: boolean;
  isThinking?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  proposalState?: ProposalState;
  onApproveProposal?: () => void;
  onDeclineProposal?: () => void;
  onViewPrototype?: () => void;
  consultantMode?: ConsultantMode;
  onOpenSettings?: () => void;
  /** Active project id — when present, the Save & Build pill renders above
   *  the composer whenever the working copy is dirty. */
  projectId?: string | null;
  /** Triggered after a snapshot lands. Parent forwards this to the build
   *  pipeline so the new version actually gets built. */
  onSnapshotCreated?: (versionId: string, versionNumber: number) => void;
}

const ATTACH_ACCEPT =
  '.fig,.zip,application/zip,application/x-zip-compressed,image/png,image/jpeg,image/svg+xml,image/webp,image/gif';

export function Workspace({
  messages,
  onSendMessage,
  onAttachAssets,
  canAttach = true,
  isThinking = false,
  isExpanded = false,
  onToggleExpand,
  proposalState = 'none',
  onApproveProposal,
  onDeclineProposal,
  onViewPrototype,
  consultantMode = 'on',
  onOpenSettings,
  projectId,
  onSnapshotCreated,
}: WorkspaceProps) {
  const isConsultant = consultantMode === 'on';
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Auto-grow the textarea up to ~6 lines, then scroll inside.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const submit = () => {
    if (isThinking) return;
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;
    if (text) onSendMessage(text);
    if (pendingFiles.length > 0 && onAttachAssets) onAttachAssets(pendingFiles);
    setInput('');
    setPendingFiles([]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Plain Enter sends. Cmd/Ctrl+Enter (or Shift+Enter, conventionally)
  // inserts a newline. We only intercept Enter — every other key goes
  // through to the textarea's default behaviour, so wrapping works.
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // newline
    e.preventDefault();
    submit();
  };

  const handleFilesPicked = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(fileList)]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSend = (input.trim().length > 0 || pendingFiles.length > 0) && !isThinking;

  return (
    <main className="flex-1 flex flex-col h-screen bg-[var(--bg-primary)] min-w-0">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-8 py-4">
        <div className="max-w-[820px] mx-auto flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles
                className={`w-5 h-5 text-[var(--primary)] ${
                  isThinking ? 'animate-[spin_2s_linear_infinite]' : ''
                }`}
              />
              <h2 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">
                AI Consultant
              </h2>
              <button
                type="button"
                onClick={onOpenSettings}
                title="Change in Settings"
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[var(--text-xs)] font-medium transition-colors ${
                  isConsultant
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/15'
                    : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConsultant ? 'bg-[var(--primary)]' : 'bg-[var(--text-tertiary)]'
                  }`}
                />
                {isConsultant ? 'Consultant Mode' : 'Direct Build Mode'}
              </button>
              {isThinking && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] text-[var(--text-xs)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-[pulseDot_1.2s_ease-in-out_infinite]" />
                  Working
                </span>
              )}
            </div>
            <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-1">
              {isThinking
                ? 'Working through your request and updating the spec…'
                : isConsultant
                  ? 'Clarify scope, weigh tradeoffs, and shape a buildable ServiceNow app.'
                  : 'Turn a ServiceNow idea into a buildable scoped app.'}
            </p>
          </div>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Exit focus mode' : 'Expand chat to full screen'}
              title={isExpanded ? 'Exit focus mode' : 'Expand chat to full screen'}
              className="shrink-0 p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-[820px] mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-cyan)] flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)] mb-2">
                Design your ServiceNow application
              </h3>
              <p className="text-[var(--text-base)] text-[var(--text-secondary)] max-w-md">
                {isConsultant
                  ? "Describe the app. I'll mirror it back, surface tradeoffs, and shape a scoped app you can build — on the Now SDK, with your guardrails intact."
                  : "Describe the app. I'll turn it into a scoped app with sensible defaults and keep us moving toward build."}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  role={msg.role}
                  message={msg.message}
                  timestamp={msg.timestamp}
                  kind={msg.kind}
                  proposalSpec={msg.proposalSpec}
                  proposalState={proposalState}
                  assets={msg.assets}
                  deployLinks={msg.deployLinks}
                  onApproveProposal={onApproveProposal}
                  onDeclineProposal={onDeclineProposal}
                  onViewPrototype={onViewPrototype}
                />
              ))}
              {isThinking && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div className="max-w-[820px] mx-auto w-full px-8">
        <SaveAndBuildPill projectId={projectId ?? null} onSnapshot={onSnapshotCreated} />
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-8 py-4">
        <div className="max-w-[820px] mx-auto">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingFiles.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-xs)] text-[var(--text-secondary)] max-w-[260px]"
                >
                  <Paperclip className="w-3 h-3 shrink-0" />
                  <span className="truncate" title={f.name}>{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removePendingFile(i)}
                    aria-label={`Remove ${f.name}`}
                    className="shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACH_ACCEPT}
              onChange={(e) => handleFilesPicked(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAttach || isThinking || !onAttachAssets}
              title={
                !canAttach
                  ? 'Open or create a project to attach assets'
                  : 'Attach logo, icon, Figma file or .zip, or screenshots'
              }
              aria-label="Attach assets"
              className="shrink-0 px-3 py-3 rounded-[var(--radius-md)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--text-secondary)] disabled:hover:border-[var(--border-subtle)]"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                isThinking
                  ? 'Working…'
                  : 'Describe the app, or attach a logo, icon, or Figma .zip…  (⌘↵ for newline)'
              }
              disabled={isThinking}
              className="flex-1 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all disabled:opacity-60 resize-none leading-6 max-h-[160px] overflow-y-auto"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Send className="w-4 h-4" />}
              disabled={!canSend}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
