# Vibe Now — Product & UI Specification for GPT

**Audience:** GPT-5, operating as the product architect that will turn this document into a Figma Make prompt pack that builds the UI of `Vibe Now`.

**Role you will play:** You are not writing code. You are (1) authoring a clear internal model of the product, (2) producing Figma Make instructions that another GPT instance will feed Figma, and (3) defining the UX language of a consulting AI agent that sits *inside* the product and helps users refine their idea before any code is generated.

---

## 1. What we are building

**Vibe Now** is a cutting-edge "vibe-coding" studio for the **ServiceNow Now SDK (v4.4)**. A user walks in with a rough idea ("I want a chicken farm app with adopt-a-hen"), has a **consultative conversation** with an AI agent, and walks out with a **fully-scaffolded, deployed ServiceNow scoped application** — tables, roles, ACLs, business rules, catalog items, Service Portal pages, Scripted REST APIs — all generated via the Now SDK's Fluent API and installed to their PDI in one click.

It is the Lovable / Bolt.new / v0 experience, but the target platform is **ServiceNow**, not a generic web app.

### Why this is cutting edge
1. **No other tool does this for ServiceNow.** The ecosystem has Studio, App Engine Studio, and the Now SDK CLI. None of them accept a natural-language description and produce a deployable app.
2. **It replaces update-sets with source-controlled, version-pinned, LLM-generated Fluent TypeScript** — which the SDK publishes as a true app package (same channel as the Store), not a diff of record changes.
3. **The consulting layer is the product.** We are not a wizard that marches the user down a fixed path. We are an **AI consultant** that interrogates, challenges, researches, and co-designs before a single SDK call is made.

### Two sibling projects already exist in this workspace — reference them, do not duplicate them
- `snow-converter/` — a converter that ingests a GitHub repo and outputs a Now SDK project. **Vibe Now is the greenfield companion**: start from a conversation, not a repo.
- `sdk-examples/cluck-sample/` and `sdk-examples/shoreline-rentals-sample/` — two reference SDK apps already deployed to PDI `dev378814`. These are the **gold-standard outputs** Vibe Now should be capable of producing from scratch.

---

## 2. Philosophical frame — take the best of Vibe Refactor, leave the wizard

Vibe Refactor (the zip the user shared) is the seed idea. Its *shape* is a 5–6 step wizard: load script → capture answers → summarize → build pack → create app. It is linear, staged, and modal.

**We are keeping:**
- The **Agent Assist** loop (evaluate user answer against project context, return `isSpecificEnough`, short actionable suggestions).
- The **Research & Examples** loop (surface insights, real-world concrete examples with title/description/relevance, industry practices).
- The **Clean Text** loop (voice/messy input → cleaned, structured text).
- The **Detailed Summary** as the contract between conversation and code generation: one-sentence definition, includes/excludes, screens with UI elements, user flow, AI architecture (when applicable), data sources, legal guardrails, master build prompt.
- The **LLM-settings panel** and **LLM-logs viewer** — configurable provider/model, full audit trail of every LLM call (step, provider, model, input messages, output, duration, status).
- The **deterministic-build principle** — in Vibe Refactor this was prompts-as-data; in Vibe Now it extends to `Now.ID['alias']` for deterministic sys_ids on every Fluent record.

**We are explicitly dropping:**
- **The wizard.** No numbered top progress bar. No "Step 1 of 5." No forced ordering.
- **Voice-first capture as the primary input.** Voice can remain *available*, but typed conversation is the default for this audience (ServiceNow developers, solution consultants, platform admins).
- **The Replit-centric build-pack assumption.** The output target is the Now SDK, not Replit Agent.
- **Statement of Work / pricing tiers / MSA / legal terms** — out of scope for v1; Vibe Now is a builder, not a billing tool.

**The replacement shape — consultative canvas**

Instead of a wizard, the primary surface is a **three-zone consultative canvas**:

```
┌────────────┬───────────────────────────────┬──────────────┐
│ Project    │  Conversation + Living Spec   │  SDK Preview │
│ sidebar    │  (agent chat, inline edits)   │  (tables,    │
│            │                               │   roles,     │
│            │                               │   catalog,   │
│            │                               │   portal,    │
│            │                               │   deploy)    │
└────────────┴───────────────────────────────┴──────────────┘
```

The user never leaves this canvas. The agent converses in the middle zone. The spec materializes on the right as the conversation progresses. Deploy is a button on the right panel, not a final wizard step.

---

## 3. The Consulting Agent — behavior spec

This is the most important section. GPT: when you brief Figma, the UI must *feel* like this behavior. Every visual choice should reinforce "I am talking to a senior consultant who is co-designing this with me."

### 3.1 Agent persona
- **Role:** A senior ServiceNow solution architect who has shipped 50+ scoped apps. Pragmatic. Opinionated. Never condescending.
- **Tone:** Direct, curious, slightly dry. Uses plain English even for technical concepts. Resists jargon unless the user introduces it first.
- **Default stance:** The user's first idea is never the final idea. The agent's job is to **expand, challenge, and refine** — in that order.

### 3.2 The four-beat consulting loop

Every user turn cycles through up to four beats. The agent picks the beats that fit; it does not force all four.

1. **Reflect** — restate the user's idea in one crisp sentence, so the user can see and correct the agent's interpretation. ("So you want an internal tool where farmers log eggs daily and customers can sponsor individual hens — is that the core?")
2. **Expand** — surface the 2–3 adjacent ideas the user probably implied but didn't say. Presented as *questions*, not assertions. ("Two things you didn't say but I'd ask: do sponsored hens have a time limit, and can the same hen have multiple sponsors?")
3. **Challenge** — flag one risk, ambiguity, or scope concern. This is the most valuable beat. A consultant earns their fee here. ("You said 'customers get updates' — email, portal, both? If email, who owns the send domain and deliverability?")
4. **Propose** — offer a concrete next move: a table to add, a role to split, a catalog item to define, or a question to answer next. Always give the user a clear path forward.

The agent **never** asks more than 2 questions per turn. Consulting is not interrogation.

### 3.3 Three assist buttons, always available on every agent turn

Borrowed directly from Vibe Refactor, rebranded:

| Button | What it does | Underlying endpoint |
|---|---|---|
| **Sharpen** | Evaluates the user's latest message against accumulated project context and returns `{ isSpecificEnough: boolean, suggestions: string[] }`. Short, 10–15 word suggestions, max 3. | `/api/agentAssist` equivalent |
| **Research** | Returns real-world examples from similar ServiceNow implementations, industry practices, and 2–3 insights specific to the user's domain. Each example: `{ title, description, relevance }`. | `/api/researchExamples` equivalent |
| **Clean** | Takes the user's rough/dictated text and produces a cleaned, grammatical version without changing meaning. | `/api/cleanText` equivalent |

### 3.4 Explicit non-behaviors
- The agent does **not** pre-fill the spec with assumptions the user didn't confirm.
- The agent does **not** push the user forward. Forward motion is a user action (user clicks "Add to Spec" or "Generate Tables").
- The agent does **not** hide its work. Every agent turn has a visible "Why I asked this" chip that expands to show the reasoning.

---

## 4. The Living Spec — right panel, domain model

The right-side preview is a **living spec** that updates as the conversation progresses. It is the bridge between conversation and generated SDK code. It mirrors Vibe Refactor's `DetailedSummary` but is re-shaped for ServiceNow.

### 4.1 Sections (all collapsible, all editable inline)

1. **One-line definition** — single sentence. Editable. This is the anchor.
2. **Scope — in / out** — two lists. Explicit out-of-scope items are as important as in-scope; they prevent scope creep during generation.
3. **Scope name + sys_app id** — the ServiceNow scope (e.g., `x_1939459_cluck`). **Critical UX detail:** when the user is on a PDI, the scope is auto-prefixed (`x_<companycode>_`) — the UI must show this clearly, explain why, and let the user pick only the suffix. (This burned us on both shoreline and cluckworks; the spec panel should prevent it entirely.)
4. **Data model (tables)** — list of tables with: name, label, extends (e.g., `task`, `sys_user`, or new), columns (name / type / reference / mandatory / default). Derived from the conversation; editable as a grid.
5. **Roles & ACLs** — role hierarchy tree (e.g., `customer ⊂ staff ⊂ admin` via `containsRoles`). ACLs grouped per table.
6. **Business logic** — business rules, script includes (plain `Class.create()` pattern, never `global.AbstractAjaxProcessor` — the SDK linter rejects it), and scheduled jobs. Each entry has a one-line intent + generated code.
7. **Service Catalog** — catalog items, record producers, variable sets, Catalog UI Policies. Flag: catalog items do NOT accept a `category` prop — must link via `sc_cat_item_category`.
8. **Service Portal** — portal definition (`sp_portal`), pages, widgets. URL suffix.
9. **REST APIs** — scripted REST resources (path, method, auth, query params).
10. **Flows** — **show a warning banner**: SDK v4.4 flow type system cannot resolve fields on brand-new scoped tables. Default to business rules + notifications. Only allow flows when they target OOB tables (incident, sc_req_item, change_request).
11. **Build prompt (compiled)** — the final, comprehensive prompt that an SDK generator would receive. Read-only surface of everything above.

Every section has an **"Ask the agent about this"** action that pipes the section context into the chat.

### 4.2 Status indicators
Each section has one of: `empty`, `drafted`, `confirmed`, `generated`. Visual: empty = dashed outline; drafted = solid outline, grey; confirmed = solid outline, accent colour; generated = filled with checkmark. Users move sections to `confirmed` explicitly, which is when SDK generation becomes available for that section.

---

## 5. SDK generation & deploy — right panel bottom

Below the living spec sits the **Build & Deploy** strip. Three buttons, top-to-bottom:

1. **Preview Fluent** — opens a drawer showing the generated `.fluent.ts` files per section. Read-only. Syntax-highlighted. Users can't hand-edit here; they edit the spec and regenerate.
2. **Build** — runs the equivalent of `pnpm exec now-sdk build`. Shows log stream in a drawer. Produces the ZIP in `target/`.
3. **Deploy** — runs `now-sdk install`. Requires an auth alias (we surface a dropdown of known aliases; "Add new" opens a small credentials dialog that writes via `now-sdk auth --add`). On success, shows: scope, sys_app sys_id, rollback URL, link to the app in the instance. On "application was null" failure, offers a **one-click "Retry with --reinstall"** remediation.

### 5.1 Gotcha prevention (UI-level guards)
The deploy panel surfaces these **before** the user hits deploy:
- **PDI scope-prefix check** — if the scope in `now.config.json` doesn't start with `x_<companycode>_` and the target instance is a PDI, block deploy with an inline fix-it button.
- **Scope length** — warn at 18 characters (the PDI limit).
- **TypeScript lint gotchas** — `GlideDate.getValue()` does not exist (use `String(new GlideDateTime().getDate())`), `EmailNotification.recipientRoles` does not exist (use `recipientFields + sendToCreator`), `CatalogUiPolicy` props are camelCase (`mandatory`, `visible`, `appliesTo`, `catalogItem`). These are pre-flight checks run against the generated Fluent files and shown as pre-deploy warnings with one-click fixes.
- **`Now.ID['alias']`** — enforce that every Fluent record uses it, so rebuilds are deterministic and sys_ids don't churn between runs.

---

## 6. Information architecture — full surface

These are the only pages/modals in v1. Everything is minimal. No kitchen-sink.

### 6.1 Primary canvas (single route: `/app`)
Three zones as described in §2. No page-level nav.

### 6.2 Sidebar (left, 280px fixed)
- Logo + product name
- "New idea" button (prominent, top)
- Project list (recent, starred, archived)
- Bottom: Settings button, Theme toggle, Logs button

### 6.3 Settings dialog (modal)
Tabs:
- **LLM Provider** — dropdown (OpenAI, Anthropic, Gemini, Groq, Custom). Model field adapts to provider. Optional custom API key + base URL. Default: OpenAI GPT-5.
- **ServiceNow** — list of auth aliases with add / delete / set-default actions. Backed by `now-sdk auth --list`.
- **Developer** — default scope prefix (read from detected PDI company code), default Fluent style preferences, feature flags.

### 6.4 Logs dialog (modal)
Table of every LLM call with filters (step name, provider, model, status, date range). Row click expands to full input messages and output. Matches Vibe Refactor's `llmLogs` schema exactly.

### 6.5 Project list view (sidebar expansion or quick-switcher via `⌘K`)
No dedicated page. A command palette with fuzzy search: switch project, open settings, deploy, preview Fluent, add role, add table, etc.

---

## 7. Visual system

Adapt Vibe Refactor's Linear/Notion-inspired restraint, modernize for 2026.

### 7.1 Typography
- **Primary:** Inter (Google Fonts)
- **Mono:** JetBrains Mono
- **Display (page titles):** 32px / 600
- **Section titles:** 18px / 600
- **Body:** 14.5px / 400, line-height 1.55
- **Small / meta:** 12.5px / 500
- **Code:** 13.5px mono

### 7.2 Palette
- **Primary:** Electric indigo `#4F46E5` (slightly more saturated than Vibe Refactor's purple — this is a developer tool).
- **Accent (agent turns):** Cyan `#06B6D4`.
- **Accent (user turns):** Neutral grey.
- **Success / generated:** Emerald `#10B981`.
- **Warning / gotcha:** Amber `#F59E0B`.
- **Destructive:** Red `#EF4444`.
- Dark mode is first-class, not an afterthought. Both modes must be designed in Figma; do not just rely on inversion.

### 7.3 Spacing / layout
- Tailwind scale: 2, 3, 4, 6, 8, 12, 16, 24 only.
- Canvas zones: sidebar 280px, right panel 420px, conversation takes the rest with `max-w-3xl` content column.
- Card padding: `p-5` default, `p-6` for emphasis.
- Rounded-xl everywhere except small chips (rounded-md) and record-style buttons (rounded-full).

### 7.4 Motion
- 180ms ease for all transitions.
- Agent-turn entrance: fade-up 8px.
- Spec panel updates: outline briefly flashes accent colour when a section changes.
- No parallax, no decorative motion, no confetti.

---

## 8. API surface (for the GPT producing Figma + the GPT producing the backend)

Reuse Vibe Refactor's shape where possible; rename for clarity in the Vibe Now domain.

| Endpoint | Purpose |
|---|---|
| `POST /api/conversation/turn` | User sends a message; returns agent's reflect/expand/challenge/propose response + any spec mutations. Replaces Vibe Refactor's stepwise endpoints with a single conversational one. |
| `POST /api/sharpen` | Eval current user text for specificity. Mirrors `/api/agentAssist`. |
| `POST /api/research` | Examples + industry practices + insights. Mirrors `/api/researchExamples`. |
| `POST /api/clean` | Text cleanup. Mirrors `/api/cleanText`. |
| `POST /api/spec/generate` | Given the current spec JSON, produce a complete `DetailedSpec` (Vibe-Now-shaped). |
| `POST /api/fluent/generate` | Given a spec section, produce the Fluent TypeScript files for that section. |
| `POST /api/sdk/build` | Server shells out to `pnpm exec now-sdk build`. Streams log lines via SSE. |
| `POST /api/sdk/deploy` | Server shells out to `now-sdk install`, optionally `--reinstall`. Streams logs. Returns `{ scope, sysAppSysId, rollbackUrl, instanceUrl }`. |
| `GET /api/auth/aliases` | Returns the `now-sdk auth --list` output. |
| `POST /api/auth/aliases` | Adds a new auth alias. |
| `GET/DELETE /api/logs` | LLM call audit log. Identical to Vibe Refactor. |

All LLM endpoints accept optional `llmSettings: { provider, model, apiKey?, baseUrl? }` — default is OpenAI GPT-5.

---

## 9. The spec shape (what the living panel binds to)

```typescript
interface NowSpec {
  oneLineDefinition: string;
  scope: {
    suffix: string;            // user-typed, e.g. "cluck"
    companyPrefix: string;     // auto, e.g. "x_1939459"
    fullScope: string;         // derived, e.g. "x_1939459_cluck"
    sysAppId?: string;         // populated after first build
    name: string;
  };
  mvpScope: { includes: string[]; excludes: string[] };
  tables: TableDef[];
  roles: RoleDef[];            // tree via containsRoles
  acls: AclDef[];
  businessLogic: {
    businessRules: BusinessRuleDef[];
    scriptIncludes: ScriptIncludeDef[];
    scheduledJobs: ScheduledJobDef[];
  };
  serviceCatalog: {
    items: CatalogItemDef[];
    recordProducers: RecordProducerDef[];
    variableSets: VariableSetDef[];
    uiPolicies: CatalogUiPolicyDef[];
  };
  servicePortal?: {
    portal: { name: string; urlSuffix: string };
    pages: PageDef[];
    widgets: WidgetDef[];
  };
  restApis: ScriptedRestDef[];
  flows: FlowDef[];            // restricted to OOB-table triggers in v1
  notifications: EmailNotificationDef[];
  legalGuardrails: string[];
  buildPrompt: string;         // compiled, read-only
  sectionStatus: Record<keyof NowSpec, 'empty' | 'drafted' | 'confirmed' | 'generated'>;
  lastGeneratedAt?: string;
}
```

Every `*Def` type mirrors the Now SDK's Fluent API so the generator can map 1:1.

---

## 10. Figma Make prompt pack — what GPT should produce next

When the user runs this document through GPT to build the Figma prompt, GPT should emit **one Figma Make prompt per screen**, in this order, each self-contained enough that Figma Make can render it without seeing the others. Each prompt must include:

1. **Layout breakdown** — zones, widths, fixed vs. fluid.
2. **Components referenced** — reuse Shadcn/ui names (Button, Card, Dialog, Input, Textarea, Tabs, Collapsible, Command, Toast) so the eventual React handoff is drop-in.
3. **Typography & colour tokens** — explicit hex values from §7.
4. **States** — loading, empty, error, success. Don't design only the happy path.
5. **Microcopy** — exact text for labels, buttons, and empty states. The agent's tone (§3.1) must come through even in button labels.
6. **Dark mode variant** — every screen has both.

The screen list:
1. **Primary canvas** — sidebar + conversation + living spec + build/deploy.
2. **Settings dialog** — all three tabs.
3. **Logs dialog** — table + expanded row.
4. **Preview Fluent drawer** — syntax-highlighted read-only TypeScript.
5. **Build log drawer** — streaming log output with status chip.
6. **Deploy result** — success card (scope, sys_app id, rollback URL, instance link) and failure card (with "Retry with --reinstall" button).
7. **Command palette (`⌘K`)** — fuzzy search, project/action switching.
8. **Empty state** — first-run, "Describe the app you want to build" text area with 3–5 example prompts.

---

## 11. Authoring rules for GPT producing Figma prompts

- **No invented features.** If it is not in this document, do not add it to the Figma prompt.
- **No wizard.** Any language like "Next", "Back", "Step 3 of 5" is a failure mode. Forward motion in Vibe Now is always a user click on a specific, domain action ("Add role", "Generate tables", "Deploy").
- **Conversation is always visible.** The chat does not get replaced by a different view; other views appear as drawers *over* the canvas.
- **Every gotcha from §5.1 must have a visible UI slot**, not buried in a log.
- **The agent's voice matters.** Every agent-authored string in the UI (empty states, loading copy, error messages) should read as if the consultant wrote it — pragmatic, slightly dry, never robotic.

---

## 12. Success criteria

Vibe Now v1 ships when a user can, in under 20 minutes, go from "I want a chicken farm app" to a deployed scoped app on their PDI that includes at least: 5 tables, 3 roles with hierarchy, 2 business rules, 1 script include, 2 catalog items, 1 portal page, 1 scripted REST endpoint — all produced by the consulting agent, all deployed in one click, with rollback available.

That is the demo. Build the UI that makes that demo feel inevitable.

---

## Appendix A — Source-of-truth references

- **Vibe Refactor (seed idea):** `/Users/groovingtothemusic/OverYonder_Vibe_Refector.zip` — mine the Agent Assist, Research & Examples, Clean Text, LLM Settings, and LLM Logs patterns. Discard the wizard shell, the SOW module, the voice-first capture.
- **Reference SDK apps in this workspace:**
  - `sdk-examples/cluck-sample/` — scope `x_1939459_cluck`, deployed.
  - `sdk-examples/shoreline-rentals-sample/` — scope `x_1939459_shorelin`, deployed.
  - Both deployed to PDI `https://dev378814.service-now.com`.
- **SDK version:** Now SDK v4.4.0.
- **SDK gotchas to bake into the product:** see `feedback_snow_sdk_deploy.md` in the user's Claude memory — PDI scope-prefix auto-enforcement, `--reinstall` as first-line remediation for null-application errors, `now-sdk` binary must run from inside the package folder, `pnpm run deploy` not `pnpm deploy`.
- **Sibling project in this workspace:** `snow-converter/` — the GitHub-to-ServiceNow converter. Vibe Now is its greenfield counterpart; keep APIs and visual language compatible so the two could merge later.

---

*End of specification. GPT: produce the Figma Make prompt pack next, following §10 and §11.*
