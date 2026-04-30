// Conversational LLM turn — the consultant's reply for a single user message.
//
// Replaces the scripted canonical-turn machinery in the frontend's
// assistantBehavior.ts (which is now demoted to the offline / no-key
// fallback per vibe_overyonder.md §14.1, decision C).
//
// OpenAI structured output enforces the {message, specPatch?, readyToBuild?}
// contract so the frontend can apply state changes without parsing prose.

import OpenAI from 'openai';
import { resolveProviderKey } from './llmCredentials.js';
import { SDK_BUNDLE } from './sdkBundle.js';
import { recordUsage, type UsageRecord } from './usageTracker.js';
import type { ColumnTypeDTO, TableDefDTO } from '../types.js';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatTurnSpec {
  title: string;
  description?: string;
  tables?: TableDefDTO[];
  portal?: { enabled: boolean; urlSuffix?: string };
  uiTrack?: {
    customUiNeeded?: boolean | null;
    audienceTier?: 'audience-a' | 'audience-b';
    inputTier?: 'sketch' | 'partial-figma' | 'full-figma' | null;
  };
  architectureDecisions?: string[];
  openQuestions?: string[];
}

export type ConsultantMode = 'on' | 'off';

export interface ChatTurnRequest {
  messages: ChatMessage[];
  spec: ChatTurnSpec;
  consultantMode: ConsultantMode;
}

export interface ChatTurnSpecPatch {
  portal?: { enabled: boolean; urlSuffix: string | null };
  tables?: TableDefDTO[];
  answeredQuestions?: string[];
  addedQuestions?: string[];
  uiTrack?: {
    customUiNeeded?: boolean | null;
    audienceTier?: 'audience-a' | 'audience-b';
    inputTier?: 'sketch' | 'partial-figma' | 'full-figma' | null;
  };
}

export interface ChatTurnResponse {
  message: string;
  specPatch?: ChatTurnSpecPatch;
  readyToBuild?: boolean;
  /** Token + cost record id for the cost UIs to link back to this turn. */
  usage?: {
    refinementRunId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    rawCost: number;
    billableCost: number;
  };
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

// Strict-mode JSON schema. Every property must appear in `required` (with
// nullable types where the field is optional) — same constraint that bit the
// spec-extract schema earlier. Optional fields are typed `[T, "null"]` so the
// model can express "not set" without dropping the key.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['message', 'specPatch', 'readyToBuild'],
  properties: {
    message: {
      type: 'string',
      description: "The consultant's natural-language reply to the user.",
    },
    readyToBuild: {
      type: 'boolean',
      description:
        'True when the user has signaled approval to build (e.g. "ready", "ship it", "let\'s go") and the spec is in a deployable state.',
    },
    specPatch: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: [
        'portal',
        'tables',
        'answeredQuestions',
        'addedQuestions',
        'uiTrack',
      ],
      properties: {
        portal: {
          type: ['object', 'null'],
          additionalProperties: false,
          required: ['enabled', 'urlSuffix'],
          properties: {
            enabled: { type: 'boolean' },
            urlSuffix: { type: ['string', 'null'] },
          },
        },
        tables: {
          type: ['array', 'null'],
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
        answeredQuestions: {
          type: ['array', 'null'],
          items: { type: 'string' },
          description:
            "Open questions the user just resolved this turn. Strings must match the open-question entry verbatim so the frontend can prune them.",
        },
        addedQuestions: {
          type: ['array', 'null'],
          items: { type: 'string' },
          description: 'New open questions you want to surface for the next turn.',
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
      },
    },
  },
} as const;

function specSummary(spec: ChatTurnSpec): string {
  const lines: string[] = [];
  lines.push(`Title: ${spec.title}`);
  if (spec.description) lines.push(`Description: ${spec.description}`);
  if (spec.tables?.length) {
    lines.push(
      `Tables (${spec.tables.length}): ${spec.tables.map((t) => t.name).join(', ')}`,
    );
    for (const t of spec.tables) {
      lines.push(
        `  - ${t.name} [${t.label}]: ${t.columns
          .map(
            (c) =>
              `${c.name}:${c.type}${c.mandatory ? '!' : ''}${c.reference ? `→${c.reference}` : ''}`,
          )
          .join(', ')}`,
      );
    }
  } else {
    lines.push('Tables: (none yet)');
  }
  if (spec.portal) {
    lines.push(
      `Portal: ${spec.portal.enabled ? `enabled at /${spec.portal.urlSuffix ?? '?'}` : 'disabled'}`,
    );
  } else {
    lines.push('Portal: (not yet decided)');
  }
  if (spec.uiTrack) {
    const u = spec.uiTrack;
    lines.push(
      `UI track: customUiNeeded=${u.customUiNeeded ?? 'unset'}, audience=${u.audienceTier ?? 'audience-a'}, inputTier=${u.inputTier ?? 'unset'}`,
    );
  }
  if (spec.architectureDecisions?.length) {
    lines.push('Architecture decisions committed so far:');
    for (const d of spec.architectureDecisions) lines.push(`  - ${d}`);
  }
  if (spec.openQuestions?.length) {
    lines.push('Open questions still unresolved:');
    for (const q of spec.openQuestions) lines.push(`  - ${q}`);
  } else {
    lines.push('Open questions: (none — but stay alert for new ambiguities)');
  }
  return lines.join('\n');
}

function modeNote(mode: ConsultantMode): string {
  return mode === 'on'
    ? 'Mode: Consultant. Use Reflect → Expand → Challenge → Propose. Push back when something is risky.'
    : "Mode: Direct Build. Be terse, propose a default, ask one thing at a time.";
}

export interface ChatTurnOptions {
  apiKey?: string;
  model?: string;
  /** Backend project id — when present, usage rows will FK to it so the
   *  cost UIs can roll up by project. Frontend passes its localStorage
   *  project id; backend upserts the projects row before this is called. */
  projectId?: string;
  /** Active version id when the project is opened from disk and on a
   *  specific snapshot. Optional. */
  versionId?: string;
}

export async function runChatTurn(
  req: ChatTurnRequest,
  opts: ChatTurnOptions = {},
): Promise<ChatTurnResponse> {
  const apiKey = opts.apiKey ?? resolveProviderKey('openai');
  if (!apiKey) {
    throw new Error(
      'No OpenAI key configured. Open Settings → LLM Provider in the app to add one, or set OPENAI_API_KEY in vibe_now_api/.env.',
    );
  }
  const model = opts.model ?? process.env.OPENAI_MODEL ?? 'gpt-5';
  // Conversational turns are usually < 30s but can spike. Match the spec
  // extractor's resilience profile so a transient network blip doesn't
  // strand the user mid-conversation.
  const client = new OpenAI({ apiKey, maxRetries: 3, timeout: 120_000 });

  const systemPrompt = [
    SDK_BUNDLE,
    '',
    '---',
    '',
    '## Current spec snapshot',
    '',
    specSummary(req.spec),
    '',
    modeNote(req.consultantMode),
    '',
    'Respond with the structured object. Your `message` field is what the user sees in the chat. The `specPatch` is how state changes are committed — only emit it when the user has actually decided something this turn. **If `openQuestions` above contains items the user has not addressed, name them in your reply rather than moving on.**',
  ].join('\n');

  // Cap recent history at 30 turns to keep the prompt bounded. The system
  // prompt + spec snapshot already give the model the durable context.
  const recent = req.messages.slice(-30);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...recent.map((m) => ({ role: m.role, content: m.content })),
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'vibe_overyonder_chat_turn',
        strict: true,
        schema: SCHEMA,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned an empty response.');

  // Record usage + cost. We do this BEFORE parsing the JSON so that even if
  // the model returns malformed structured output, the spend is captured.
  const usage = completion.usage;
  let usageRecord: UsageRecord | null = null;
  if (usage) {
    const lastUserContent = recent.findLast?.((m) => m.role === 'user')?.content
      ?? recent.filter((m) => m.role === 'user').pop()?.content
      ?? null;
    usageRecord = recordUsage({
      projectId: opts.projectId ?? null,
      versionId: opts.versionId ?? null,
      provider: 'openai',
      model,
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
      requestType: 'chat',
      prompt: lastUserContent ? lastUserContent.slice(0, 500) : null,
      // raw is the full JSON from the model; first 200 chars is enough
      // context for the by-turn modal preview.
      responseSummary: raw.slice(0, 200),
    });
  }

  const parsed = JSON.parse(raw) as {
    message: string;
    readyToBuild: boolean;
    specPatch: {
      portal: { enabled: boolean; urlSuffix: string | null } | null;
      tables: TableDefDTO[] | null;
      answeredQuestions: string[] | null;
      addedQuestions: string[] | null;
      uiTrack: {
        customUiNeeded: boolean | null;
        audienceTier: 'audience-a' | 'audience-b' | null;
        inputTier: 'sketch' | 'partial-figma' | 'full-figma' | null;
      } | null;
    } | null;
  };

  // Normalize strict-schema nulls back to optional fields so the frontend
  // can pattern-match on field presence.
  const out: ChatTurnResponse = {
    message: parsed.message,
    readyToBuild: parsed.readyToBuild || undefined,
  };
  if (parsed.specPatch) {
    const p = parsed.specPatch;
    const patch: ChatTurnSpecPatch = {};
    if (p.portal) {
      patch.portal = {
        enabled: p.portal.enabled,
        urlSuffix: p.portal.urlSuffix,
      };
    }
    if (p.tables) patch.tables = p.tables;
    if (p.answeredQuestions?.length) patch.answeredQuestions = p.answeredQuestions;
    if (p.addedQuestions?.length) patch.addedQuestions = p.addedQuestions;
    if (p.uiTrack) {
      const u = p.uiTrack;
      const ut: ChatTurnSpecPatch['uiTrack'] = {};
      if (u.customUiNeeded !== null) ut.customUiNeeded = u.customUiNeeded;
      if (u.audienceTier !== null) ut.audienceTier = u.audienceTier;
      if (u.inputTier !== null) ut.inputTier = u.inputTier;
      if (Object.keys(ut).length > 0) patch.uiTrack = ut;
    }
    if (Object.keys(patch).length > 0) out.specPatch = patch;
  }
  if (usageRecord && usage) {
    out.usage = {
      refinementRunId: usageRecord.refinementRunId,
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
      rawCost: usageRecord.rawCost,
      billableCost: usageRecord.billableCost,
    };
  }
  return out;
}
