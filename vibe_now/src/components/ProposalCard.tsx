import { CheckCircle2, XCircle, FileCheck2 } from 'lucide-react';
import { Button } from './Button';
import type { Spec } from '../types';

interface ProposalCardProps {
  spec: Spec;
  state: 'pending' | 'approved' | 'declined';
  onApprove: () => void;
  onDecline: () => void;
}

export function ProposalCard({ spec, state, onApprove, onDecline }: ProposalCardProps) {
  const isPending = state === 'pending';

  return (
    <div
      className={`rounded-[var(--radius-lg)] border-2 overflow-hidden ${
        state === 'approved'
          ? 'border-[var(--success)]/40 bg-[var(--success-bg)]/20'
          : state === 'declined'
          ? 'border-[var(--border-default)] bg-[var(--bg-card)] opacity-80'
          : 'border-[var(--primary)]/40 bg-[var(--bg-card)]'
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b ${
          state === 'approved'
            ? 'border-[var(--success)]/30 bg-[var(--success-bg)]/40'
            : 'border-[var(--border-subtle)] bg-[var(--bg-hover)]'
        }`}
      >
        <FileCheck2
          className={`w-4 h-4 ${
            state === 'approved' ? 'text-[var(--success-text)]' : 'text-[var(--primary)]'
          }`}
        />
        <span className="text-[var(--text-sm)] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          {state === 'approved'
            ? 'Spec Approved'
            : state === 'declined'
            ? 'Proposal — Declined'
            : 'Build Proposal — Review & Approve'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)] mb-1">
            {spec.title}
          </h3>
          <p className="text-[var(--text-base)] text-[var(--text-secondary)] leading-relaxed">
            {spec.description}
          </p>
        </div>

        <div>
          <h4 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Features ({spec.features.length})
          </h4>
          <ul className="space-y-1.5">
            {spec.features.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[var(--text-base)] text-[var(--text-primary)]"
              >
                <span className="text-[var(--accent-cyan)] mt-1">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div>
            <h4 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase mb-1.5">
              Tables
            </h4>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)] font-mono">
              {spec.technicalDetails.tables.length}
            </p>
          </div>
          <div>
            <h4 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase mb-1.5">
              Workflows
            </h4>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)] font-mono">
              {spec.technicalDetails.workflows.length}
            </p>
          </div>
          <div>
            <h4 className="text-[var(--text-xs)] font-semibold text-[var(--text-tertiary)] uppercase mb-1.5">
              UI Components
            </h4>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)] font-mono">
              {spec.technicalDetails.ui_components.length}
            </p>
          </div>
        </div>

        {isPending && (
          <div className="flex gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button
              variant="primary"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={onApprove}
              className="flex-1"
            >
              Approve — Ready to Build
            </Button>
            <Button
              variant="secondary"
              icon={<XCircle className="w-4 h-4" />}
              onClick={onDecline}
              className="flex-1"
            >
              Decline — Keep Refining
            </Button>
          </div>
        )}

        {state === 'approved' && (
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--success)]/30 text-[var(--success-text)]">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[var(--text-sm)] font-medium">
              Approved. Hit Build &amp; Deploy on the right to ship it.
            </span>
          </div>
        )}

        {state === 'declined' && (
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)] text-[var(--text-tertiary)]">
            <XCircle className="w-4 h-4" />
            <span className="text-[var(--text-sm)]">
              Declined — continue the conversation to refine.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
