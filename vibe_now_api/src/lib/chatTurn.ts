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

// reasoning_effort is only valid on the o-series + gpt-5 family. Sending
// it to a non-reasoning model errors with HTTP 400, so gate by name.
function isReasoningModel(model: string): boolean {
  return /^(o\d|gpt-5)/i.test(model);
}

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
  // Default to gpt-5-mini for chat: the four-beat consultant loop doesn't
  // need flagship reasoning, and mini cuts perceived latency by ~3-5×.
  // The OPENAI_MODEL env override + opts.model are both still honored so
  // a user who explicitly wants gpt-5 can opt back in.
  const model = opts.model ?? process.env.OPENAI_MODEL ?? 'gpt-5-mini';
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
    // GPT-5 family: skip the chain-of-thought for chat turns. The
    // consultant loop is conversational, not analytical, so the
    // reasoning tokens default ('medium') just adds latency without
    // improving the structured output.
    ...(isReasoningModel(model) ? { reasoning_effort: 'minimal' as const } : {}),
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

// ---------------------------------------------------------------------------
// Streaming variant — the route surface uses this so the user sees the
// agent's `message` reply token-by-token rather than waiting on the full
// structured payload. The `specPatch` and other state-changing fields
// arrive in the final 'done' event because they aren't readable until
// the JSON is complete.
// ---------------------------------------------------------------------------

export type ChatTurnStreamEvent =
  | { type: 'message-delta'; text: string }
  | { type: 'done'; response: ChatTurnResponse }
  | { type: 'error'; message: string };

// Walk a partial JSON buffer and return whatever we can decode of the
// `message` string field. Returns null until the field opens. Handles
// standard JSON escapes including `\uXXXX`.
function extractPartialMessage(buf: string): string | null {
  const marker = '"message":"';
  const start = buf.indexOf(marker);
  if (start === -1) return null;
  let i = start + marker.length;
  let out = '';
  while (i < buf.length) {
    const ch = buf[i];
    if (ch === '\\') {
      if (i + 1 >= buf.length) break; // need more bytes to decode escape
      const next = buf[i + 1];
      switch (next) {
        case 'n':
          out += '\n';
          i += 2;
          break;
        case 't':
          out += '\t';
          i += 2;
          break;
        case 'r':
          out += '\r';
          i += 2;
          break;
        case '"':
          out += '"';
          i += 2;
          break;
        case '\\':
          out += '\\';
          i += 2;
          break;
        case '/':
          out += '/';
          i += 2;
          break;
        case 'b':
          out += '\b';
          i += 2;
          break;
        case 'f':
          out += '\f';
          i += 2;
          break;
        case 'u': {
          if (i + 5 >= buf.length) return out; // wait for full \uXXXX
          const hex = buf.slice(i + 2, i + 6);
          const code = Number.parseInt(hex, 16);
          if (Number.isNaN(code)) {
            i += 2;
            break;
          }
          out += String.fromCharCode(code);
          i += 6;
          break;
        }
        default:
          out += next;
          i += 2;
          break;
      }
      continue;
    }
    if (ch === '"') return out; // string terminated
    out += ch;
    i++;
  }
  return out;
}

function buildResponse(raw: string, usageRecord: UsageRecord | null, usage: {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
} | null): ChatTurnResponse {
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
  const out: ChatTurnResponse = {
    message: parsed.message,
    readyToBuild: parsed.readyToBuild || undefined,
  };
  if (parsed.specPatch) {
    const p = parsed.specPatch;
    const patch: ChatTurnSpecPatch = {};
    if (p.portal) {
      patch.portal = { enabled: p.portal.enabled, urlSuffix: p.portal.urlSuffix };
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

export async function* streamChatTurn(
  req: ChatTurnRequest,
  opts: ChatTurnOptions = {},
): AsyncGenerator<ChatTurnStreamEvent, void, void> {
  const apiKey = opts.apiKey ?? resolveProviderKey('openai');
  if (!apiKey) {
    yield {
      type: 'error',
      message:
        'No OpenAI key configured. Open Settings → LLM Provider in the app to add one, or set OPENAI_API_KEY in vibe_now_api/.env.',
    };
    return;
  }
  const model = opts.model ?? process.env.OPENAI_MODEL ?? 'gpt-5-mini';
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

  const recent = req.messages.slice(-30);

  let stream;
  try {
    stream = await client.chat.completions.create({
      model,
      ...(isReasoningModel(model) ? { reasoning_effort: 'minimal' as const } : {}),
      stream: true,
      stream_options: { include_usage: true },
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
  } catch (err) {
    yield { type: 'error', message: (err as Error).message ?? 'OpenAI request failed' };
    return;
  }

  let raw = '';
  let emittedLen = 0;
  let usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null = null;

  // Manual drain of the OpenAI stream. `for await` doesn't iterate
  // reliably when used INSIDE an async generator (same root cause as
  // the route's manual drain — yielding back to the consumer between
  // for-await iterations confuses the iterator protocol). Using
  // `streamIter.next()` directly is functionally identical and works.
  const streamIter = (stream as AsyncIterable<unknown>)[Symbol.asyncIterator]();
  try {
    while (true) {
      const r = await streamIter.next();
      if (r.done) break;
      const chunk = r.value as {
        choices?: Array<{ delta?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        raw += delta;
        const decoded = extractPartialMessage(raw);
        if (decoded !== null && decoded.length > emittedLen) {
          yield { type: 'message-delta', text: decoded.slice(emittedLen) };
          emittedLen = decoded.length;
        }
      }
      // Final chunk carries usage when stream_options.include_usage is true.
      if (chunk.usage) {
        usage = {
          prompt_tokens: chunk.usage.prompt_tokens,
          completion_tokens: chunk.usage.completion_tokens,
          total_tokens: chunk.usage.total_tokens,
        };
      }
    }
  } catch (err) {
    yield { type: 'error', message: (err as Error).message ?? 'stream interrupted' };
    return;
  }

  if (!raw) {
    yield { type: 'error', message: 'OpenAI returned an empty response.' };
    return;
  }

  // Record usage before parsing — capture spend even if structured output
  // came back malformed.
  let usageRecord: UsageRecord | null = null;
  if (usage) {
    const lastUserContent =
      recent.findLast?.((m) => m.role === 'user')?.content ??
      recent.filter((m) => m.role === 'user').pop()?.content ??
      null;
    usageRecord = recordUsage({
      projectId: opts.projectId ?? null,
      versionId: opts.versionId ?? null,
      provider: 'openai',
      model,
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
      requestType: 'chat',
      prompt: lastUserContent ? lastUserContent.slice(0, 500) : null,
      responseSummary: raw.slice(0, 200),
    });
  }

  let response: ChatTurnResponse;
  try {
    response = buildResponse(raw, usageRecord, usage);
  } catch (err) {
    yield {
      type: 'error',
      message: `Could not parse model output: ${(err as Error).message}`,
    };
    return;
  }
  yield { type: 'done', response };
}
