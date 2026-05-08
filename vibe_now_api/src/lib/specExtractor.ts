// Spec extractor — LLM pass that turns a doc's text into a structured Spec.
//
// Uses OpenAI's structured-output API (response_format: json_schema, strict)
// so the model returns a payload that matches our Spec shape without
// post-processing or fragile JSON repair. The schema below is the contract;
// adjust here when SpecInput changes in src/types.ts.
//
// Model defaults to gpt-5 (per user preference); override via OPENAI_MODEL
// env var. Key comes from OPENAI_API_KEY — without it the route surfaces a
// 503 with a clear message rather than a stack trace.

import OpenAI from 'openai';
import { resolveProviderKey } from './llmCredentials.js';
import { recordUsage } from './usageTracker.js';
import type { ColumnTypeDTO, TableDefDTO } from '../types.js';

export interface ExtractedSpec {
  title: string;
  description: string;
  features: string[];
  tables: TableDefDTO[];
  portal?: {
    enabled: boolean;
    urlSuffix?: string;
  };
  /** Free-form architecture decisions the LLM committed to, surfaced back
   *  to the user as the consultant's first message ("I read your doc and
   *  decided X…"). Each item is a short sentence. */
  architectureDecisions: string[];
  /** Open questions the LLM flagged but couldn't decide from the doc alone.
   *  Become the next consulting prompts the user sees. */
  openQuestions: string[];
}

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

const SYSTEM_PROMPT = [
  'You are a senior ServiceNow solution architect.',
  "Read the user's product/requirements document and extract a deployable scoped-app specification.",
  'Decide pragmatic backend defaults yourself — do not punt to the user on small things.',
  'Specifically commit to: the data model (tables + columns), whether a Service Portal is needed,',
  'and a portal URL suffix if one is needed.',
  'Use ServiceNow-native column types (string, integer, decimal, boolean, date, datetime, reference,',
  'choice, longtext). Mark mandatory fields explicitly. For reference columns, set `reference` to',
  'the post-prefix table name in this same spec (e.g. "event"), or to a known OOB table',
  '("sys_user", "task", "incident", "change_request", "sc_req_item", "cmdb_ci", "kb_knowledge").',
  'Table names are snake_case singular (event, attendee, location). Labels are Title Case.',
  'Surface 2–4 architectureDecisions that name the load-bearing choices you made and why.',
  'Surface up to 3 openQuestions only when the doc genuinely leaves them ambiguous —',
  "don't manufacture questions to seem thorough.",
].join(' ');

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'description',
    'features',
    'tables',
    'portal',
    'architectureDecisions',
    'openQuestions',
  ],
  properties: {
    title: { type: 'string', description: 'Short product name (1–6 words).' },
    description: { type: 'string', description: 'One- to two-sentence summary.' },
    features: {
      type: 'array',
      description: 'High-level feature bullets (5–8 items).',
      items: { type: 'string' },
    },
    tables: {
      type: 'array',
      description: 'Domain entities. One per business object.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'label', 'columns'],
        properties: {
          name: { type: 'string', description: 'snake_case singular, no scope prefix.' },
          label: { type: 'string', description: 'Title Case display label.' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              // Strict mode requires every property to appear in `required`.
              // `reference` is null-typed for non-reference columns; keep it
              // listed here so the schema validates.
              required: ['name', 'label', 'type', 'reference', 'mandatory'],
              properties: {
                name: { type: 'string' },
                label: { type: 'string' },
                type: { type: 'string', enum: COLUMN_TYPES },
                reference: {
                  type: ['string', 'null'],
                  description:
                    'For type=reference: the post-prefix table name in this spec, or an OOB table. Pass null for non-reference columns.',
                },
                mandatory: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    portal: {
      type: 'object',
      additionalProperties: false,
      required: ['enabled', 'urlSuffix'],
      properties: {
        enabled: { type: 'boolean' },
        urlSuffix: {
          type: ['string', 'null'],
          description:
            'Lowercase, ≤ 8 chars when enabled. Null when portal is not needed.',
        },
      },
    },
    architectureDecisions: {
      type: 'array',
      items: { type: 'string' },
      description: '2–4 short sentences naming the load-bearing choices.',
    },
    openQuestions: {
      type: 'array',
      items: { type: 'string' },
      description: '0–3 questions only when the doc is genuinely ambiguous.',
    },
  },
} as const;

export interface ExtractOptions {
  apiKey?: string;
  model?: string;
  /** When the extractor is called for an existing project (rare — usually
   *  it's the very first turn before a project id exists) we still want
   *  the usage row to FK correctly. */
  projectId?: string;
}

export async function extractSpecFromText(
  docText: string,
  opts: ExtractOptions = {},
): Promise<ExtractedSpec> {
  // Resolution ladder: explicit opts.apiKey → stored credential for 'openai'
  // → OPENAI_API_KEY env var. The stored credential is the path the Settings
  // UI writes into; the env var is the dev shortcut for local hacking.
  const apiKey = opts.apiKey ?? resolveProviderKey('openai');
  if (!apiKey) {
    throw new Error(
      'No OpenAI key configured. Open Settings → LLM Provider in the app to add one, or set OPENAI_API_KEY in vibe_now_api/.env.',
    );
  }
  // Default to gpt-5-mini with low reasoning_effort for spec extraction.
  // Doc → structured spec is a relatively mechanical transformation, not
  // analytical reasoning — flagship gpt-5 with default reasoning was
  // taking 60–120s; mini with low effort lands in 15–30s on the same
  // input. opts.model + OPENAI_MODEL env still let users opt back in.
  const model = opts.model ?? process.env.OPENAI_MODEL ?? 'gpt-5-mini';
  const client = new OpenAI({ apiKey, maxRetries: 3, timeout: 180_000 });

  const completion = await client.chat.completions.create({
    model,
    ...(/^(o\d|gpt-5)/i.test(model) ? { reasoning_effort: 'low' as const } : {}),
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          'Document:',
          '---',
          // Cap raw input at 60k chars (~15k tokens). Most product docs are
          // far smaller; on truncation the LLM still has the front matter
          // which is where the spec usually lives.
          docText.length > 60_000 ? docText.slice(0, 60_000) + '\n\n[…truncated…]' : docText,
          '---',
          'Extract the spec.',
        ].join('\n'),
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'vibe_overyonder_spec',
        strict: true,
        schema: SCHEMA,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('OpenAI returned an empty response.');
  }

  // Record usage immediately — even if JSON.parse below throws, the spend
  // is captured so the cost UI stays honest.
  if (completion.usage) {
    recordUsage({
      projectId: opts.projectId ?? null,
      versionId: null,
      provider: 'openai',
      model,
      inputTokens: completion.usage.prompt_tokens ?? 0,
      outputTokens: completion.usage.completion_tokens ?? 0,
      requestType: 'spec-extract',
      // Doc-extract has no chat-style prompt; capture the doc fingerprint
      // (length + first 100 chars) so the by-turn modal has something
      // recognizable.
      prompt: `[doc-extract • ${docText.length} chars] ${docText.slice(0, 100)}`,
      responseSummary: raw.slice(0, 200),
    });
  }

  const parsed = JSON.parse(raw) as ExtractedSpec & {
    portal: { enabled: boolean; urlSuffix: string | null };
    tables: (TableDefDTO & {
      columns: (TableDefDTO['columns'][number] & { reference: string | null })[];
    })[];
  };

  // Normalize the strict-schema nullables back to optional fields so the
  // downstream code (fluentGen, frontend) can keep its `reference?: string`
  // and `urlSuffix?: string` shapes.
  return {
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
    portal: {
      enabled: parsed.portal.enabled,
      ...(parsed.portal.urlSuffix ? { urlSuffix: parsed.portal.urlSuffix } : {}),
    },
    architectureDecisions: parsed.architectureDecisions,
    openQuestions: parsed.openQuestions,
  };
}
