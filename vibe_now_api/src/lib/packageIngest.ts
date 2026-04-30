// Package ingest — LLM-driven "read this app and tell me what it does."
//
// Runs after a package is imported. Walks the working copy, concatenates
// source files into a single review payload, and asks GPT-5 to produce a
// structured understanding (spec + decisions + refinement opportunities +
// per-section summaries + a primed intro message).
//
// The result is what makes the consultant SDK-aware AT THE PACKAGE LEVEL —
// without it, the agent only knows a package's name and file count. With
// it, the agent can answer "what does FlockAnalytics do?" or "where does
// the Adopt-a-Hen flow live?" without round-tripping to the codebase.

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { resolveProviderKey } from './llmCredentials.js';
import { recordUsage } from './usageTracker.js';
import { workingCopyPath } from './versions.js';
import { upsertProject } from './projects.js';
import type { ColumnTypeDTO, TableDefDTO } from '../types.js';

const COLUMN_TYPES: ColumnTypeDTO[] = [
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

// File patterns we read — ordered by priority. When the total payload
// exceeds the cap, files later in the priority list are truncated.
const FILE_PRIORITY: { match: (path: string) => boolean; label: string }[] = [
  { match: (p) => p.endsWith('now.config.json'), label: 'config' },
  { match: (p) => p === 'package.json', label: 'package' },
  { match: (p) => p.endsWith('.now.ts'), label: 'fluent-record' },
  { match: (p) => p.includes('/portal/') && p.endsWith('.html'), label: 'portal-html' },
  { match: (p) => p.includes('/portal/') && p.endsWith('.scss'), label: 'portal-scss' },
  { match: (p) => p.includes('/portal/') && p.endsWith('.client.js'), label: 'portal-client' },
  { match: (p) => p.includes('/portal/') && p.endsWith('.server.js'), label: 'portal-server' },
  { match: (p) => p.endsWith('.ts') && !p.includes('/generated/'), label: 'ts' },
];

const SKIP_DIRS = new Set([
  'node_modules',
  'target',
  'dist',
  '.git',
  '.now',
  'generated', // SDK auto-emit; not user-authored
]);

// 180KB cap on the concatenated source payload. GPT-5 handles much more,
// but bigger inputs degrade the structured-output reliability and inflate
// every ingest's cost. Most packages (Cluckworks=160KB, Shoreline=120KB)
// fit comfortably. Anything over the cap gets truncated with a marker.
const PAYLOAD_CAP_BYTES = 180_000;

interface DiscoveredFile {
  relativePath: string;
  absolutePath: string;
  size: number;
  priorityIndex: number;
  label: string;
}

async function walkPackage(root: string): Promise<DiscoveredFile[]> {
  const out: DiscoveredFile[] = [];
  const stack: { dir: string; rel: string }[] = [{ dir: root, rel: '' }];
  while (stack.length > 0) {
    const { dir, rel } = stack.pop()!;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const abs = join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        stack.push({ dir: abs, rel: relPath });
      } else if (entry.isFile()) {
        const matchIndex = FILE_PRIORITY.findIndex((p) => p.match(relPath));
        if (matchIndex === -1) continue;
        try {
          const s = await stat(abs);
          out.push({
            relativePath: relPath,
            absolutePath: abs,
            size: s.size,
            priorityIndex: matchIndex,
            label: FILE_PRIORITY[matchIndex].label,
          });
        } catch {
          // ignore unreadable file
        }
      }
    }
  }
  // Sort by priority first (config + package.json first, then Fluent
  // records), then alphabetically inside the same priority for stable
  // ordering across runs.
  out.sort((a, b) => {
    if (a.priorityIndex !== b.priorityIndex) return a.priorityIndex - b.priorityIndex;
    return a.relativePath.localeCompare(b.relativePath);
  });
  return out;
}

interface PayloadFile {
  relativePath: string;
  body: string;
  truncated: boolean;
}

async function buildPayload(files: DiscoveredFile[]): Promise<{
  payload: string;
  included: PayloadFile[];
  totalBytes: number;
  capped: boolean;
}> {
  let totalBytes = 0;
  const included: PayloadFile[] = [];
  let capped = false;
  for (const f of files) {
    if (totalBytes + f.size > PAYLOAD_CAP_BYTES) {
      // Try to include a truncated head of the file so the LLM at least
      // sees the imports + first record before we cut off.
      const remaining = Math.max(0, PAYLOAD_CAP_BYTES - totalBytes);
      if (remaining > 1024) {
        try {
          const buf = await readFile(f.absolutePath, 'utf8');
          const head = buf.slice(0, remaining);
          included.push({ relativePath: f.relativePath, body: head, truncated: true });
          totalBytes += head.length;
        } catch {
          // ignore
        }
      }
      capped = true;
      continue;
    }
    try {
      const body = await readFile(f.absolutePath, 'utf8');
      included.push({ relativePath: f.relativePath, body, truncated: false });
      totalBytes += body.length;
    } catch {
      // ignore unreadable file
    }
  }

  const sections = included
    .map((f) => {
      const header = `// ===== FILE: ${f.relativePath}${f.truncated ? ' (truncated)' : ''} =====`;
      return `${header}\n${f.body.trim()}\n`;
    })
    .join('\n');

  return { payload: sections, included, totalBytes, capped };
}

// ---------------------------------------------------------------------------
// Structured-output schema (strict mode — every property listed in required).
// ---------------------------------------------------------------------------

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'description',
    'features',
    'tables',
    'portal',
    'uiTrack',
    'architectureDecisions',
    'openQuestions',
    'perSectionSummary',
    'introMessage',
  ],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    features: { type: 'array', items: { type: 'string' } },
    tables: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'label', 'columns'],
        properties: {
          name: { type: 'string' },
          label: { type: 'string' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'label', 'type', 'reference', 'mandatory'],
              properties: {
                name: { type: 'string' },
                label: { type: 'string' },
                type: { type: 'string', enum: COLUMN_TYPES },
                reference: { type: ['string', 'null'] },
                mandatory: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    portal: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: ['enabled', 'urlSuffix'],
      properties: {
        enabled: { type: 'boolean' },
        urlSuffix: { type: ['string', 'null'] },
      },
    },
    uiTrack: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: ['customUiNeeded', 'audienceTier', 'inputTier'],
      properties: {
        customUiNeeded: { type: ['boolean', 'null'] },
        audienceTier: {
          type: ['string', 'null'],
          enum: ['audience-a', 'audience-b', null],
        },
        inputTier: {
          type: ['string', 'null'],
          enum: ['sketch', 'partial-figma', 'full-figma', null],
        },
      },
    },
    architectureDecisions: {
      type: 'array',
      items: { type: 'string' },
      description:
        '4–6 short sentences naming the load-bearing architectural choices the existing app committed to.',
    },
    openQuestions: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Refinement opportunities or ambiguities you spotted while reading the package — the things you would push back on if you were architecting this app today.',
    },
    perSectionSummary: {
      type: 'object',
      additionalProperties: false,
      required: ['tables', 'scriptIncludes', 'businessRules', 'restApis', 'widgets'],
      properties: {
        tables: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'summary'],
            properties: {
              name: { type: 'string' },
              summary: { type: 'string' },
            },
          },
        },
        scriptIncludes: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'summary'],
            properties: {
              name: { type: 'string' },
              summary: { type: 'string' },
            },
          },
        },
        businessRules: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'summary'],
            properties: {
              name: { type: 'string' },
              summary: { type: 'string' },
            },
          },
        },
        restApis: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'summary'],
            properties: {
              name: { type: 'string' },
              summary: { type: 'string' },
            },
          },
        },
        widgets: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'summary'],
            properties: {
              name: { type: 'string' },
              summary: { type: 'string' },
            },
          },
        },
      },
    },
    introMessage: {
      type: 'string',
      description:
        'The first message the user will see in chat. Use 3–5 short paragraphs. Lead with what the app DOES, then what stands out architecturally, then 2–3 concrete refinement opportunities phrased as "I would consider…" rather than "you should…". Slightly dry, never preachy. Sign off by inviting the user to name what they want to refine first.',
    },
  },
} as const;

const SYSTEM_PROMPT = [
  'You are a senior ServiceNow solution architect doing a code review of an existing scoped application built with @servicenow/sdk Fluent (v4.4).',
  '',
  'You receive the full source tree as a concatenated payload. Your job:',
  '1. Understand what this app actually does end-to-end.',
  '2. Surface the architectural commitments baked into the code (table relationships, role hierarchy, portal vs workspace UI, automation patterns).',
  '3. Spot refinement opportunities — code smells, missing pieces, gotchas the SDK has bitten you on before, places where the design has drifted from the comment-stated intent.',
  '4. Produce a structured review the consultant can use to ground every subsequent chat turn.',
  '',
  'ServiceNow rules to honor when reviewing:',
  '- Service Portal widgets are AngularJS 1.x + Bootstrap 3. They need 5 files (HTML, SCSS, server.js, client.js, now.ts) and 5 layout records (sp_page → sp_container → sp_row → sp_column → sp_instance) to render. Flag widgets missing pieces.',
  '- `Now.ID["alias"]` works only at `$id` positions; in data fields use `Now.ref("table","alias")`. Exception: sp_page references must be a hardcoded sys_id from generated/keys.ts.',
  '- Catalog items do not accept a `category` prop — link via sc_cat_item_category records.',
  '- Flow Designer cannot resolve fields on brand-new scoped tables in v4.4 — prefer business rules + notifications.',
  '- PDI scopes must start with `x_<companycode>_` and stay under 18 characters.',
  '',
  'Output the structured review. Do NOT invent features the code does not implement. When the code is ambiguous, surface it as an openQuestion rather than guessing.',
].join('\n');

export interface IngestResult {
  spec: {
    title: string;
    description: string;
    features: string[];
    tables: TableDefDTO[];
    portal: { enabled: boolean; urlSuffix?: string } | null;
    uiTrack: {
      customUiNeeded?: boolean | null;
      audienceTier?: 'audience-a' | 'audience-b';
      inputTier?: 'sketch' | 'partial-figma' | 'full-figma' | null;
    } | null;
  };
  architectureDecisions: string[];
  openQuestions: string[];
  perSectionSummary: {
    tables: { name: string; summary: string }[];
    scriptIncludes: { name: string; summary: string }[];
    businessRules: { name: string; summary: string }[];
    restApis: { name: string; summary: string }[];
    widgets: { name: string; summary: string }[];
  };
  introMessage: string;
  /** Diagnostic info — how many files we read, whether we hit the cap. */
  ingestStats: {
    filesRead: number;
    bytesRead: number;
    capped: boolean;
  };
}

export interface IngestOptions {
  projectId: string;
  apiKey?: string;
  model?: string;
}

export async function ingestPackage(opts: IngestOptions): Promise<IngestResult> {
  const apiKey = opts.apiKey ?? resolveProviderKey('openai');
  if (!apiKey) {
    throw new Error(
      'No OpenAI key configured. Open Settings → LLM Provider in the app to add one, or set OPENAI_API_KEY in vibe_now_api/.env.',
    );
  }

  const root = workingCopyPath(opts.projectId);
  if (!existsSync(root)) {
    throw new Error(`Working copy missing for project ${opts.projectId}.`);
  }

  const files = await walkPackage(root);
  if (files.length === 0) {
    throw new Error('Package is empty — no Fluent records found under src/.');
  }
  const { payload, included, totalBytes, capped } = await buildPayload(files);

  const model = opts.model ?? process.env.OPENAI_MODEL ?? 'gpt-5';
  const client = new OpenAI({ apiKey, maxRetries: 3, timeout: 240_000 });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          'Source tree follows. Each file is preceded by a `===== FILE: ... =====` header.',
          '',
          payload,
          '',
          '---',
          'Produce the structured review.',
        ].join('\n'),
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'vibe_overyonder_package_ingest',
        strict: true,
        schema: SCHEMA,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned an empty response.');

  // Record usage with the package-ingest request_type so the cost UI
  // distinguishes ingests from regular chat turns.
  if (completion.usage) {
    // Make sure the project row exists so the FK doesn't reject the row —
    // belt-and-suspenders since the import path already upserts.
    upsertProject({ id: opts.projectId, name: 'package' });
    recordUsage({
      projectId: opts.projectId,
      versionId: null,
      provider: 'openai',
      model,
      inputTokens: completion.usage.prompt_tokens ?? 0,
      outputTokens: completion.usage.completion_tokens ?? 0,
      requestType: 'package-ingest',
      prompt: `[package-ingest • ${included.length} files • ${totalBytes} bytes${capped ? ' • capped' : ''}]`,
      responseSummary: raw.slice(0, 200),
    });
  }

  const parsed = JSON.parse(raw) as {
    title: string;
    description: string;
    features: string[];
    tables: (TableDefDTO & {
      columns: (TableDefDTO['columns'][number] & { reference: string | null })[];
    })[];
    portal: { enabled: boolean; urlSuffix: string | null } | null;
    uiTrack: {
      customUiNeeded: boolean | null;
      audienceTier: 'audience-a' | 'audience-b' | null;
      inputTier: 'sketch' | 'partial-figma' | 'full-figma' | null;
    } | null;
    architectureDecisions: string[];
    openQuestions: string[];
    perSectionSummary: IngestResult['perSectionSummary'];
    introMessage: string;
  };

  // Normalize the strict-schema nullables back to optional fields so the
  // frontend Spec types fit unchanged.
  return {
    spec: {
      title: parsed.title,
      description: parsed.description,
      features: parsed.features,
      tables: parsed.tables.map((t) => ({
        name: t.name,
        label: t.label,
        columns: t.columns.map((c) => ({
          name: c.name,
          label: c.label,
          type: c.type,
          mandatory: c.mandatory,
          ...(c.reference ? { reference: c.reference } : {}),
        })),
      })),
      portal: parsed.portal
        ? {
            enabled: parsed.portal.enabled,
            ...(parsed.portal.urlSuffix ? { urlSuffix: parsed.portal.urlSuffix } : {}),
          }
        : null,
      uiTrack: parsed.uiTrack
        ? {
            customUiNeeded: parsed.uiTrack.customUiNeeded,
            audienceTier: parsed.uiTrack.audienceTier ?? undefined,
            inputTier: parsed.uiTrack.inputTier ?? undefined,
          }
        : null,
    },
    architectureDecisions: parsed.architectureDecisions,
    openQuestions: parsed.openQuestions,
    perSectionSummary: parsed.perSectionSummary,
    introMessage: parsed.introMessage,
    ingestStats: {
      filesRead: included.length,
      bytesRead: totalBytes,
      capped,
    },
  };
}
