// Wire-level DTOs. Kept in sync with vibe_now/src/types/index.ts by hand for
// now; a shared package lands in the next Phase 2 cut.

export interface AuthAliasDTO {
  id: string;
  name: string;
  instanceUrl: string;
  username: string;
  hasPassword: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface AliasWriteInput {
  name: string;
  instanceUrl: string;
  username: string;
  password?: string;
  clearPassword?: boolean;
  isDefault?: boolean;
}

// Mirrors vibe_now/src/types/index.ts ColumnType. Kept narrow here so the
// fluentGen mapping in lib/fluentGen.ts is exhaustive.
export type ColumnTypeDTO =
  | 'string'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'reference'
  | 'choice'
  | 'longtext';

export interface ColumnDefDTO {
  name: string;
  label: string;
  type: ColumnTypeDTO;
  /** When type === 'reference', the post-prefix table name (no scope). */
  reference?: string;
  mandatory?: boolean;
}

export interface TableDefDTO {
  name: string;       // post-prefix, no scope
  label: string;
  /** OOB table to extend ('task', 'sys_user', 'incident'). Undefined = standalone. */
  extends?: string;
  columns: ColumnDefDTO[];
}

export interface SpecInput {
  title: string;
  description: string;
  features: string[];
  /** User-elicited data model. Optional for back-compat — when absent or
   *  empty, fluentGen falls back to a single placeholder x_<scope>_record
   *  table extending task. */
  tables?: TableDefDTO[];
  technicalDetails: {
    tables: string[];
    workflows: string[];
    ui_components: string[];
  };
  portal?: {
    enabled: boolean;
    urlSuffix?: string;
  };
}

export interface BuildRequest {
  projectId: string;
  spec: SpecInput;
  /** When set, build the snapshot at v<versionId> directly — no Fluent
   *  regeneration. Used for "Save & Build" against opened packages where
   *  custom code in the working copy must survive. The build run flips
   *  the version row's status (success / failed) on completion. */
  versionId?: string;
}

export interface DeployRequest {
  projectId: string;
  spec: SpecInput;
  aliasId?: string;
  /** When set, deploy the snapshot at v<versionId> directly. The deploy
   *  run id is FK'd onto the version row so the history strip can show
   *  "Deployed to <instance>" per version. */
  versionId?: string;
}

export interface RunStartResponse {
  runId: string;
}

export interface BuildRunResult {
  status: 'success' | 'failed';
  scope: string;
  error?: string;
}

export interface DeployRunResult {
  status: 'success' | 'failed';
  scope: string;
  sysAppId?: string;
  instanceUrl?: string;
  portalUrl?: string;
  error?: string;
}
