# Vibe OverYonder

AI-powered ServiceNow app builder. Walk in with a rough idea ("a vendor management app with portal access and document workflow") or a PRD doc, and walk out with a deployed scoped application — tables, roles, ACLs, business rules, REST APIs, and a Service Portal driven by a Figma Make design.

The product is the consulting layer. An LLM with packaged ServiceNow SDK knowledge holds a conversation about the app, commits architectural decisions to a living spec, and feeds them into the @servicenow/sdk Fluent codegen pipeline. Open an existing package to refine it, upload a Figma zip to drive the portal, save versions as you iterate, and deploy any version to your instance.

## What's in this repo

```
servicenow sdk/
├── vibe_now/         Vite + React frontend (port 5174)
├── vibe_now_api/     Fastify backend (port 5275)
├── sdk-examples/     Reference Now SDK apps (Cluckworks, Shoreline, etc.)
└── snow-converter/   Sibling tool — GitHub-to-ServiceNow converter
```

### `vibe_now/` — frontend

Three-zone canvas: project sidebar / consultant chat / living spec right panel.

- **Sidebar** — workspace cost rollup, project list, "New Idea" + "Open Existing Package" entry buttons
- **Chat** — the consultant agent. Free-form conversation; agent has SDK knowledge baked in (track model, gotchas, reference apps), proposes spec patches, asks targeted follow-ups, surfaces refinement opportunities
- **Right panel** — Living Spec (tables, roles, portal config), version history strip with per-version Deploy buttons, build/deploy strip, Save & Build pill above the chat composer when the working copy is dirty
- **Settings** — pluggable LLM provider (OpenAI, Anthropic, Google, Groq, custom OpenAI-compat) with backend-encrypted key storage, ServiceNow auth aliases, consultant mode toggle, cost analytics modal

### `vibe_now_api/` — backend

Fastify HTTP API + SQLite. Source of truth for everything that needs persistence beyond a browser session.

Highlights:
- **LLM credential store** — AES-256-GCM at rest under `VIBE_MASTER_KEY`. Plaintext keys never leave the server.
- **Project lifecycle** — `projects` / `project_versions` / `working_copies` tables. Open Existing Package import creates `original/`, `working/`, and `v1/` directories on disk; Save & Build snapshots the working copy as `v<N>/`.
- **LLM-driven consultant turn** (`POST /api/chat/turn`) — strict JSON-schema OpenAI call with the SDK knowledge bundle, current spec snapshot, conversation history, and a `proposeSpecPatch` tool surface
- **Spec-from-doc** (`POST /api/spec/extract-from-doc`) — multipart upload of a PRD (`.md`/`.txt`/`.pdf`/`.docx`); GPT-5 returns a structured Spec, `architectureDecisions[]`, and `openQuestions[]` to seed the conversation
- **Package ingest** (`POST /api/packages/:id/ingest`) — LLM reads every Fluent file in an opened package and produces a structured review (per-section summaries, architectural commitments, refinement opportunities, intro message)
- **Figma Make transpile pipeline** (M2 parse → M3 Tailwind compile → M4 widget HTML emit → M5 SDK wire-up) — drops a real Figma export into the deployed Service Portal as a working AngularJS widget. Includes parser support for React Router JSX patterns, content-prop lifting (`<Route element={<Home/>}/>`), TypeScript-syntax stripping (`as const` / `satisfies`), and scope seeding via the widget's `clientScript`.
- **Token + cost ledger** — every refinement records `token_usage` + `cost_ledger` rows; rollups by project / version / provider feed the Cost Analytics modal
- **SSE streamed build + deploy** — `now-sdk build` and `now-sdk install` runs stream live logs to the right panel; deploys can target a specific frozen version snapshot

### `sdk-examples/` — reference SDK apps

Cluckworks (chicken farm), Shoreline (beach rentals), and ~25 other one-off samples. These are deploy targets on PDI `dev378814` that prove the SDK toolchain end-to-end. They're also where the LLM's knowledge bundle pulls call-site patterns from.

### `snow-converter/` — sibling tool

GitHub-to-ServiceNow converter. Independent of the main builder; ingests a GitHub repo and emits a Now SDK project. Lives here because Vibe OverYonder is its greenfield counterpart.

## Setup

### Prerequisites

- **Node 22+**
- **npm** (or pnpm; npm is what's been tested)
- A **ServiceNow PDI** (free Personal Developer Instance) — only needed to actually deploy. The chat / spec / Figma transpile work without it.
- An **OpenAI API key** for the consultant + transpile pipeline. Other providers (Anthropic, Google, Groq) plug into the same registry, but the doc-extract / chat / package-ingest paths default to OpenAI today.

### One-time install

```bash
git clone https://github.com/Schredly/Vibe_OverYonder_ServiceNow.git
cd Vibe_OverYonder_ServiceNow

# Frontend
cd vibe_now
npm install

# Backend
cd ../vibe_now_api
npm install
cp .env.example .env
```

### Configure secrets

Open `vibe_now_api/.env` and set:

```bash
# Generate a fresh 32-byte key — do not reuse one from elsewhere.
VIBE_MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

Other env vars (defaults shown — change only if a port conflicts):

```
PORT=5275
VIBE_DB_PATH=./data/vibe.db
VIBE_WORKSPACES_DIR=./workspaces
VIBE_WEB_ORIGIN=http://localhost:5174
VIBE_SCOPE_PREFIX=x_1939459    # PDI company-code prefix; yours will differ
```

`VIBE_SCOPE_PREFIX` must match what your PDI assigns to scoped apps. Open `sys_app_list.do` on your instance, look at any existing scoped app, and copy the leading `x_<digits>` of its scope.

You can optionally drop `OPENAI_API_KEY=sk-...` in `.env` for development, but the supported path is the Settings UI (encrypted at rest).

### Run

Two terminals:

```bash
# Terminal 1
cd vibe_now_api && npm run dev
# Fastify listens on http://127.0.0.1:5275

# Terminal 2
cd vibe_now && npm run dev
# Vite serves http://127.0.0.1:5174
```

Open http://127.0.0.1:5174 in your browser.

### First-run checklist

1. **Click the gear → Settings → LLM Provider.** Pick OpenAI, paste your `sk-…` key, hit **Test Provider** (real auth probe). On success, click **Save**. The key is encrypted server-side; the field shows "Key on file — type to replace" on subsequent loads.
2. **Settings → ServiceNow Instances → Add Instance.** Enter your PDI URL (`https://devNNNNNN.service-now.com`), username, password. Test the connection. Mark as default. The password is encrypted server-side.
3. **Either:**
   - **New Idea** — describe an app and chat. Approve the proposal when ready, then **Build → Deploy**.
   - **Open Existing Package** — pick from the list of apps discovered in `sdk-examples/` or `vibe_now_api/workspaces/`. The agent reads it (~30–90s), seeds the spec, and lets you refine.

### Optional: a real Figma design

In a chat that has the **Service Portal** track enabled, drop a **Figma Make** zip export into the chat (paperclip icon). The pipeline parses every `.tsx`, compiles Tailwind, emits an AngularJS widget template, and wires it into the SDK Fluent record so deploy lands the design on ServiceNow.

## Daily usage

```
git pull
cd vibe_now_api && npm run dev    # backend
cd vibe_now     && npm run dev    # frontend
```

Each Save & Build snapshots `working/` to a new `v<N>/`, runs `now-sdk build` against it, and flips the version status to **Built**. Each Deploy runs `now-sdk install` against the chosen version's snapshot. The right panel's Versions strip shows which version is currently live on the instance (green accent + "Deployed" chip).

## What's local vs. committed

The repo includes source code for all four sub-projects. **Excluded** by `.gitignore`:

- `node_modules/` — re-install with `npm install`
- `vibe_now_api/.env` — your secrets
- `vibe_now_api/data/*.db` — encrypted credentials store
- `vibe_now_api/workspaces/` — transient per-project build snapshots (multi-GB)
- Build outputs (`dist`, `target`, `.now`, `*.tsbuildinfo`)
- Editor/OS noise (`.DS_Store`, `.vscode`, `.idea`, `.claude`)

If you run into "missing module" or "Cannot find now.config.json" errors after a fresh clone, the most common cause is forgetting `npm install` in one of the four sub-projects.

## Architecture deep-dive

The full architectural story — SDK knowledge bundle, two-track delivery model, audience tiers, three Service Portal paths, the Figma transpile pipeline, the LLM provider abstraction, version lifecycle, cost ledger schema — lives at:

```
vibe_now/documentation/vibe_overyonder.md
```

Read that before making structural changes.

## License

No license declared yet. Treat as private until one is added.
