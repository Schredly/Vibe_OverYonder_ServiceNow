# Vibe OverYonder — Project Brief for an Incoming Consultant

**Audience:** a senior full-stack / ServiceNow consultant joining mid-flight.
**Goal:** in 30 minutes, you should have enough context to read the code, run the app locally, ship a feature, and know which gotchas to avoid.

---

## 1. What this is

**Vibe OverYonder** is a "vibe-coding studio" for the ServiceNow Now SDK. The user describes an idea in natural language, has a consultative chat with an LLM agent, optionally uploads a Figma design, and walks out with a deployable scoped ServiceNow application — Fluent TypeScript files, Service Portal pages, Application Menu + nav modules, all built and installed via the Now SDK.

It is the Lovable / Bolt.new / v0 experience targeted at ServiceNow rather than generic web apps. There is no other tool that takes a natural-language brief and produces a deployed scoped app on ServiceNow.

The product brief at `vibe_now/documentation/vibe_overyonder.md` is the original PM document; this document is the engineering walkthrough.

### Sibling projects in the same workspace
- `snow-converter/` — separate tool that ingests an existing GitHub repo and outputs a Now SDK project. Different entry point, same eventual output.
- `sdk-examples/` — reference SDK apps (`shoreline-rentals-sample`, `cluck-sample`, `applicationmenu-sample`, etc.) used as gold-standard outputs and as ingest fodder when validating the pipeline.

---

## 2. Repository layout

```
servicenow sdk/                             ← single git repo (Schredly/Vibe_OverYonder_ServiceNow)
├── vibe_now/                               ← FRONTEND (Vite + React + Tailwind)
│   ├── src/
│   │   ├── App.tsx                         ← top-level state, routing, modal orchestration
│   │   ├── components/                     ← all UI surfaces (Modals, Sidebar, RightPanel, …)
│   │   ├── lib/apiClient.ts                ← typed wrapper around every backend route
│   │   ├── types/                          ← Project, ProjectStorage, etc.
│   │   └── styles/                         ← Tailwind + design tokens
│   ├── documentation/                      ← project docs (this file lives here)
│   └── vite.config.ts                      ← dev port 5174
│
├── vibe_now_api/                           ← BACKEND (Fastify + better-sqlite3 + tsx)
│   ├── src/
│   │   ├── server.ts                       ← Fastify bootstrap, port 5275, registers all routes
│   │   ├── db.ts                           ← SQLite schema (singleton DB at data/vibe.db)
│   │   ├── routes/                         ← one file per logical surface (REST verbs)
│   │   │   ├── aliases.ts                  ← ServiceNow auth aliases (now-sdk auth wrapper)
│   │   │   ├── build.ts                    ← now-sdk build run + log streaming
│   │   │   ├── chat.ts                     ← LLM consultative chat turns
│   │   │   ├── deploy.ts                   ← now-sdk install run + retry-with-reinstall
│   │   │   ├── figma.ts                    ← Figma zip upload + transpile pipeline
│   │   │   ├── github.ts                   ← PAT cred storage, browse, push, test
│   │   │   ├── llmCredentials.ts           ← provider keys (OpenAI, Anthropic, etc.)
│   │   │   ├── packages.ts                 ← discover/inspect/import existing SDK packages
│   │   │   ├── projects.ts                 ← project CRUD
│   │   │   ├── runs.ts                     ← SSE log stream for build/deploy
│   │   │   ├── specExtract.ts              ← upload doc → extracted spec
│   │   │   ├── usage.ts                    ← cost ledger + token usage
│   │   │   └── versions.ts                 ← project_versions snapshots
│   │   └── lib/                            ← business logic, organized by surface
│   │       ├── chatTurn.ts                 ← LLM consulting loop
│   │       ├── crypto.ts                   ← AES-256-GCM under VIBE_MASTER_KEY
│   │       ├── docText.ts                  ← PDF/docx → text for spec extraction
│   │       ├── figmaTranspile/             ← Figma → Service Portal pipeline (M2-M5)
│   │       ├── fluentGen.ts                ← spec → Fluent TypeScript files
│   │       ├── githubCredentials.ts        ← PAT save/probe/clear
│   │       ├── githubImport.ts             ← clone repo → import as project
│   │       ├── githubPush.ts               ← clone repo → write project subfolder → push
│   │       ├── llmCredentials.ts           ← provider key vault (encrypted)
│   │       ├── packageImport.ts            ← copy package on disk → workspaces/<id>/
│   │       ├── packageIngest.ts            ← LLM-driven pass: read package, build spec
│   │       ├── packageScanner.ts           ← discover Now SDK packages on disk
│   │       ├── pricing.ts                  ← per-token-per-model pricing tables
│   │       ├── projects.ts                 ← project_row CRUD helpers
│   │       ├── runBus.ts                   ← in-process pubsub for SSE log streams
│   │       ├── scope.ts                    ← PDI scope-prefix derivation/validation
│   │       ├── sdkBundle.ts                ← package the workspace → ZIP (target/)
│   │       ├── sdkRunner.ts                ← spawn now-sdk CLI commands
│   │       ├── specExtractor.ts            ← LLM extract → NowSpec from doc text
│   │       ├── usageTracker.ts             ← record every LLM call to cost_ledger
│   │       ├── versions.ts                 ← snapshot working copy → v<N>
│   │       └── workspaces.ts               ← per-project filesystem layout
│   ├── data/                               ← SQLite db (vibe.db) lives here
│   └── workspaces/                         ← per-project working trees
│       └── <projectId>/                    ← either greenfield or lifecycle layout
│
├── snow-converter/                         ← sibling (GitHub-to-ServiceNow); not part of vibe_now
└── sdk-examples/                           ← reference Fluent apps, used as ingest fixtures
```

---

## 3. Run it locally

Two long-running processes; both use auto-reload.

```bash
# Terminal 1 — backend (Fastify on 127.0.0.1:5275, tsx watch reloads on edits)
cd "vibe_now_api"
npm install
npm run dev

# Terminal 2 — frontend (Vite on http://localhost:5174)
cd "vibe_now"
npm install
npm run dev
```

Required env on the backend:
- `VIBE_MASTER_KEY` — 32-byte hex string. AES-256-GCM key for encrypting all stored secrets (ServiceNow passwords, LLM API keys, GitHub PATs). If missing, the backend generates a dev key and writes it to disk; in production this must be set explicitly.
- `OPENAI_API_KEY` (or per-provider key) — only used as a bootstrap default; users set keys per-provider via Settings → LLM, encrypted with the master key.

The SQLite DB lives at `vibe_now_api/data/vibe.db`. Schema is created on boot from `db.ts`. Migrations are idempotent `CREATE TABLE IF NOT EXISTS` + occasional `ALTER TABLE` guards; there is no migration framework yet.

---

## 4. The user journey, mapped to code

Three entry points; they all converge on the same project lifecycle.

### 4.1 New idea (greenfield)
1. User clicks **New Idea** in the sidebar (`vibe_now/src/components/Sidebar.tsx`).
2. NewIdeaModal collects a one-line idea, optionally a doc upload (PDF/docx).
3. If a doc is uploaded → `POST /api/spec/extract` → `lib/specExtractor.ts` runs an LLM extraction with structured output (`response_format: { type: 'json_schema', strict: true }`).
4. A `projects` row is created. Workspace lives at `vibe_now_api/workspaces/<projectId>/` (greenfield layout: Fluent files at the root).
5. The user lands on the canvas and chats with the consulting agent (`POST /api/chat/turn`, `lib/chatTurn.ts`). Each turn updates the spec in-place.
6. **Save & Build** runs `lib/fluentGen.ts` → writes `src/fluent/` files → spawns `now-sdk build` via `lib/sdkRunner.ts` → snapshots a `project_versions` row.
7. **Deploy** spawns `now-sdk install` → on success, the app is live on the configured ServiceNow PDI and shows up in the left navigator (because we now emit `ApplicationMenu` + `sys_app_module` records — see §6).

### 4.2 Open existing package
1. User clicks **Open Existing** in the sidebar.
2. OpenPackageModal (`vibe_now/src/components/OpenPackageModal.tsx`) shows three sources:
   - **Local discovery** — scanned via `lib/packageScanner.ts` from `workspaces/`, `sdk-examples/`, and any `VIBE_PACKAGES_ROOT` env paths.
   - **Custom path** — arbitrary local path; `POST /api/packages/inspect-path` validates it has `now.config.json`.
   - **Browse from GitHub** — uses the default repo URL from Settings; lists folders via `GET /api/github/browse`. User drills `repo → project → package → version` and clicks **Open this**.
3. Selected source → `POST /api/packages/import` (or `import-from-github` with optional `subPath`) → `lib/packageImport.ts` copies into the **lifecycle layout**:
   ```
   workspaces/<projectId>/
     original/      ← pristine copy; never modified
     working/       ← live edits go here
     v1/            ← initial snapshot
     v2/, v3/, …    ← snapshots from Save & Build or "Save as new version"
   ```
4. After import, `lib/packageIngest.ts` runs an LLM pass that reads every Fluent file and reconstructs a `NowSpec` so the chat can reason about the package.

### 4.3 Open from GitHub URL (legacy)
Same as 4.2 with explicit URL paste; replaced by the browse flow but the route still works.

---

## 5. Key concepts

### 5.1 Project lifecycle layouts — two shapes
The `workspaces/<projectId>/` folder has **two possible shapes** depending on origin:

**Greenfield (New Idea):**
```
workspaces/<projectId>/
  now.config.json
  package.json
  src/fluent/
  …Fluent files at the root
```

**Lifecycle (opened package):**
```
workspaces/<projectId>/
  original/                ← read-only pristine copy
  working/                 ← live editable copy
  v1/, v2/, …              ← versioned snapshots
```

Anything that writes to a project must call `lib/workspaces.ts#workingCopyPath()` first — for greenfield it returns the project root, for lifecycle it returns `working/`. Same for builds and pushes.

### 5.2 NowSpec
The single source of truth between conversation and codegen. Defined in the spec extractor's JSON schema (`lib/specExtractor.ts`). Holds tables, roles, ACLs, business rules, catalog items, portal pages, REST APIs, etc. The Fluent generator (`lib/fluentGen.ts`) is a pure function from `NowSpec` → files on disk.

### 5.3 Now.ID + deterministic sys_ids
Every Fluent record uses `Now.ID['alias']` to generate a deterministic sys_id from the project workspace path + alias. This means rebuilds don't churn sys_ids in ServiceNow — the platform sees the same record and updates in place. **Never** hardcode a sys_id; always use `Now.ID`.

### 5.4 Scope prefixing on PDIs
PDIs require all custom scopes start with `x_<companycode>_`. `lib/scope.ts` derives the prefix from the configured ServiceNow auth alias. The user types only the suffix; the UI shows the full scope as it'll be deployed. Scope length is capped at 18 chars (PDI limit). Both these guards are pre-flight checks before deploy.

### 5.5 Encryption
All secrets — ServiceNow passwords, LLM keys, GitHub PATs — go through `lib/crypto.ts` (AES-256-GCM under `VIBE_MASTER_KEY`). The plaintext is only in memory during a single request. The DB only ever holds the ciphertext + IV + auth tag.

### 5.6 SSE log streams
`now-sdk build` and `now-sdk install` both stream log lines through `lib/runBus.ts` (an in-process EventEmitter) and out via SSE on `/api/runs/<runId>/stream`. The frontend BuildLogDrawer subscribes and renders.

---

## 6. ServiceNow Application Menu emission (recently added)

A deployed scoped app shows up in the platform's left navigator only if it has:
1. A `sys_app_category` (visual grouping)
2. An `ApplicationMenu` record (the menu item itself)
3. Per-table `sys_app_module` rows (the children — list/new view shortcuts)

`lib/fluentGen.ts#applicationMenu()` emits all three to `src/fluent/menus/application-menu.now.ts`. Without these, the deploy lands the scope but there's no nav entry — the user has to find tables by typing the table name. This was a recent fix; older projects need a Save & Build to pick it up.

---

## 7. GitHub integration

### 7.1 Push layout — three levels
Every push lands at `<repo>/<project>/<package>/<version>/`. The Push modal (`vibe_now/src/components/PushToGitHubModal.tsx`) collects:
- **Project name** — top folder (default = slug of project name).
- **Package name** — middle folder (default = `main`). Lets one project hold multiple packages, each with its own version history.
- **Push mode**:
  - **Update existing** — dropdown of existing versions inside `<project>/<package>/`. Overwrites the picked one.
  - **New version** — text input for the new version subfolder; defaults to next free `v<N>`.

Backend (`lib/githubPush.ts`):
1. Clone the repo (or refresh an existing per-project clone in `workspaces/<id>/_github_clone/`) using `https://x-access-token:<PAT>@github.com/...` form.
2. `git fetch && git reset --hard origin/<branch>` so we're always fast-forwardable.
3. Detect legacy 1- and 2-level layouts and migrate them into the 3-level form in the same commit.
4. Wipe `<project>/<package>/<version>/` and `cp` the working copy into it.
5. `git add -A && git commit -m '<message>' && git push origin <branch>` — plain push, no force, because we always reset before committing.

Repo auto-creation is supported when the PAT has admin scope; otherwise the user pre-creates the repo and points us at it.

### 7.2 Pull / browse
`GET /api/github/browse?repoUrl=&path=` uses GitHub's REST contents API — no clone needed. Powers the Open Existing Package picker.

`POST /api/packages/import-from-github` with `{ repoUrl, subPath }` clones, treats `<clone>/<subPath>` as the package root, and runs the same import → ingest pipeline as a local open. Path-traversal guarded.

### 7.3 Settings
Settings → GitHub holds:
- **Default repo URL** — recommended; one repo per shop.
- **Default repo owner / org** — fallback that builds `https://github.com/<owner>/<projectSlug>` per push (requires PAT with repo-create permission).
- **PAT** — encrypted at rest. **Test connection** button probes against `https://api.github.com/user`.

---

## 8. Figma → Service Portal pipeline

`lib/figmaTranspile/` is a multi-stage compiler that turns a Figma Make export (zip with `App.tsx`, `components/`, `imports/`) into a Service Portal widget.

| Stage | Module | Output |
|---|---|---|
| M2 — parse | `parseTsx.ts` | TSX AST → JSX IR |
| M3 — Tailwind compile | `tailwindCompile.ts` | Tailwind classes → SCSS |
| M4 — emit | `jsxToTemplate.ts` | IR → AngularJS template (HTML) |
| M5 — wire-up | `fluentGen.ts#figmaWidget*` | server.js + client.js + Fluent record + page layout |

The widget is registered as the homepage of an `sp_portal` so the deployed app's portal serves the Figma design.

**Pitfalls (already handled, but worth knowing):**
- `<Route>` from `react-router-dom` is stubbed via `reactRouterStubs.ts` — content is lifted from `element={<Home/>}` and routes are flattened.
- TypeScript syntax (`as const`, `satisfies`, postfix `!`) is stripped via Babel before emitting `client.js` so AngularJS can parse it.
- AngularJS scope seeding happens in `client.js` (`$scope.<name> = ...`); `ng-init` doesn't reach the isolated widget scope.
- Shadcn/ui imports are shimmed (`shadcnShims.ts`) since the portal can't reach `@/components/ui`.

---

## 9. LLM layer

All LLM calls go through `lib/chatTurn.ts` or `lib/specExtractor.ts` (or `lib/packageIngest.ts`).

Provider abstraction supports OpenAI, Anthropic, Gemini, Groq, plus a Custom OpenAI-compatible base URL. Settings → LLM holds the active provider + model + per-provider keys (encrypted). Default is **OpenAI GPT-5** (per the user's preferences).

Every call writes a row to `cost_ledger` via `lib/usageTracker.ts` — provider, model, prompt tokens, completion tokens, cached tokens, dollar cost computed against `lib/pricing.ts`. The Cost Analytics modal renders this.

Structured output is preferred everywhere user-facing: `response_format: { type: 'json_schema', strict: true }`. The schemas live next to the prompts.

---

## 10. Database (SQLite)

```
projects             — id, name, source_path?, created_at, updated_at
project_versions     — versioned snapshots (v1, v2, …) per project
working_copies       — pointer to working/ dir for lifecycle projects
build_runs           — every now-sdk build invocation + status
deploy_runs          — every now-sdk install invocation + status
refinement_runs      — every Save & Build refinement pass (LLM)
auth_aliases         — ServiceNow PDI/instance creds (encrypted password)
llm_credentials      — per-provider API keys (encrypted)
llm_active           — which provider+model is the current default
github_credential    — singleton; PAT (encrypted) + login + updated_at
token_usage          — denormalized per-call usage counters
pricing_plans        — per-model rate cards (USD per million tokens)
cost_ledger          — every LLM call's dollar cost, joinable to project
```

All tables are created on boot from `db.ts`. There's a single `getDb()` function that returns the singleton `better-sqlite3` Database; no connection pool needed since the runtime is single-process.

---

## 11. Known gotchas (consultant cheat sheet)

- **`now-sdk` runs from inside the package folder.** Always `cd workspaces/<id>` before spawning it.
- **`pnpm run deploy`, not `pnpm deploy`** — the latter is the package-manager command.
- **PDI scope-prefix** — auto-enforced; if the user's scope doesn't start with `x_<companycode>_` and the target is a PDI, deploy is blocked with an inline fix-it.
- **First-line remediation for `application was null`** is `--reinstall`. The deploy panel surfaces a one-click retry.
- **Catalog items don't accept a `category` prop** — link via `sc_cat_item_category` association.
- **`GlideDate.getValue()` doesn't exist** — use `String(new GlideDateTime().getDate())`.
- **`EmailNotification.recipientRoles` doesn't exist** — use `recipientFields + sendToCreator`.
- **`CatalogUiPolicy` props are camelCase** (`mandatory`, `visible`, `appliesTo`, `catalogItem`).
- **Service Portal widget = 5 files + 5 layout records.** The 5 files are `.html`, `.scss`, `.server.js`, `.client.js`, `<widget>.now.ts`. The 5 layout records are `sp_page` → `sp_container` → `sp_row` → `sp_column` → `sp_instance`. All five must exist or the page renders blank.
- **`Now.ID['alias']` only at `$id`**; `Now.ref('<table>', '<alias>')` in data fields. Never hardcode sys_ids.
- **Column names must be `[a-z0-9_]`.** The Fluent generator now snake_cases column keys automatically (recent fix); LLM tends to emit camelCase otherwise.
- **Flows on brand-new tables are unreliable in SDK 4.4.** Default to business rules + notifications; only allow flows targeting OOB tables (incident, change_request, sc_req_item).

---

## 12. What's open / where to focus next

Things that are partially built or near-future work:

- **Pull from repo** — kebab menu has the entry; backend route shape exists but the wiring to actually clone-into-workspaces and re-ingest is not done. Roughly 1 day.
- **Push existing projects in bulk** — Settings has the GitHub config; a bulk-push panel that pushes every local project to its slot in the default repo would be a small addition.
- **`projects.github_repo_url` column** — currently only the latest `pushedPath` is stored as `source_path`. A dedicated column would let the project chip show "linked to <repo>" durably across reloads and would make the kebab "Open in GitHub" deterministic.
- **Storage picker in New Idea modal** — currently New Idea always lands as Local; option to start linked to a specific GitHub project folder is on the wishlist.
- **Spec→Fluent for catalog, REST APIs, business rules** — the spec captures these but `fluentGen.ts` only emits tables, roles, portal, application menu so far. Catalog and REST emission would close the loop on the §12 success criteria in `vibe_overyonder.md`.

---

## 13. Code-reading order for a new consultant

If you have ~2 hours, read these in order and you'll have the full mental model:

1. `vibe_now/documentation/vibe_overyonder.md` — the original PM brief.
2. `vibe_now_api/src/server.ts` — what routes exist.
3. `vibe_now_api/src/db.ts` — what state we keep.
4. `vibe_now_api/src/lib/workspaces.ts` — filesystem layout invariants.
5. `vibe_now_api/src/lib/specExtractor.ts` — the NowSpec schema (this is the contract).
6. `vibe_now_api/src/lib/fluentGen.ts` — how spec becomes code.
7. `vibe_now_api/src/lib/chatTurn.ts` — the consulting loop (heart of the product UX).
8. `vibe_now_api/src/lib/githubPush.ts` — recent feature, well-commented; good for understanding the conventions.
9. `vibe_now/src/App.tsx` — top-level state machine; modals are the seams.
10. `vibe_now/src/components/PushToGitHubModal.tsx` and `OpenPackageModal.tsx` — typical component shape, two flagship surfaces.

Pair-with: a deployed reference app at `sdk-examples/shoreline-rentals-sample/` is the gold-standard output. If you can read it and understand why each Fluent record is there, you've got the SDK side covered.

---

## 14. Coordinates

- **Frontend repo path:** `/Users/groovingtothemusic/servicenow sdk/vibe_now/`
- **Backend repo path:** `/Users/groovingtothemusic/servicenow sdk/vibe_now_api/`
- **Git remote:** `https://github.com/Schredly/Vibe_OverYonder_ServiceNow.git` (branch `main`)
- **Frontend dev URL:** `http://localhost:5174`
- **Backend dev URL:** `http://127.0.0.1:5275`
- **SQLite DB:** `vibe_now_api/data/vibe.db`
- **PDI used for testing:** `https://dev378814.service-now.com` (alias managed via Settings → ServiceNow)

---

*End of brief. Welcome aboard — start with §3 (run it) and §13 (code-reading order). Ping for context on anything in §11 before debugging.*
