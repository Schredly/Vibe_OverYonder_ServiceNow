export type ProjectStatus = 'active' | 'deployed' | 'draft';

export type ConsultantMode = 'on' | 'off';

export type AssetKind = 'figma' | 'image' | 'logo' | 'other';

export interface ProjectAsset {
  id: string;
  name: string;
  size: number;
  mime: string;
  kind: AssetKind;
  role?: 'logo' | 'icon' | 'mockup' | 'other';
  previewUrl?: string;
  /**
   * For text-based assets (`.tsx`, `.ts`, `.css`, `.scss`, `.html`, `.json`),
   * the file's UTF-8 contents. Captured client-side so the Reference design
   * surface can show component lists and parse design tokens out of CSS.
   * Capped to ~64KB per file to keep the project state reasonable.
   */
  text?: string;
}

/**
 * Parsed view of a Figma Make export — the React/Tailwind zip you get when
 * you click "Export to code" in Figma Make. Detected at extraction time
 * by the presence of an `App.tsx` plus a `theme.css` (or similar) styles file.
 */
export interface FigmaMakeBundle {
  isFigmaMake: true;
  appComponentName?: string;
  componentFiles: { name: string; size: number; lines: number }[];
  styleFiles: string[];
  /** CSS custom-property name → value, parsed from the `:root` block. */
  tokens: Record<string, string>;
}

export type BuildStatus = 'idle' | 'building' | 'success' | 'failed';
export type DeployStatus = 'idle' | 'deploying' | 'deployed' | 'failed';

export interface DeployLinks {
  app: string;
  portal?: string;
  scope: string;
  sysAppId: string;
  rollbackUrl?: string;
}

export interface PortalConfig {
  enabled: boolean;
  urlSuffix?: string;
  hasAssets?: boolean;
}

// Domain data model captured from the conversation. The consultant elicits
// these via the data-model canonical turn and the parser in
// src/lib/assistantBehavior.ts#parseTableDefs persists them onto the project.
// The fluentGen pipeline reads spec.tables to emit one Fluent table file per
// entry (replacing the old single-placeholder x_*_record table).
export type ColumnType =
  | 'string'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'reference'
  | 'choice'
  | 'longtext';

export interface ColumnDef {
  name: string;          // snake_case, no scope prefix (e.g. "event_date")
  label: string;         // Title Case (e.g. "Event Date")
  type: ColumnType;
  /** When type is 'reference', the table this column points at (post-prefix, no scope). */
  reference?: string;
  mandatory?: boolean;
}

export interface TableDef {
  name: string;          // snake_case, no scope prefix (e.g. "event")
  label: string;         // Title Case (e.g. "Event")
  /** OOB table to extend ("task", "sys_user", "incident"). Undefined = standalone table. */
  extends?: string;
  columns: ColumnDef[];
}

/** Where this project's source files live. Per-project, configurable.
 *
 * `local`        — files stay under `vibe_now_api/workspaces/<projectId>/`
 *                  (or a custom directory the user picked in Settings).
 * `github`       — files mirror to a GitHub repo via PAT-authenticated push;
 *                  Save & Build commits + tags the version + pushes.
 * `push-failed`  — transient state: the project is GitHub-linked but the
 *                  most recent push failed. Surfaces in the sidebar chip
 *                  + kebab as a Retry affordance. Falls back to local-save
 *                  per the 2026-04-29 design lock-in.
 */
export type ProjectStorageType = 'local' | 'github' | 'push-failed';

export interface ProjectStorage {
  type: ProjectStorageType;
  /** `<owner>/<repo>` when type is github or push-failed. */
  repoPath?: string;
  /** Override the default `workspaces/<projectId>/` directory when local. */
  localPath?: string;
  /** When true, push and pull include `chat-history.json` so the next
   *  clone can hydrate the consultant panel from the prior conversation. */
  includeChatHistory?: boolean;
  /** Last-error message when type is push-failed. Powers the tooltip on
   *  the warning chip. */
  lastError?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  lastModified: string;
  portal?: PortalConfig;
  assets?: ProjectAsset[];
  consultantMode?: ConsultantMode;
  /** Per-project storage configuration. Undefined = default local. */
  storage?: ProjectStorage;
  /** User-elicited data model. When set, replaces the placeholder
   *  technicalDetails.tables in the derived Spec. Persisted on the project so
   *  the user can iterate across turns without re-typing the schema. */
  tables?: TableDef[];
  /** Parsed Figma Make bundle when the assets[] include a recognized export.
   *  Persisted on the project so the right-panel reference design survives
   *  navigation; mirrored onto Spec.figmaMake at build-prompt compile time. */
  figmaMake?: FigmaMakeBundle;
  /** Open architecture questions the LLM still wants the user to answer.
   *  Seeded from doc-upload spec extraction; the conversational endpoint
   *  prunes (via specPatch.answeredQuestions) and extends (via
   *  specPatch.addedQuestions) it across turns so the consultant never
   *  loses track of unresolved items. */
  openQuestions?: string[];
  /** Load-bearing architecture decisions the LLM committed to during
   *  doc-extract or during the conversation. Surfaced in the right panel
   *  and threaded back into every chat-turn system prompt so subsequent
   *  turns honor them. */
  architectureDecisions?: string[];
  // Explicit UI-track overrides set by the user via conversation. Wins over
  // the auto-derivation in buildSpecFromProject (e.g. user typed "treat this
  // as full-figma" even with only screenshots attached). Only the
  // user-decision fields are stored here; expectedFidelity is always derived.
  uiTrackOverrides?: {
    customUiNeeded?: boolean | null;
    audienceTier?: AudienceTier;
    inputTier?: InputTier | null;
  };
}

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageKind =
  | 'text'
  | 'proposal'
  | 'build-success'
  | 'build-failed'
  | 'deploy-success'
  | 'deploy-failed'
  | 'assets-received';

export interface Message {
  id: string;
  role: MessageRole;
  message: string;
  timestamp: string;
  kind?: MessageKind;
  proposalSpec?: Spec;
  assets?: ProjectAsset[];
  deployLinks?: DeployLinks;
}

export type ProposalState = 'none' | 'pending' | 'approved' | 'declined';

// Track-B audience tier — see vibe_now/documentation/vibe_overyonder.md §0.4.
// audience-a (default): PDI / non-partner. Path A (Service Portal) only.
// audience-b: paid Technology Partner. All paths including UI Builder + custom Stencil.
export type AudienceTier = 'audience-a' | 'audience-b';

// Visual-input fidelity tier — see vibe_overyonder.md §0.3. Drives how
// faithfully the generator can reproduce a Figma design.
//   sketch        — screenshot / photo / rough mock; mostly stock components.
//   partial-figma — a few Figma frames; stock + 1–3 custom components.
//   full-figma    — complete Figma project with design tokens; full custom library.
export type InputTier = 'sketch' | 'partial-figma' | 'full-figma';

// Expected design faithfulness given the input tier. Stated to the consultant
// up-front so expectations are set before the build runs.
export type ExpectedFidelity = 'approximate' | 'medium' | 'high';

// [LLM HOOK] Metadata captured at build-prompt compile time. The consultant
// mode under which the prompt was assembled influences how the downstream
// generator LLM is framed (governance-first vs minimum-viable). See
// src/lib/assistantBehavior.ts#compileBuildPrompt.
export interface BuildPromptMeta {
  consultantMode: ConsultantMode;
  compiledAt: string;
}

// Track-B UI-track decision captured during the conversation. See
// vibe_overyonder.md §0 for the two-track model: Track A (backend, always)
// + Track B (UI, optional and gated). When `customUiNeeded` is null the
// gate hasn't been asked yet; when false, Track B is skipped entirely.
export interface UiTrack {
  customUiNeeded: boolean | null;
  audienceTier: AudienceTier;
  inputTier: InputTier | null;
  expectedFidelity: ExpectedFidelity | null;
}

export interface Spec {
  title: string;
  description: string;
  features: string[];
  /** Rich data model derived from project.tables. When the user hasn't
   *  defined any, this stays empty and the generator falls back to a single
   *  placeholder record table (legacy behavior). */
  tables: TableDef[];
  technicalDetails: {
    /** Names-only view of `tables` for back-compat with summary surfaces. */
    tables: string[];
    workflows: string[];
    ui_components: string[];
  };
  portal?: PortalConfig;
  assets?: ProjectAsset[];
  /**
   * Populated by the zip extractor when the upload looks like a Figma Make
   * export. Drives the Reference design surface — color swatches, type
   * samples, component list — so the user sees their tokens reflected back.
   */
  figmaMake?: FigmaMakeBundle;
  uiTrack?: UiTrack;
  // [LLM HOOK] Phase 2: the compiled read-only prompt fed to the generator LLM.
  // Populated by compileBuildPrompt(spec, mode) right before a Build run.
  buildPrompt?: {
    content: string;
    meta: BuildPromptMeta;
  };
}

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

// ServiceNow instance credentials stored for one-click deploys.
//
// Phase 1: persisted in localStorage via src/lib/authAliases.ts. Password is
// saved only when the user opts in (plaintext in browser storage — acceptable
// for a local dev tool, never for shared machines).
//
// [PHASE 2 HOOK] The backend will own aliases. The UI will POST the form to
// `/api/auth/aliases` which shells out to `now-sdk auth --add`. The browser
// stops holding the password at that point.
export interface AuthAlias {
  id: string;
  name: string;
  instanceUrl: string;
  username: string;
  password?: string;
  savePassword: boolean;
  isDefault: boolean;
  createdAt: string;
}
