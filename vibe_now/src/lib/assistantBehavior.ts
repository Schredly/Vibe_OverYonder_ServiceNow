// ---------------------------------------------------------------------------
// Assistant behavior layer
//
// Two profiles today:
//   - 'on'  → Consultant Mode. Senior ServiceNow solution architect voice:
//             reflect → (1–2) expand → (1) challenge → propose. Max 2 questions
//             per turn. Grounded in Now SDK v4.4 constraints.
//   - 'off' → Builder Mode. Direct copilot voice: terse, decision-oriented,
//             still ServiceNow-aware, same canonical turns.
//
// Canonical turns (required in BOTH modes — do not skip portal or assets):
//   audience → shape → data-model → automation → permissions → portal → assets
//
// [LLM HOOK]
//   When a real LLM backend replaces the scripts, the swap is narrow:
//     1. renderTurn(turn, mode, ctx)  → await llm.chat({ system, messages })
//     2. generateEchoReply(args)      → await llm.chat({ system, messages })
//     3. systemPromptFor(mode)        → used as the `system` role content
//     4. compileBuildPrompt(spec,mode) → fed to the generator LLM at build time
//
//   Everything else (App.tsx state machine, turn counter, proposal gate) is
//   already mode-agnostic. Do not scatter mode branches across the app;
//   keep new behavior differences in this file.
// ---------------------------------------------------------------------------

import type { ColumnDef, ColumnType, ConsultantMode, Spec, TableDef } from '../types';

export type TurnId =
  | 'audience'
  | 'shape'
  | 'data-model'
  | 'automation'
  | 'permissions'
  | 'portal'
  | 'assets';

export const CANONICAL_TURN_IDS: TurnId[] = [
  'audience',
  'shape',
  'data-model',
  'automation',
  'permissions',
  'portal',
  'assets',
];

interface TurnBlueprint {
  id: TurnId;
  required: boolean;
  on: string;
  off: string;
}

const TURNS: TurnBlueprint[] = [
  {
    id: 'audience',
    required: true,
    on: [
      "Reflect: you've described a scoped ServiceNow app. Before the shape gets locked, I want to push on three framing questions.",
      '',
      '• Users — internal staff, external customers, or both? Drives the portal/workspace split.',
      '• Fit with OOB — if this overlaps ITSM/HRSD/CSM, extending is usually cheaper than greenfield.',
      '• Integration surface — standalone, or does this exchange data with existing systems?',
      '',
      'Which one is the biggest open question for you right now?',
    ].join('\n'),
    off: [
      'Two framing questions:',
      '1. Internal users, external, or both?',
      '2. New scoped app, or extend an existing module?',
    ].join('\n'),
  },
  {
    id: 'shape',
    required: true,
    on: [
      "Two shapes I'd consider:",
      '',
      '• Pattern A — scoped app, light workspace. One core table, one workspace page, business rules for automation. Fast and SDK-safe.',
      '• Pattern B — scoped app + Service Portal. Adds a branded external surface. More upfront asset work, better for self-service.',
      '',
      'Recommendation: A if internal-only; B if end users self-initiate. Which applies?',
    ].join('\n'),
    off: 'Default shape: scoped app with one core table and a workspace page. Good?',
  },
  {
    id: 'data-model',
    required: true,
    on: [
      'Data model — let me capture the actual entities. Reply with one bullet per table; for each, list the columns inline:',
      '',
      '```',
      '- event: name!, event_date (datetime), location → location, capacity (integer)',
      '- attendee: name!, email, event → event',
      '- location: name!, address, city',
      '```',
      '',
      'Conventions: `name!` = mandatory. `(integer|date|datetime|boolean|decimal|longtext|choice)` overrides the default `string`. `→ table` makes it a reference to that table.',
      '',
      "If you'd rather type freeform (\"events have a date and location, attendees register for events\"), I'll still try to parse it — just be explicit about which fields are references and which tables they point to. The parsed tables show up in the right panel; you can iterate by sending a corrected list.",
      '',
      'Skip this and the generator falls back to a single placeholder record table extending `task`.',
    ].join('\n'),
    off: 'Data: send `- table: col1, col2 (type), col3 → ref_table` per line. Skip = single placeholder table extending task.',
  },
  {
    id: 'automation',
    required: true,
    on: [
      'Automation shape:',
      '',
      "• Flow Designer — cleanest, but SDK v4.4 can't reliably resolve fields on brand-new scoped tables. Works fine on OOB triggers (`incident`, `sc_req_item`, `change_request`).",
      '• Business rules + email notifications — deterministic and SDK-safe for scoped-table logic.',
      '',
      'Recommendation: business rules for record-created → notify, assign, and state transitions. Add flows only if we also trigger from an OOB table.',
      '',
      "Does that fit the complexity you're targeting?",
    ].join('\n'),
    off: 'Automation: business rules for the scoped table (flows fail on new scoped-table field resolution in v4.4). OK?',
  },
  {
    id: 'permissions',
    required: true,
    on: [
      'Permissions tiers:',
      '',
      '• Single role — PoC-only; breaks the moment you need segregation of duties.',
      '• Two roles (requester + approver) — enterprise-audit-safe. ~40% more ACL work, saves rework.',
      '• Three roles (requester + approver + admin) — right if a non-IT team will own this app.',
      '',
      'Recommendation: two-role unless the business has already named an owning team.',
      '',
      "What's the org reality?",
    ].join('\n'),
    off: 'Permissions: requester + approver. OK?',
  },
  {
    id: 'portal',
    required: true,
    on: [
      'Track B gate — does this engagement need a custom UI?',
      '',
      'Two answers determine the rest of the build:',
      '',
      "• No — ship the scoped app with stock workspace and OOB list/form views. We're done with the UI side; the rest of the conversation focuses on tables, roles, and automation.",
      '• Yes — we build a Service Portal with a branded design that maps to whatever visual input you bring. Cluckworks `/cluck` and Shoreline `/shoreline` are the proven pattern.',
      '',
      "Which is it? If yes, give me a URL suffix (e.g. `shoreline`, `requests`, `hr`).",
      '',
      "Note: the high-fidelity UI Builder + custom-component path is paid-partner-only on the ServiceNow Store. PDIs ship with Service Portal — that's the default Track B output here.",
    ].join('\n'),
    off: 'Custom UI needed (Service Portal)? Yes/no. If yes, URL suffix?',
  },
  {
    id: 'assets',
    required: true,
    on: [
      'Visual input — what fidelity tier are we working at?',
      '',
      'Three tiers, by what you can give me:',
      '',
      '• Tier 1 — Sketch. A whiteboard photo, a single screenshot, or a rough mock. I produce an approximate layout using mostly stock components. Faithfulness: approximate.',
      '• Tier 2 — Partial Figma. A few Figma frames, no full design system. Stock components plus 1–3 custom widgets for the screens that matter. Faithfulness: medium.',
      '• Tier 3 — Full Figma. Complete Figma project with design tokens, typography, and components. We translate the token layer to widget SCSS and build a faithful brand. Faithfulness: high.',
      '',
      'Click the paperclip to attach what you have:',
      '',
      '• Logo / icon lands on `sp_portal` via `Now.attach(...)` at build.',
      '• Figma export (`.zip` of React/Tailwind from Figma Make is fine) is translated into namespaced SCSS + AngularJS widget templates. Service Portal widgets are AngularJS 1.x — Figma React output is translated, not dropped in.',
      '',
      'Attach what you have, or say "skip". Then say "ready to build".',
    ].join('\n'),
    off: 'Tier? Sketch / Partial Figma / Full Figma. Attach via paperclip or "skip". Then "ready to build".',
  },
];

export interface RenderTurnContext {
  mode: ConsultantMode;
  // [LLM HOOK] When real-LLM-backed, pass spec + prior messages so the model
  // can adapt phrasing to what the user has already said.
  spec?: Spec | null;
}

export function renderTurn(turn: number, ctx: RenderTurnContext): string | null {
  const blueprint = TURNS[turn];
  if (!blueprint) return null;
  // [LLM HOOK] Replace with llm.chat using systemPromptFor(ctx.mode) and the
  // turn id as a structural instruction (e.g. "cover the audience beat").
  return ctx.mode === 'on' ? blueprint.on : blueprint.off;
}

export function canonicalTurnCount(): number {
  return TURNS.length;
}

export function turnIdAt(index: number): TurnId | null {
  return TURNS[index]?.id ?? null;
}

export interface EchoArgs {
  message: string;
  mode: ConsultantMode;
  proposalState: 'none' | 'pending' | 'approved' | 'declined';
  buildStatus: 'idle' | 'building' | 'success' | 'failed';
}

// Acknowledgement for user messages that don't match an approval keyword and
// are past the scripted turns. Kept deliberately short in both modes —
// Consultant Mode adds one advisory nudge, Builder Mode acknowledges only.
export function generateEchoReply(args: EchoArgs): string {
  const { message, mode, proposalState, buildStatus } = args;
  const echo = message.length > 80 ? message.slice(0, 80).trim() + '…' : message.trim();
  // [LLM HOOK] Swap with a single chat call. `mode` controls whether the
  // system prompt permits one advisory follow-up or requires terse output.
  if (mode === 'on') {
    if (proposalState === 'approved' && buildStatus === 'success') {
      return `Noted — "${echo}". Build is green; say "ready" or "build again" when you want me to re-summarize with the updates.`;
    }
    if (proposalState === 'approved') {
      return `Noted — "${echo}". Spec is approved — hit Build on the right when you're ready.`;
    }
    return `Noted — "${echo}". I've folded that into the spec. If this shifts scope meaningfully, we may want to revisit roles or the portal call before we lock. Say "ready to build" when you want the summary.`;
  }
  if (proposalState === 'approved' && buildStatus === 'success') {
    return `Noted. Say "build again" to re-summarize.`;
  }
  if (proposalState === 'approved') {
    return `Noted. Hit Build when ready.`;
  }
  return `Noted. Say "ready to build" when you want the summary.`;
}

// [LLM HOOK] System prompt to feed a real LLM when this layer is backed.
// Kept as data so tests can assert against it and so prompt changes land in
// exactly one place.
export function systemPromptFor(mode: ConsultantMode): string {
  if (mode === 'on') {
    return [
      'You are a senior ServiceNow solution architect and enterprise consultant.',
      'Tone: pragmatic, slightly dry, never condescending. Do not sound like a generic chatbot.',
      'Per turn, use the structure Reflect → (1–2) Expand → (1) Challenge → Propose.',
      'Hard limits: no more than 2 questions per turn; no monologues; no fabricated deploys or generations.',
      'Ground responses in Now SDK v4.4: Service Portal widgets are AngularJS (not React);',
      'Flow Designer cannot reliably resolve fields on brand-new scoped tables (prefer business rules + notifications);',
      'PDI scopes must start with x_<companycode>_; use Now.ID aliases for deterministic sys_ids.',
      'Canonical turns that must still be covered: audience, shape, data model, automation,',
      'permissions, Service Portal (yes/no + URL suffix), brand assets (logo/icon/Figma).',
      'Keep the Living Spec factual, not fluffy.',
    ].join(' ');
  }
  return [
    'You are a direct builder copilot for the ServiceNow Now SDK (v4.4).',
    'Tone: short, decision-oriented. Propose a default, then ask one thing at a time.',
    'Still ground in SDK v4.4 constraints, and still cover the Service Portal decision',
    'and brand assets — those are required questions.',
    'No advisory speeches. No fabricated deploys or generations.',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Table-definition parser
//
// Recognizes the bullet-list format the data-model turn asks for:
//   - event: name!, event_date (datetime), location → location, capacity (integer)
//
// Tolerant of the Markdown variants users actually type:
//   - leading bullet may be `-`, `*`, `•`, or absent
//   - separator between table-name and columns may be `:` or `(...)`
//   - reference arrow may be `→`, `->`, or `=>`
//   - column type may be in parens or omitted (defaults to string)
//   - mandatory marker is trailing `!` or `*`
//
// Returns null when no recognizable table line is present, so the caller can
// leave the project's existing tables untouched. Returns [] explicitly only
// when the user wrote something like "no tables" — but we don't try to detect
// that today; null is the safe default.
// ---------------------------------------------------------------------------

const KNOWN_TYPES: ColumnType[] = [
  'string',
  'integer',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'reference',
  'choice',
  'longtext',
];

const REF_ARROW = /\s*(?:→|->|=>)\s*/;

function snakeCase(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function titleCase(raw: string): string {
  return raw
    .replace(/[_\-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

function parseColumnSpec(raw: string): ColumnDef | null {
  let s = raw.trim();
  if (!s) return null;

  // Strip mandatory marker before anything else so it doesn't leak into the
  // type/reference parse.
  let mandatory = false;
  if (/[!*]$/.test(s)) {
    mandatory = true;
    s = s.replace(/[!*]+$/, '').trim();
  }

  // Reference column: `colname → table` or `colname (ref → table)` or
  // `colname (reference table)`.
  const refMatch = s.split(REF_ARROW);
  if (refMatch.length === 2) {
    const colName = snakeCase(refMatch[0].replace(/[()]/g, ''));
    const refTable = snakeCase(refMatch[1].replace(/[()]/g, ''));
    if (!colName || !refTable) return null;
    return {
      name: colName,
      label: titleCase(colName),
      type: 'reference',
      reference: refTable,
      ...(mandatory ? { mandatory: true } : {}),
    };
  }

  // Typed column: `colname (type)`.
  const typeMatch = s.match(/^([A-Za-z][\w\s-]*?)\s*\(([^)]+)\)\s*$/);
  if (typeMatch) {
    const colName = snakeCase(typeMatch[1]);
    const typeRaw = typeMatch[2].trim().toLowerCase();
    if (!colName) return null;

    // `(reference X)` or `(ref X)` form — synonymous with arrow form above.
    const refInParen = typeRaw.match(/^(?:reference|ref)\s+(.+)$/);
    if (refInParen) {
      const refTable = snakeCase(refInParen[1]);
      if (!refTable) return null;
      return {
        name: colName,
        label: titleCase(colName),
        type: 'reference',
        reference: refTable,
        ...(mandatory ? { mandatory: true } : {}),
      };
    }

    const type = (KNOWN_TYPES.find((t) => t === typeRaw) ?? 'string') as ColumnType;
    return {
      name: colName,
      label: titleCase(colName),
      type,
      ...(mandatory ? { mandatory: true } : {}),
    };
  }

  // Bare column name → string type.
  const colName = snakeCase(s);
  if (!colName) return null;
  return {
    name: colName,
    label: titleCase(colName),
    type: 'string',
    ...(mandatory ? { mandatory: true } : {}),
  };
}

interface ParseTableLineResult {
  name: string;
  columns: ColumnDef[];
}

function parseTableLine(line: string): ParseTableLineResult | null {
  // Strip leading bullet markers and whitespace. Markdown checkbox `[x]` /
  // `[ ]` and code-fence ticks also stripped — Figma-Make pasted output often
  // arrives wrapped in these.
  const cleaned = line
    .trim()
    .replace(/^[-*•]\s*/, '')
    .replace(/^```[a-zA-Z]*\s*$/, '')
    .replace(/^`+|`+$/g, '')
    .trim();
  if (!cleaned) return null;

  // Pattern A: `tableName: c1, c2, c3`
  // Pattern B: `tableName (c1, c2, c3)`
  // Both share a "name then columns" structure.
  let nameRaw: string | null = null;
  let columnsRaw: string | null = null;

  const colonSplit = cleaned.match(/^([A-Za-z][\w\s-]*?)\s*:\s*(.+)$/);
  if (colonSplit) {
    nameRaw = colonSplit[1];
    columnsRaw = colonSplit[2];
  } else {
    const parenSplit = cleaned.match(/^([A-Za-z][\w\s-]*?)\s*\(\s*(.+?)\s*\)\s*$/);
    if (parenSplit) {
      nameRaw = parenSplit[1];
      columnsRaw = parenSplit[2];
    }
  }
  if (!nameRaw || !columnsRaw) return null;

  const tableName = snakeCase(nameRaw);
  if (!tableName) return null;

  // Split columns on commas — but NOT on commas inside parens (reserved for
  // future `(choice: a, b, c)` extensions).
  const parts: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of columnsRaw) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);

  const columns = parts
    .map(parseColumnSpec)
    .filter((c): c is ColumnDef => c !== null);

  return { name: tableName, columns };
}

export function parseTableDefs(text: string): TableDef[] | null {
  if (!text) return null;

  // Strip code fences but keep their contents — users paste examples inside ```.
  const stripped = text
    .split('\n')
    .filter((l) => !/^\s*```/.test(l))
    .join('\n');

  const candidateLines = stripped
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const tables: TableDef[] = [];
  for (const line of candidateLines) {
    const parsed = parseTableLine(line);
    if (!parsed) continue;
    // Skip lines that look table-like but produced zero columns AND don't
    // start with a bullet — too easy to false-positive on regular prose like
    // "Tables: events, attendees" being misread as "events" with 0 cols.
    const looksBulleted = /^[-*•]/.test(line);
    if (parsed.columns.length === 0 && !looksBulleted) continue;
    tables.push({
      name: parsed.name,
      label: titleCase(parsed.name),
      // `extends` is left undefined — user can opt in via a future turn
      // ("extend task" / "standalone"). Default standalone is safer than
      // silently inheriting `task`'s workflow triggers.
      columns: parsed.columns,
    });
  }

  if (tables.length === 0) return null;
  return tables;
}

// ---------------------------------------------------------------------------
// Build prompt compilation (stub)
//
// [LLM HOOK] Phase 2 will feed the returned string to the generator LLM that
// emits the Fluent TypeScript. Today we only assemble a structured header so
// the mode is captured in the metadata; the real payload lands in Phase 2.
// ---------------------------------------------------------------------------

export interface BuildPromptMetaInternal {
  consultantMode: ConsultantMode;
  compiledAt: string;
  turnCoverage: TurnId[];
}

export function compileBuildPrompt(args: {
  spec: Spec | null;
  mode: ConsultantMode;
}): { content: string; meta: BuildPromptMetaInternal } | null {
  if (!args.spec) return null;
  const { spec, mode } = args;
  const header =
    mode === 'on'
      ? '// Generate via Now SDK v4.4. Consultant-mode intent: production-grade scaffolding with governance-aware defaults (roles, ACLs, audit trail, notifications).'
      : '// Generate via Now SDK v4.4. Builder-mode intent: ship the smallest correct scoped app that satisfies the spec.';
  const ui = spec.uiTrack;
  const uiTrackLine = (() => {
    if (!ui || ui.customUiNeeded === null) return '// UI track: unanswered';
    if (ui.customUiNeeded === false) return '// UI track: backend only (no custom UI)';
    const tier = ui.inputTier ?? 'tier-tbd';
    const fid = ui.expectedFidelity ?? 'fidelity-tbd';
    return `// UI track: Service Portal (audience=${ui.audienceTier}, input=${tier}, fidelity=${fid})`;
  })();
  const tableLines = spec.tables.length
    ? spec.tables.map((t) => {
        const colSummary = t.columns
          .map((c) => {
            const ref = c.type === 'reference' && c.reference ? `→${c.reference}` : '';
            const mand = c.mandatory ? '!' : '';
            return `${c.name}:${c.type}${ref}${mand}`;
          })
          .join(', ');
        const ext = t.extends ? ` extends ${t.extends}` : '';
        return `//   - ${t.name}${ext} → ${colSummary || '(no columns yet)'}`;
      })
      : ['//   (placeholder: single record table extending task — no spec.tables defined)'];
  const body = [
    header,
    `// Title: ${spec.title}`,
    `// Description: ${spec.description}`,
    '// Tables:',
    ...tableLines,
    `// Workflows: ${spec.technicalDetails.workflows.join(', ')}`,
    `// UI: ${spec.technicalDetails.ui_components.join(', ')}`,
    `// Portal: ${
      spec.portal?.enabled
        ? `yes (/${spec.portal.urlSuffix ?? 'suffix'})`
        : 'no (workspace only)'
    }`,
    uiTrackLine,
    `// Assets: ${spec.assets?.length ?? 0}`,
  ].join('\n');
  return {
    content: body,
    meta: {
      consultantMode: mode,
      compiledAt: new Date().toISOString(),
      turnCoverage: CANONICAL_TURN_IDS,
    },
  };
}
