# Vibe Consultant — Design Brief for Figma (hand this to GPT)

> **Purpose of this doc.** You (GPT) will use this brief to produce a complete Figma design for a new product called **Vibe Consultant**. This product is a conversational, consultant-style UI on top of an existing FastAPI backend (the OverYonder API) whose job is to help a user **vibe-code a real ServiceNow application** — scoped apps, Flow Designer flows, tables, UI Builder screens, catalog items, business rules — by having a focused dialogue, then producing commit-ready code against the user's GitHub repo.
>
> The product borrows the **consultant voice, MVP-definition discipline, and SOW/pricing artifacts** from an existing app called **Vibe Refactor**. It **explicitly rejects** Vibe Refactor's linear multi-step wizard. One surface, one conversation, living artifacts on the side.
>
> Output expected from you: a Figma file containing a full design system, component library, and all screens/states described in §10–§13 of this doc.

---

## 1. TL;DR

**What it is.** A single-surface, dark/light, Linear-Notion-grade desktop web app that pairs a **senior enterprise consultant** (LLM) with a ServiceNow architect to turn "I want an app that does X in SN" into a committed GitHub branch with a real ServiceNow SDK package and a portable genome.

**Why it's different from Vibe Refactor.** Vibe Refactor is a 5–6 step wizard. Vibe Consultant is **one room with a conversation partner** and a **live artifact canvas** that updates as you talk. You can jump to any artifact at any time. The consultant drives, but you can redirect. No "Step 2 of 6," no "Next →" button.

**Why it's different from ChatGPT.** The conversation produces **structured, inspectable, editable artifacts** (MVP spec, ServiceNow target plan, SOW, build prompt, genome preview, GitHub diff). Every consultant claim has an artifact you can click, edit, and re-anchor the conversation to.

**Core loop.**
1. User describes the app in their own words (text or voice).
2. Consultant asks *precise, Deloitte-grade discovery questions* — not a form, a conversation.
3. Artifacts on the right populate/update in real time: MVP Spec → ServiceNow Target Plan → Build Prompt → SOW.
4. When user says "ship it" (or clicks **Commit**), the UI hits OverYonder's `/agent/commit-github` / `/create-github-repo` / `sn-sdk-genome/commit` endpoints and streams progress.
5. User lands on a **Handoff card** showing the PR/branch URL, the files committed, and what to do next in the ServiceNow studio.

---

## 2. What we are NOT building

Kill these reflexes when you design:

- ❌ **No step bar across the top.** No "1 → 2 → 3 → 4 → 5."
- ❌ **No "Next / Back" buttons.** No modal hops. No form-per-step layout.
- ❌ **No empty state that forces script upload.** Vibe Refactor's "Load Script" is gone — the consultant generates its own questions.
- ❌ **No voice-only input requirement.** Voice is a first-class *option*, not a gate.
- ❌ **No full-screen takeover for "Create App."** Commit happens inline, in the artifact panel.
- ❌ **No separate SOW screen.** SOW is one of the living artifacts, not a destination.

**The wizard is dead.** The consultant is alive.

---

## 3. Product concept — "Vibe Consultant"

### 3.1 The metaphor

Think: **a Zoom call with a senior ServiceNow architect from a top-tier firm (Deloitte, Accenture, Distyl)**, except the architect has your GitHub, your ServiceNow instance, and a whiteboard that auto-updates. The consultant asks sharp questions, pushes back on vague scope, and visibly builds the plan in front of you.

### 3.2 Persona of the AI consultant

Tone directly inherited from Vibe Refactor's system prompt (verbatim guidance — preserve this voice in the UI copy, empty states, and canned prompts):

> *"You are an elite enterprise software consultant, operating at the level of firms like Deloitte, Accenture, and Distyl.ai. Your role is to guide a client through discovery for building or replacing an application. Be precise, intentional, and structured. Avoid generic or obvious questions. Focus on uncovering real workflows, constraints, and edge cases. Assume the client may not fully understand their own system. Optimize for MVP definition, not full system design."*

But with a ServiceNow-specific overlay:

- Knows the ServiceNow platform cold: scoped apps, Now Experience / UI Builder, Flow Designer, GlideRecord, ACLs, Update Sets vs. app repos, Fluent SDK, Service Portal vs. Next Experience.
- Asks questions that *only a ServiceNow consultant* would ask: "Is this a scoped app or global? What's your update set strategy? Do you need to run under a specific role or Elevate? Will this be published to the store?"
- Pushes back on anti-patterns: building Service Portal when Next Experience is appropriate, using business rules where Flow Designer is cleaner, writing client scripts where UI actions suffice.

### 3.3 What the consultant *does* (the AI actions)

Every consultant turn is one of these action types — design them as visually distinct message bubbles:

| Action type | Visual cue | Example |
|---|---|---|
| **Ask** | Standard bubble, subtle left-border in accent color | "Who currently owns the request queue, and what's their pain point today?" |
| **Propose** | Bubble with a small "Proposal" chip; attached artifact preview card | "I'll scope this as a custom app `x_acme_req`, with one primary table and a Flow Designer approval flow. Here's the draft spec →" |
| **Challenge** | Bubble with a ⚠️ amber chip | "You said 'real-time,' but your SLA is 4 hours. Real-time is expensive in SN. Can we use scheduled Flow runs?" |
| **Confirm** | Bubble with a ✓ green chip | "Locking in: scoped app, 1 table, 3 UI Builder pages, 1 Flow. Artifact updated." |
| **Execute** | Bubble with a ⚡ blue chip + inline streaming log | "Committing to `Schredly/oy_genome` on branch `sn-sdk/req-approval-20260422…`" |
| **Handoff** | Full-width handoff card | "Done. [PR #142](…) — 14 files, Flow validated. Next: run `now-sdk transform` in your local SDK." |

Design all six states.

### 3.4 What the user *does*

Four input modes, none of them a wizard:

1. **Type** in the composer (default).
2. **Speak** — push-to-talk mic, streaming transcript (Web Speech API, same as Vibe Refactor).
3. **Attach** — drop a file (a ServiceNow SDK `.zip`, an update set XML, a screenshot of an existing app, a PDF requirements doc). Attachments route to `/api/sn-sdk-genome/upload`, `/api/doc-genome/...`, etc.
4. **Edit an artifact** — click into the artifact panel and change a field; the consultant re-grounds from the edit.

---

## 4. Design references & inspiration

### 4.1 Lift from Vibe Refactor

| Concept | Keep | Drop |
|---|---|---|
| Typography: Inter (UI), JetBrains Mono (code) | ✅ Keep | |
| Color: dark/light with a single purple accent (`#7C3AED` family) | ✅ Keep, but **shift accent to a "ServiceNow-credible" hue** (see §11) | |
| "Linear + Notion" productivity-tool aesthetic | ✅ Keep | |
| Detailed MVP Spec (one-sentence def, includes/excludes, screens, user flow, AI arch, data sources, guardrails, build prompt) | ✅ Keep as an artifact panel | ❌ Drop the "agree / draft" status banner-as-blocker |
| SOW w/ complexity tiers, deliverables, line items, MSA/legal | ✅ Keep as an artifact panel, **opt-in** | ❌ Drop the standalone SOW step |
| Voice capture w/ R/P/N keyboard shortcuts, waveform | ✅ Keep, but inline in composer | ❌ Drop the per-question card UI |
| Build Pack (categorized master prompt) | ✅ Keep as an artifact | ❌ Drop the accordion-as-a-step |
| Consultant system prompt | ✅ Keep verbatim, extend for ServiceNow | |
| Left sidebar w/ projects, settings | ✅ Keep | |
| `SettingsDialog` (LLM provider, feature flags) | ✅ Keep | |
| `LogsDialog` (LLM call audit log) | ✅ Keep — rename **"Consultant Trace"** | |

### 4.2 Visual references (peer products to study before designing)

- **Linear** — density, keyboard-first feel, sidebar, inline edit.
- **Notion AI** — inline AI that produces inspectable blocks.
- **Raycast** — command palette aesthetic; we want one (`⌘K`).
- **Vercel v0** — chat + artifact split; our layout is a cousin.
- **Anthropic Claude artifacts** — side panel that updates live as the model writes.
- **ServiceNow Next Experience (workspace shell)** — if there's an "echo of SN" in the nav chrome, ServiceNow architects feel at home. Do NOT clone SN. A subtle cue (e.g., a workspace-style left rail) is enough.

### 4.3 Aesthetic one-liner

> *A quiet, high-trust consulting studio — the sort of room where a senior architect sketches on a tablet while talking you through trade-offs. No glitter. No gradients on buttons. One accent color used sparingly. Type does most of the work.*

---

## 5. Primary layout — the "Consultant Room"

Three-pane desktop layout, 1440×900 baseline (design for 1280, 1440, 1920):

```
┌──────────────┬────────────────────────────┬──────────────────────────────┐
│              │                            │                              │
│   SIDEBAR    │     CONVERSATION PANE      │      ARTIFACT CANVAS         │
│   (280 px)   │     (flexible, min 520)    │      (480 px, resizable)     │
│              │                            │                              │
│  ·Projects   │   ·Message stream          │  ·Tabs: MVP · SN Target ·    │
│  ·New        │   ·Inline artifact peeks   │   Build Prompt · SOW ·       │
│  ·Settings   │   ·Composer (bottom)       │   Genome · Commit            │
│  ·Trace      │                            │  ·Inspectable, editable     │
│              │                            │                              │
└──────────────┴────────────────────────────┴──────────────────────────────┘
       └────────────── Command palette (⌘K) overlays anything ──────────────┘
```

### 5.1 Sidebar (left, fixed 280 px)

- App logo + wordmark (top, py-6).
- **"New consultation"** button (primary, full-width) — creates a new project.
- Project list:
  - Project name (truncates).
  - Status dot: *Discovery / Specifying / Ready to build / Shipped*.
  - Hover reveals rename/delete.
  - Active project has accent-tinted bg.
- Footer: Settings icon, Consultant Trace icon, Theme toggle.
- Collapsible to icon-rail (`--sidebar-width-icon: 4rem`), same pattern as Vibe Refactor's `SidebarProvider`.

### 5.2 Conversation pane (center)

**Top bar** (48 px):
- Current project name (editable inline on click).
- Right-side chips: current *mode* (Discovery / Specifying / Building / Shipped), tenant selector (`acme` default, dropdown), LLM model chip, **[Share]** (copy link).

**Message stream** (scrollable):
- User messages: right-aligned, plain card, no avatar.
- Consultant messages: left-aligned, subtle avatar disc w/ initial "C", action chips per §3.3.
- Inline **artifact peeks**: a 2-line summary + "Open in canvas →" link (clicking focuses the right pane and highlights the changed field).
- Streamed messages: typewriter animation **only on first paint**; after that, static.
- Message metadata on hover: timestamp, duration, model, token cost (wire to `/api/admin/{tenant_id}/llm-usage`).
- Empty state (first visit to a project): a single consultant card with:
  > "Let's start. Describe the ServiceNow app or pain point you want to work on — one paragraph is enough. Or upload an existing SDK package if we're modernizing."
  — plus suggestion chips: "Approval workflow", "Custom request catalog", "Migrate a Service Portal app", "Replace a legacy Update Set".

**Composer** (docked bottom, 88 px tall, up to 240 px on expand):
- Textarea with placeholder `Reply to the consultant, or redirect the conversation…`.
- Left: attach button (📎 — file/image/zip).
- Right: mic (push-to-talk), send (⏎).
- Below textarea when active: small row of **context chips** showing what the consultant is currently grounded on ("MVP Spec v3", "SDK package: req-approval-v1.2.zip", "GitHub: Schredly/oy_genome").
- Keyboard shortcuts: `⏎` send, `⇧⏎` newline, `R` toggle mic, `⌘K` command palette.

### 5.3 Artifact canvas (right, 480 px default, resizable 380–720)

**Tab strip** across top — only tabs with content are shown, ordered by maturity:

1. **MVP** — the Vibe Refactor detailed summary schema (see §8.1).
2. **SN Target** — ServiceNow-specific target plan (§8.2).
3. **Build Prompt** — the master prompt the consultant will send to the code generator.
4. **SOW** — optional; only appears if enabled in Settings → Features.
5. **Genome** — an interactive tree of the extracted/target application genome (§8.3).
6. **Commit** — the GitHub commit status & diff preview; becomes active when user triggers commit.

Each tab contents: scrollable, inline-editable blocks. Every block has:
- A "last updated by" chip (`you`, `consultant`, `system`).
- An "undo" pop-up toast on any AI-authored change (5s timeout).
- A **"Ground the conversation here"** icon that pins the block into the composer context chips.

**Empty-tab state**: a muted placeholder with a one-line coaching hint, e.g. *"SN Target populates once we've agreed on a scoped-app name and primary table."*

### 5.4 Command palette (`⌘K`)

Overlay, 640 px wide. Actions to surface:
- Jump to artifact tab.
- Ask the consultant to regenerate an artifact ("Redraft MVP spec with X excluded").
- Switch tenant.
- Change LLM model.
- Open Consultant Trace.
- Toggle theme.
- Commit to GitHub.
- Upload SDK package / doc / video.

---

## 6. User journey (non-wizard, but still a shape)

Design the **three natural plateaus** below as *ambient states* — not gated screens. The consultant and artifact canvas signal the current plateau via the header chip and which tabs are "lit."

### 6.1 Plateau A: **Discovery** (chip: "Discovery")
- Only conversation pane is rich; artifact canvas shows "MVP" tab in a skeleton state.
- Consultant asks ~5–8 ServiceNow-flavored discovery questions over multiple turns.
- Design a visible **"discovery depth"** indicator (small dots, 0 of ~8) — subtle, not gamified.

### 6.2 Plateau B: **Specifying** (chip: "Specifying")
- MVP tab is populated, SN Target tab starts filling in.
- Consultant transitions from asking → proposing. Proposal bubbles appear.
- User can edit artifacts; edits trigger consultant to reflect ("Noted — I've removed the approval step; let me re-evaluate the flow.")
- SOW tab (if enabled) silently appears when complexity score crosses "simple."

### 6.3 Plateau C: **Ready to build → Shipped**
- Consultant asks: "Want me to build this?"
- User confirms → **Commit** tab activates with a three-phase inline progress view:
  1. Refine prompt (calls `/agent/refine-prompt`)
  2. Generate payload (calls `/agent/commit-github` or `/sn-sdk-genome/commit`)
  3. Push to GitHub — streams SSE into Commit tab + inline conversation bubble.
- On success: **Handoff card** pinned to top of conversation with PR link, branch name, file count, and a 3-line "what next" checklist (pull branch, run `now-sdk transform`, push to SN instance).
- Chip flips to "Shipped." Project status dot turns green in sidebar.

---

## 7. Key interaction patterns to design

Design every one of these as a Figma component with all states (default / hover / focus / active / disabled / loading / error):

1. **Consultant message bubble** (6 action variants — §3.3).
2. **User message bubble.**
3. **Inline artifact peek card** (fits inside conversation; clicking animates the right pane to that tab).
4. **Artifact block** (editable, with "last updated by" chip, undo toast).
5. **Streaming log** (monospace, scrollable, used for commit progress and SSE events — model the UX on Vercel deploy logs).
6. **Upload dropzone** (invoked from composer attach or empty state; supports `.zip` up to 200 MB per `/sn-sdk-genome/upload`).
7. **Commit confirmation dialog** (shows branch name, repo target, file tree diff preview — user can edit branch name before confirming).
8. **Integration health chip** (GitHub ✅ / ❌ / ⚠️, ServiceNow ✅ / ❌, LLM ✅ / ❌) — lives in the top bar; clicking opens Settings → Integrations (reuse the error copy from `sn_sdk_genome.py:386-388`).
9. **Consultant Trace drawer** (right side, full height when open) — time-ordered list of LLM calls: step name, model, duration, tokens, pass/fail. Reuse Vibe Refactor's logs schema.
10. **Settings modal** (Integrations / LLM / Features / Appearance tabs).
11. **Tenant switcher** (dropdown in top bar).
12. **Project status dot** with tooltip states.
13. **Error state** for a rejected GitHub PAT (HTTP 401) — use the *exact* error text from the API so engineering can wire this with one string:
    > *"GitHub rejected the token on integration 'Genome' (HTTP 401 — Bad credentials). Open Settings → Integrations, re-paste a valid PAT with 'repo' scope (or fine-grained 'Contents: write' + 'Metadata: read' on Schredly/oy_genome), and retry."*
    Design a dismissible banner at the top of the artifact canvas + a CTA button that opens Settings → Integrations focused on the offending integration.

---

## 8. Artifact schemas (design the inspectors to match these)

These are the exact shapes the backend returns — design a Figma layout for each that respects the fields and ordering.

### 8.1 MVP Spec (Vibe Refactor's `DetailedSummary` — keep)

- **One-sentence definition** (short paragraph, click-to-edit)
- **MVP scope**: Includes list, Excludes list (two columns, add/remove rows)
- **Screens**: array of `{ name, purpose, uiElements[], whyItWorks? }` — design as stacked cards; each card has a Figma-icon for the screen type (table, form, dashboard).
- **User flow**: ordered list of steps (numbered, drag to reorder).
- **AI architecture** (optional): `roles[]` with `name` + `responsibilities[]`.
- **Data sources**: `mvpSources[]`, `futureSources[]`.
- **Legal guardrails**: bullet list.
- **Build prompt**: large monospace textarea (JetBrains Mono, 14 px).

### 8.2 SN Target Plan (NEW — this is the ServiceNow layer Vibe Refactor doesn't have)

Design this carefully; it's the distinguishing artifact.

Fields (all editable):
- **App shape**: `scoped | global` (radio); if scoped → **Scope ID** (text, auto-suggested like `x_acme_req`).
- **App name** (e.g., `Approval Request Manager`).
- **Target platform**: `Next Experience (UI Builder) | Service Portal | Classic UI` (radio with rationale tooltip — the consultant picks one and explains).
- **Tables**: array of `{ name, label, extends (e.g. task), columns[{name,type,ref?}] }` — visual as a little ERD-style card stack with columns.
- **Flows (Flow Designer)**: array of `{ name, trigger, steps[] }`.
- **UI Builder pages / Workspaces**: array of `{ name, route, components[] }`.
- **Catalog items / Record Producers** (if any): array of `{ name, fields[] }`.
- **Business rules / Client scripts / Script includes**: array of `{ type, table, when, purpose }`.
- **Roles & ACLs**: `{ role, table, operation, condition }`.
- **Integrations**: `{ system, direction, mechanism (REST/MID/IH) }`.
- **Update-set strategy** vs. **SDK/source-control strategy** (radio + note).
- **Risk register**: bullets of SN-specific risks (e.g. "Elevate required for X", "store-published means no script includes in global").

Layout: left column = structural (app shape, scope, tables, flows); right column = behavioral (rules, ACLs, integrations, risks). Scrollable vertically.

### 8.3 Genome Preview (SN SDK — maps to `/sn-sdk-genome/extract` output)

When the user uploads an existing SDK package, the extraction pipeline streams SSE events (`data: {agent, status, …}`) and the final payload contains:
- `application` (name, scope, version)
- `genome` (entities, catalog, workflows, business_logic, data_model, ui, navigation, integrations, logic_patterns, processes, events)
- `inventory` (file counts)
- `genome_yaml` (full YAML dump)

Design a **tree viewer** (like VS Code's file tree) on the left with the genome keys, and a **detail panel** on the right showing the selected node as JSON or a rendered table. Streaming state: during extraction, show agent-by-agent progress (`agent_progress` map: agent name + status bar). Reference Vibe Refactor's logs-dialog density for the right aesthetic.

### 8.4 Build Prompt

Monospace editor, JetBrains Mono 14 px. Header chips: **Copy master prompt**, **Regenerate**, **Token count**. Bottom: "Send to Replit" button (calls `/agent/approve-replit`) and "Commit to GitHub" button (calls `/agent/commit-github` or `/sn-sdk-genome/commit`).

### 8.5 SOW (optional)

Keep Vibe Refactor's SOW schema exactly (`MVPSOW` → complexity tier, scope summary, deliverables, line items, totals, assumptions, exclusions, status). Add **Extensions** (environment setup, DNS, integration, etc. — see `extensionTemplates`) as stacked collapsible cards. Add **MSA Terms** and **Legal Terms** as expandable sections at the bottom. Status pill: `draft / sent / accepted / declined`.

### 8.6 Commit

Three-section view:
1. **Target**: repo + branch name (editable) + integration picker (dropdown — only GitHub integrations that are healthy are selectable).
2. **Diff preview**: file tree (expandable) with file counts per folder (`genomes/tenants/acme/vendors/servicenow-sdk/…`). Reuse the layout from `sn_sdk_genome.py:399-459`.
3. **Progress**: SSE log (monospace) — populated when Commit is triggered.

---

## 9. Backend API binding (the OverYonder API)

Backend runs on `http://localhost:8000`. Treat tenant_id as a path parameter; default the UI to `acme`.

| UI surface | Endpoint | Method | Notes |
|---|---|---|---|
| New consultation (empty state) | — | — | Pure client state; no call until first message. |
| User sends first message | `/api/admin/{tenant_id}/agent/stream` | POST (SSE) | Body: `{prompt}`. Stream: reasoning, tool calls, skill events, llm_usage, final result. |
| User sends follow-up | `/api/admin/{tenant_id}/agent/stream` | POST (SSE) | Same; client maintains its own history. |
| One-shot (non-streaming fallback) | `/api/admin/{tenant_id}/agent/ask` | POST | Returns `{reasoning, use_case, skills, tools, result}`. |
| Refine build prompt | `/api/admin/{tenant_id}/agent/refine-prompt` | POST | Body: `{current_prompt, user_feedback, catalog_data}`. |
| Upload existing SDK zip | `/api/sn-sdk-genome/upload` | POST multipart | Returns `package_id`. |
| Extract genome from zip | `/api/sn-sdk-genome/extract` | POST (SSE) | Body: `{package_id, user_notes, product_area, module}`. Stream events per agent. |
| List prior extractions | `/api/sn-sdk-genome/extractions` | GET | Populate Genome tab history. |
| Get one extraction | `/api/sn-sdk-genome/extractions/{id}` | GET | |
| Commit SN SDK genome | `/api/sn-sdk-genome/commit` | POST | Creates a **new branch** off default; returns PR-ready refs. |
| Discover existing SN apps | `/api/admin/{tenant_id}/genomes/discover/applications` | GET | Empty-state helper: "Pull an existing app from your instance?" |
| Scan a target | `/api/admin/{tenant_id}/genomes/capture/scan` | POST | Pass-1 scan. |
| Expand & commit | `/api/admin/{tenant_id}/genomes/capture/expand` | POST | Pass-2 commit. |
| Approve + push to GitHub (generic) | `/api/admin/{tenant_id}/agent/commit-github` | POST | Body: `{prompt, payload, integration_id}`. |
| Create a new repo + commit | `/api/admin/{tenant_id}/agent/create-github-repo` | POST | Body: `{repo_name, org, visibility, integration_id, prompt, payload}`. |
| Approve + create Replit | `/api/admin/{tenant_id}/agent/approve-replit` | POST | Alternative target. |
| Integrations (CRUD + test) | `/api/admin/{tenant_id}/integrations` | GET/POST/PUT/DELETE | Settings → Integrations. |
| Integration catalog | `/api/admin/{tenant_id}/integrations/catalog` | GET | Populate "Add integration" picker. |
| Integration test | `/api/admin/{tenant_id}/integrations/{id}/test` | POST | Drives the health chip color. |
| LLM configs | `/api/llm-configs` | GET/POST | Model picker. |
| LLM usage (for Consultant Trace) | `/api/admin/{tenant_id}/llm-usage` | GET | |
| Agent traces (Consultant Trace full view) | `/api/admin/{tenant_id}/agent/traces` | GET | Flattened trace of AgentUI runs. |
| Tenants | `/api/tenants` | GET | Tenant switcher. |

**SSE handling (design implication):** Many endpoints stream SSE with JSON payloads per line (`data: {...}\n\n`). The UI needs a *streaming log component* (see §7.5) and *incremental artifact updates* (each event may patch one field). Please design the visual language for:
- An SSE event as it arrives (subtle dot animation, monospace text).
- A patched artifact block (brief accent-colored flash for ~400 ms).
- A stream completing (log collapses to a summary row with expand-on-click).

---

## 10. Screens to deliver in Figma

Deliver these as separate Figma frames (desktop 1440×900 unless noted). Each should show default + 1 or 2 key alt states.

1. **Splash / first-run** (single frame, centered consultation card, minimal chrome).
2. **Consultant Room — empty project** (first visit, suggestion chips).
3. **Consultant Room — mid-discovery** (conversation flowing, MVP tab skeleton).
4. **Consultant Room — specifying** (MVP full, SN Target filling, one proposal bubble open).
5. **Consultant Room — SDK upload in progress** (genome tab, extraction SSE streaming, agent_progress bars).
6. **Consultant Room — commit in progress** (Commit tab, SSE log, confirmation modal variant).
7. **Consultant Room — shipped** (Handoff card pinned, chip green, sidebar dot green).
8. **Settings modal** — four tabs: Integrations (list + add/edit form with PAT error state), LLM (provider/model + test), Features (toggle SOW, experimental flags), Appearance.
9. **Consultant Trace drawer** — open state over the Consultant Room.
10. **Command palette** — open state over the Consultant Room.
11. **Artifact canvas (detached)** — full-width variant for when the user drags the splitter all the way right (hides conversation); useful for editing.
12. **Error state: GitHub 401 banner** (in canvas + modal route to Settings).
13. **Mobile: read-only trace** (375×812) — just the conversation + artifact tabs stacked, no composer. This is enough mobile for v1.

### Light & dark modes
Design each frame in both. Use Figma variables for the color tokens in §11.

---

## 11. Design system & tokens

### 11.1 Typography

- **UI**: Inter — 12 / 13 / 14 / 15 / 16 / 20 / 28.
- **Code / prompts / monospace artifacts**: JetBrains Mono 13 / 14.
- **Display (rare, hero only)**: Inter 36 semibold.
- Line-height: 1.5 body, 1.2 display.

### 11.2 Color tokens

Define as Figma variables. Suggested palette (tune; don't obsess):

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FAFAF9` | `#0B0B0C` |
| `--bg-raised` | `#FFFFFF` | `#141416` |
| `--bg-sunken` | `#F2F2F0` | `#08080A` |
| `--border` | `#E7E5E4` | `#26262A` |
| `--text-1` | `#0A0A0A` | `#FAFAFA` |
| `--text-2` | `#57575B` | `#A1A1A6` |
| `--text-3` | `#8A8A8E` | `#6B6B70` |
| `--accent` | `#6D28D9` (purple) *or* `#0EA5A4` (SN-teal) — pick one and lock it | same |
| `--accent-soft` | `#EDE9FE` | `#2B2254` |
| `--success` | `#16A34A` | `#22C55E` |
| `--warning` | `#D97706` | `#F59E0B` |
| `--danger` | `#DC2626` | `#EF4444` |
| `--info` | `#2563EB` | `#3B82F6` |

**Recommendation:** lead with a **teal/SN-credible accent** (`#0EA5A4` family) rather than the purple. ServiceNow customers feel the purple as "another vendor"; a muted teal reads as "infra." Ultimately your call — decide in the first Figma draft and commit.

### 11.3 Spacing & radii

- Tailwind-style scale: 2, 4, 6, 8, 12, 16, 24.
- Radii: `sm` 6, `md` 10, `lg` 14, `xl` 20 (cards). Buttons: 10.
- Elevation: `shadow-sm` for cards on hover; no heavy shadows.

### 11.4 Motion

Inherit Vibe Refactor's rules — quiet motion only:
- 200 ms ease accordion/collapse.
- 120 ms button hover scale 1.02×.
- 400 ms accent flash on artifact field patch.
- Streaming typewriter only on *new* AI messages, capped at 12 ms/char.
- **No parallax, no entrance animations on scroll, no decorative loops.**

### 11.5 Icon set

**Lucide** (same as Vibe Refactor). Preferred icons to have on hand: `Sparkles`, `Workflow`, `Database`, `Code`, `Shield`, `Monitor`, `GitBranch`, `Upload`, `Mic`, `Send`, `Copy`, `Edit3`, `Check`, `X`, `AlertTriangle`, `RefreshCw`, `Terminal`, `ChevronDown`, `ArrowRight`, `Settings`, `MessageSquare`.

---

## 12. Component inventory (build as Figma library)

Group into pages:

- **Primitives**: Button (5 variants × 3 sizes × 5 states), Input, Textarea, Select, Checkbox, Radio, Switch, Chip/Badge (5 semantic colors), Tooltip, Popover, Dialog/Modal, Sheet/Drawer, Tabs, Accordion, Toast.
- **Composer**: Attach menu, Mic button (idle / listening / paused), Send button, Context-chip row, Suggestion chips.
- **Messages**: User bubble, Consultant bubble ×6 action types, Streaming bubble, Handoff card, Inline artifact peek card.
- **Artifacts**: Artifact tab strip, Editable block wrapper (with last-updated-by chip + undo toast), Field inspectors for each MVP/SN Target/SOW field type (paragraph, list, two-column list, table card, ERD card, monospace block, JSON tree node).
- **Status**: Project status dot (4 colors), Integration health chip, Discovery-depth dots, Stream log line, Progress bar.
- **Navigation**: Sidebar (expanded + collapsed), Top bar, Command palette.
- **Dialogs**: Settings modal (4 tabs), Commit confirmation, Consultant Trace drawer, Integration add/edit.

Naming convention: `component/variant` e.g. `Bubble/Consultant-Ask`, `Bubble/Consultant-Challenge`.

---

## 13. Copy & tone guidelines for the consultant

The consultant's words are part of the design. Give us pre-canned copy for:

- **Empty state** (project with no messages):
  - Heading: *"What are we building?"*
  - Subhead: *"Describe the app, the pain point, or drop a ServiceNow SDK package. I'll take it from there."*
- **Chip labels**: `Discovery`, `Specifying`, `Building`, `Shipped`.
- **Consultant action labels**: `Ask`, `Proposal`, `Challenge`, `Confirmed`, `Running`, `Handoff`.
- **Discovery-depth indicator tooltip**: *"I ask ~5–8 focused questions before proposing. You can always skip ahead."*
- **SOW auto-appear tooltip**: *"This project crossed 'simple.' I sketched a scope and price — editable, entirely ignorable."*
- **GitHub 401 banner**: use the verbatim API string from §7.13.
- **Commit success handoff (template)**:
  ```
  Shipped. PR #{n} on {owner}/{repo} · branch {branch}
  {file_count} files · {latency}s
  
  Next:
  1. Pull the branch locally
  2. Run `now-sdk transform` against your dev instance
  3. Smoke-test the primary flow before opening the PR for review
  ```

Do NOT use phrases like "AI assistant," "powered by," "magic." The consultant is a professional, not a chatbot.

---

## 14. States & interaction prototypes to build in Figma

At least model these flows as Figma prototypes so engineering can feel the rhythm:

1. **First message → first consultant reply** (streaming typewriter + MVP skeleton flashing one field in).
2. **User edits an MVP field → consultant reflects** (400 ms accent flash + consultant bubble).
3. **User uploads SDK zip → extraction streams → Genome tab populates** (agent_progress bars advance).
4. **User hits Commit → confirmation modal → SSE log streams → Handoff card appears** (3-step progress).
5. **GitHub 401 error mid-commit → banner appears → CTA opens Settings → Integrations** (error-recovery flow end-to-end).

---

## 15. Out of scope for this design pass

To keep the design crisp, explicitly drop these for v1 (mention them in the Figma file as "Future" frames, don't design them):

- Multi-tenant org switcher w/ SSO.
- Real-time multi-cursor collaboration in artifacts.
- In-app chat history search.
- Mobile composer (read-only mobile is enough).
- Rich-diff GitHub view inside the UI (we link out).

---

## 16. Deliverables I want back from Figma

1. A Figma file named **"Vibe Consultant — v0"** with:
   - Pages: `Cover`, `Design System`, `Primitives`, `Composer`, `Messages`, `Artifacts`, `Navigation`, `Dialogs`, `Screens`, `Flows (prototyped)`, `Future`.
   - Every screen in §10 in both light + dark.
   - Every component in §12 built as a Figma component with variants.
   - Tokens from §11 as Figma variables.
2. A one-page "design rationale" frame on the Cover page: 4–6 sentences on the accent color choice, the single-room layout bet, and the consultant-tone decision.
3. An **export-ready spec table** for engineering: for each screen, list the Figma frame name and the OverYonder endpoints it hits (§9).

---

## 17. Meta-prompt for GPT (paste this in when using the doc)

> You are designing a Figma file per the attached brief `vibe_consultant.md`. Before you start generating frames, produce a 1-page design plan covering: (a) the one accent color you're committing to and why; (b) the single biggest visual risk in the three-pane layout and how you'll mitigate it; (c) the three screens you'll design first (before the rest) because they prove the concept. Then design. Do not produce a linear wizard. Do not add more than one accent color. Every AI message bubble must match one of the six action types in §3.3 of the brief. Every artifact block must be inspectable and editable. Prefer Linear/Notion density over consumer-marketing polish. When you're done, give me the deliverables in §16 exactly.

---

## Appendix A — Quick-reference: OverYonder backend shape

- Backend: FastAPI on `:8000`, launched with `uvicorn main:app --reload --port 8000` from `OverYonder/backend/` after `source .venv/bin/activate`.
- Frontend (current reference implementation): Vite on `:5173`, `npm run dev` from `OverYonder/`.
- CORS: backend allows `http://localhost:5173` only — if the Vibe Consultant UI runs on a different port, the CORS config in `main.py:61-67` must be updated.
- Default tenant: `acme`.
- Stores are in-memory (see `main.py:70-99`) — no persistence across backend restarts; design should not assume durable server state between sessions.
- GitHub commits always go to a **new branch** off the default branch (see `sn_sdk_genome.py:393-396`).
- Genome files committed under `genomes/tenants/{tenant}/vendors/servicenow-sdk/{product_area}/{module_or_app}/…` (`sn_sdk_genome.py:399-459`).

## Appendix B — Vibe Refactor concepts we inherit (one-line each)

- `DetailedSummary` shape → MVP artifact schema.
- `MVPSOW` + `extensionTemplates` + `LegalTerms` + `MSATerms` → SOW artifact schema.
- LLM settings schema (`provider | model | apiKey? | baseUrl?`) → Settings → LLM tab.
- `llmLogs` table → Consultant Trace drawer.
- Consultant system prompt → the voice of the entire product.
- Voice capture (Web Speech API, R/P/N shortcuts) → composer mic mode.
- Linear/Notion aesthetic, Inter + JetBrains Mono, Tailwind scale → inherited wholesale.

## Appendix C — What the consultant is allowed to do automatically

To keep trust high, document in the UI (copy in Settings → Features) what the consultant does on its own vs. only on explicit confirm:

| Action | Auto | Confirm |
|---|---|---|
| Update MVP artifact based on your message | ✅ Auto | |
| Update SN Target plan | ✅ Auto | |
| Generate/refresh build prompt | ✅ Auto | |
| Auto-open the SOW tab when complexity crosses simple | ✅ Auto | |
| Upload/extract an attached SDK zip | ✅ Auto (on attach) | |
| Create a new GitHub branch | | ✅ Confirm |
| Push files to GitHub | | ✅ Confirm |
| Create a new GitHub repo | | ✅ Confirm (with repo name + visibility) |
| Create a Replit project | | ✅ Confirm |
| Change tenant | | ✅ Confirm |

Design a Settings → Features table that literally shows this matrix, with toggles for any "Auto" rows the user wants to gate.

---

*End of brief. Questions? Don't ask — design the obvious answer, note the assumption in the rationale frame, and we'll iterate.*
