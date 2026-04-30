import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export type DeployStepStatus = 'pending' | 'active' | 'done';

export interface DeployStep {
  label: string;
  status: DeployStepStatus;
}

interface DeployProgressProps {
  steps: DeployStep[];
}

export function DeployProgress({ steps }: DeployProgressProps) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-center gap-3">
          {step.status === 'done' ? (
            <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0" />
          ) : step.status === 'active' ? (
            <Loader2 className="w-5 h-5 text-[var(--primary)] shrink-0 animate-[spin_1s_linear_infinite]" />
          ) : (
            <Circle className="w-5 h-5 text-[var(--text-tertiary)] shrink-0" />
          )}
          <span
            className={`text-[var(--text-base)] ${
              step.status === 'done'
                ? 'text-[var(--text-primary)]'
                : step.status === 'active'
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-tertiary)]'
            }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
