# Vibe OverYonder — Architecture, UI Porting, and Agent Design

This document is the single source of truth for Vibe OverYonder. It captures (a) the runtime architecture of the product, (b) the ServiceNow UI-porting paths the consultant agent uses, and (c) the agent-rebuild plan that turns the product itself into the SDK-understanding layer.

§0–§9 cover the Track-A/Track-B model and Figma porting paths. §10–§14 cover the runtime, the LLM abstraction, cost tracking, and the phase-2 agent rebuild. Read both halves before making structural changes.

---

## 0. Where this capability fits in Vibe OverYonder

Vibe OverYonder is a consultant-driven ServiceNow app builder. The Figma → UI Builder capability described in this document is an **additive, optional track** — it does not replace the current flow.

### 0.1 Two tracks

**Track A — Backend (always runs).** Consultant intake → requirements → scoped app generation via `@servicenow/sdk` (Fluent). Produces tables, roles, ACLs, script includes, scripted REST APIs, catalog items, notifications, business rules. This is the same pipeline already proven with Cluckworks and Shoreline.

**Track B — UI (optional, gated).** When the engagement requires a custom front end, the consultant provides visual input. The system translates it into the UI layer using Now CLI (custom components) + UI Builder (page/experience composition) bound to Track A's backend.

### 0.2 Decision gate

Early in the consultant flow, explicitly ask: **"Does this engagement need a custom UI, or is a scoped-app + stock forms/portal delivery sufficient?"**

- **No custom UI needed** → ship Track A only. Delivery looks like Cluckworks or Shoreline — scoped app with generated Service Portal pages. Skip everything in this document from §6 onward.
- **Custom UI needed** → continue through Track B. Ask for visual input and proceed to the fidelity tiers below.

### 0.3 Input fidelity tiers

The consultant can provide visual input at any fidelity. The system should be honest with the consultant about what each tier realistically produces.

| Tier | Input | What gets produced | Faithfulness |
|------|-------|--------------------|--------------|
| 1 — Sketch | Whiteboard photo, single screenshot, rough mock | Best-guess page layout using **mostly stock Seismic components**; no custom components unless unavoidable | Approximate — layout and intent captured, visual detail is system-default |
| 2 — Partial Figma | A handful of Figma frames, no design system | Page layouts using stock components + **1–3 custom components** for screens that stock components can't express | Medium — key screens match Figma, secondary screens default to stock |
| 3 — Full Figma | Complete Figma project with design-system page (tokens, typography, components) | Full custom-component library via Now CLI; design tokens mapped to CSS custom properties; pages composed in UI Builder | High — Figma-faithful within the bounds of Seismic/web-component rendering |

**Rule:** The system must state the tier and expected faithfulness back to the consultant before generating, so expectations are set explicitly.

### 0.4 Audience capability — what UI delivery is even available

**Confirmed on 2026-04-24:** the ServiceNow CLI (`snc`) required for authoring custom UI Builder web components is **paid-partner-only** on the ServiceNow Store. It is NOT accessible to personal/PDI developer accounts. This forces a second axis on Track B: **what kind of ServiceNow account does the consultant have?**

| Audience | Account type | Available Track B paths |
|----------|--------------|--------------------------|
| **Audience A — PDI / personal / non-partner** | Free Personal Developer Instance (e.g., `dev378814`); standard customer instance without partner status | **Path 1 (default): Service Portal widgets via `@servicenow/sdk` Fluent** — proven, deployed, fully Figma-translatable.<br>**Path 2: UI Builder + stock Seismic components** — modern look, no custom components possible, lower Figma fidelity than Path 1 for most designs. |
| **Audience B — Paid ServiceNow Technology Partner** | Partner-program account with access to gated Store apps | All of Audience A, plus:<br>**Path 3: UI Builder + custom Stencil components via `snc`** — the highest-fidelity Figma porting path. |

**Default assumption for Vibe OverYonder:** treat every engagement as **Audience A** unless the consultant confirms paid-partner status up front. The product's primary Track B output is Service Portal, not UI Builder custom components.

### 0.5 What stays constant across tiers and audiences

- Backend is always `@servicenow/sdk` (Track A) — never regenerated from the Figma.
- The consultant-led intake/requirements phase is unchanged; Track B is simply an extra input stream (visual assets) alongside the existing functional requirements.
- Input-fidelity tiers (§0.3) determine **how faithful** the UI is; audience tiers (§0.4) determine **which technology stack** delivers it.
- Service Portal widgets are AngularJS 1.x + Bootstrap 3 underneath, but composed via `@servicenow/sdk` Fluent — same toolchain as the backend, no new install required.
- UI Builder custom components, when available, are Stencil/web-components — never React, never Angular.

---

## 1. ServiceNow UI options — what we evaluated

ServiceNow supports several UI construction paths. Choosing the right one determines everything downstream (tooling, component model, design system, deployment path).

### 1.1 Service Portal (AngularJS 1.x + Bootstrap 3)

- Traditional customer/employee-facing portal framework.
- UI is composed of **Pages** that contain **Widgets**.
- Widgets have four parts: HTML template, client script (Angular), server script (GlideScript), CSS/SCSS.
- Themes are CSS/SCSS with dark-mode + RTL support.
- Routing is URL-based; navigation via `$rootScope` events.
- **Verdict:** Built on legacy Angular 1 + Bootstrap 3, but **fully accessible to PDI / non-partner accounts** and authorable via `@servicenow/sdk` Fluent — the same toolchain as the backend. After the 2026-04-24 finding that `snc` is paid-partner-only, Service Portal is the **default Track B path for Vibe OverYonder** (see §6 Path A). It can be pushed to look modern with handwritten HTML/CSS, and a Figma design can be translated faithfully into widget templates + SCSS.

### 1.2 Next Experience / UI Builder (Seismic + Web Components) — **the chosen target**

- Modern component-based UI framework, GA since the Quebec release.
- Visual page builder at `/now/experience/ui-builder` on the instance.
- Component library built on the **Seismic design system** (web components).
- **Data Resources** (GlideRecord, Script Includes, REST) are bound declaratively to pages.
- Custom components are authored in **TypeScript + JSX-like templates** (Stencil-based) via the **Now CLI** toolchain.
- Pages, Experiences, App Shells, and Macroponents are stored as `sys_ux_*` records.
- **Verdict:** This is where ServiceNow is investing and is the right target for modern Figma-sourced designs.

### 1.3 Classic UI / UI16

- The traditional admin form/list experience. Not a target for porting modern designs.

---

## 2. Why UI Builder for the Figma port

Modern Figma designs assume:
- Reusable component primitives with typed props
- CSS custom properties / design tokens
- Responsive layouts (flex/grid, modern breakpoints)
- Clean separation of data, state, and presentation

UI Builder + custom web components map cleanly to these. Service Portal does not, without fighting Angular 1's digest cycle and Bootstrap 3's layout primitives.

---

## 3. The two ServiceNow SDKs (both relevant)

There are **two distinct SDKs** that will be used together. GPT's porting instructions need to treat them as complementary, not interchangeable.

### 3.1 ServiceNow SDK (`@servicenow/sdk`) — Fluent, backend-as-code

- Installed via `pnpm` inside a scoped-app workspace.
- Used to author **scoped applications as code**: tables, ACLs, roles, business rules, script includes, scripted REST APIs, notifications, catalog items, UI policies, Service Portal pages+widgets, menus.
- Authoring model is **Fluent** — TypeScript records like `Table({...})`, `Role({...})`, `ScriptInclude({...})`, `Acl({...})`.
- Build: `pnpm exec now-sdk build` (generates `src/fluent/generated/keys.ts` and `.now/bom.json`).
- Deploy: `pnpm exec now-sdk install` (or `--reinstall` to recover from orphaned sys_app state).
- Auth managed by `now-sdk auth --add/--delete/--use/--list` (per-user, not per-project).
- **What it does NOT generate:** UI Builder Experiences, Pages, App Shells, Macroponents, or custom web components. `sys_ux_*` records are out of scope for this SDK today.
- **Proven in this repo** by two full scoped apps deployed to PDI `dev378814`:
  - `sdk-examples/shoreline-rentals-sample/` → scope `x_1939459_shorelin`
  - `sdk-examples/cluck-sample/` → scope `x_1939459_cluck`

### 3.2 ServiceNow CLI (`snc`) + `@servicenow/cli` wrapper — UI-components-as-code

> **⚠️ PAID PARTNER ACCESS REQUIRED.** Confirmed on 2026-04-24: the `snc` binary is gated behind a **paid ServiceNow Technology Partner** account on the ServiceNow Store. Personal Developer Instance (PDI) accounts cannot download or install it. This means Path 3 (UI Builder + custom components) in §0.4 is unavailable to most Vibe OverYonder users. For PDI/personal users, use the Service Portal path (§6 Path A) instead. The two-binary install model below is documented for completeness and for users who do have partner access.

**This is a two-binary install. The npm package alone is not sufficient.** Confirmed empirically on 2026-04-24: installing only `@servicenow/cli` and running its `project` command returns `SNC is not found, please install SNC from store.` Inspecting the wrapper source confirms every UI-component subcommand is dispatched as `snc ui-component <subcommand>`.

**Component A — `snc` (the actual ServiceNow CLI):**
- Downloaded from the **ServiceNow Developer portal / Store**, not npm.
- Distributed as a platform installer (macOS `.pkg`, Windows installer, Linux package).
- Provides core CLI capabilities: profiles, auth, instance configuration.
- Profile management: `snc configure profile set --name <alias> --host <instance-url>` (interactive credential prompt).

**Component B — `@servicenow/cli` (npm wrapper, package binary `now-cli`):**
- Installed globally: `npm i -g @servicenow/cli`.
- Adds the `ui-component` extension on top of `snc`. Without `snc` already on PATH, this package is non-functional for UI component work.
- Note: the npm package's binary is named `now-cli`, not `snc`. Documentation that says `snc ui-component ...` assumes the `snc` binary from the Store; if you only have the npm wrapper, the equivalent invocation goes through `now-cli`'s subcommands (`project`, `develop`, `deploy`, `generate-update-set`).
- Confirmed installed version on this workstation: `Now CLI @29.0.2`.

**Authoring model (once both are installed):**
- Stencil-based TypeScript, JSX-like templates, SCSS, typed props, event emitters.
- Scaffold: `snc ui-component project --name x-1939459-<component-name> --scope x_1939459_<scope>`.
- Develop locally: `snc ui-component develop` (live-reload dev server).
- Deploy: `snc ui-component deploy` pushes the component bundle to the configured instance profile; component then appears in UI Builder's component picker.
- Update-set export: `snc ui-component generate-update-set` for manual install paths.

**This is the tool Figma-derived components should be generated for.**

**Install order matters:** install `snc` first (Store), then `@servicenow/cli` (npm). Reversing the order leaves the npm wrapper in a broken state until `snc` is added.

### 3.3 How they combine for a Figma → ServiceNow port

1. **Backend as code** (data model, REST, business logic, roles) → authored with `@servicenow/sdk` (Fluent).
2. **Custom UI components** (Figma-derived cards, heroes, carousels, dashboards) → authored with `@servicenow/cli` (Now CLI / Stencil).
3. **Experience composition** (pages, routing, data binding, layout) → built in UI Builder (either clicked through the UI, or — when/if tooling matures — captured as `sys_ux_*` records).

GPT's porting instructions should assume this three-layer split and pick the right tool for each artifact.

---

## 4. Reference implementation on PDI `dev378814`

Two deployed apps are available as ground truth for the backend half of the stack. The UI Builder port will reuse their backends unchanged.

### 4.1 Cluckworks — recommended first porting target

- **Location:** `/Users/groovingtothemusic/servicenow sdk/sdk-examples/cluck-sample/`
- **Scope:** `x_1939459_cluck`
- **Sys_app sys_id:** `c4500a9e73e7b8cd5f3758b2c33527fe`
- **Tables (12):** breed, coop, flock, bird, feed, egg_log, health_record (extends task), incubation, incident (extends task), order (extends task), subscription, customer
- **Roles (4-level):** customer ⊂ farmhand ⊂ farmer ⊂ admin
- **Script includes:** `FlockAnalytics` (production rate, FCR, mortality, adoptable-hen list), `PricingEngine` (live quotes)
- **Scripted REST:** `GET /api/x_1939459_cluck/egg_availability` (today's stock by grade + flock)
- **Catalog items (6):** Buy Fresh Eggs, CSA Subscription, **Adopt-a-Hen**, Farm Tour, Chick Pre-order, Report Issue (record producer)
- **Existing Service Portal:** `/cluck` with two widgets — "Today's Basket", "Meet the Flock"
- **Seed data:** 8 hens with names + bios (Henrietta, Cluckzilla, Bluebell, Midnight, Nugget, Olive, Snowball, + General Tso the rooster, non-adoptable)

Why this is the right first port: "Meet the Flock" is visually rich (photos, bios, adopt flow) and exercises the parts of the UI that Service Portal struggles with — it's a useful stress test of the Figma → UI Builder pipeline.

### 4.2 Shoreline Rentals — secondary target

- **Location:** `/Users/groovingtothemusic/servicenow sdk/sdk-examples/shoreline-rentals-sample/`
- **Scope:** `x_1939459_shorelin`
- **Sys_app sys_id:** `18f8b8b6935403104a62f0b45d03d6a8`
- 10 custom tables; rentals, memberships, loyalty, inventory, damage reports, maintenance, lessons, lost & found.
- Scripted REST: `GET /api/x_1939459_shorelin/shoreline_availability`.
- More form-heavy; port later once the Cluckworks pipeline is proven.

---

## 5. Proposed Cluckworks UI Builder experience layout

```
/now/cluck
├── Home page
│   ├── Hero banner (custom component — Figma-sourced)
│   ├── "Today's Basket" card (data resource → egg_availability REST)
│   └── Featured adoptable hens carousel
│       (data resource → bird table,
│        filter: is_adoptable=true^adoption_sponsorISEMPTY)
├── Flock page (/now/cluck/flock)
│   └── Data grid bound to flock table with FlockAnalytics metrics
├── Meet the Flock page (/now/cluck/hens)
│   └── Custom hen-card component (photo, name, bio, Adopt button)
└── Adopt page (/now/cluck/adopt/{birdId})
    └── Form component posting to Adopt-a-Hen catalog item
```

Data bindings all point at already-deployed backend resources — no backend rework required.

---

## 6. Three implementation paths for the UI layer

Paths are listed in **default-recommended order for Vibe OverYonder**. Path A is the primary deliverable for Audience-A (PDI/non-partner) users. Paths B and C are alternatives or stretch options.

### Path A (DEFAULT) — Service Portal widgets via `@servicenow/sdk` Fluent

**Audience:** All users — no partner status needed.

**Why this is the default:** It's the only Track B path that ships today on a PDI without partner gating, and it's already proven by Cluckworks (`/cluck`) and Shoreline (`/shoreline`) portals. It uses the same toolchain (`pnpm exec now-sdk build/install`) as the backend, so there are no new binaries, no new auth flows, and no new deploy steps.

**Stack reality:**
- AngularJS 1.x + Bootstrap 3 underneath. Legacy framework, but fully Figma-translatable with hand-written HTML/CSS/JS.
- Each widget is **five files** (per below), not four — the client controller is required for any interactive state.
- Tailwind, modern CSS (custom properties, grid, flex), and any vanilla-JS library can be loaded as widget dependencies.
- Routes are URL-based; pages compose multiple widgets.

**Five widget files (verified against Cluckworks "Meet the Flock" port, 2026-04-24):**

| File | Purpose |
|------|---------|
| `<name>.html` | AngularJS template — `ng-repeat`, `ng-click`, `ng-model`, `ng-if`. Bound to `data.*` (server) and `c.*` (client). |
| `<name>.scss` | Token layer (`:root`-style CSS custom properties) + namespaced page styles. **Always namespace classes** (e.g. `.cluck-mtf-`) to avoid Bootstrap 3 collisions. |
| `<name>.server.js` | `GlideRecord` queries; populates `data.*` for the template. IIFE wrapper is the convention. |
| `<name>.client.js` | Controller function that initializes `c.*` state and methods (search query, filter selection, save toggles). Required if the widget has any interactive UI. |
| `<name>.now.ts` | `SPWidget({ $id, name, id, clientScript, serverScript, htmlTemplate, customCss, hasPreview })` — the Fluent record. **Must include `clientScript`** when `<name>.client.js` exists. |

**A widget alone does NOT render. You also need a 5-record page-layout cluster** (verified 2026-04-24 — first deploy of Cluckworks ported widget displayed nothing because these were missing):

```
sp_page  →  sp_container  →  sp_row  →  sp_column  →  sp_instance(sp_widget=<your widget>)
```

Every record uses `Record({ $id: Now.ID['<alias>'], table: '<sp_*>', data: { … } })`. Layout records typically live in `src/fluent/portal/<page-name>-page.now.ts` alongside the widget files.

**Workflow:**
1. Author the five widget files in `src/fluent/portal/<widget-name>.{html,scss,server.js,client.js,now.ts}`.
2. Author the five page-layout records in `src/fluent/portal/<page-name>-page.now.ts`.
3. Author or update the `sp_portal` record with `homepage: <sys_id>` pointing at the new page.
4. `pnpm exec now-sdk build && pnpm exec now-sdk install` — same toolchain as the backend.
5. Visit `https://<instance>/<url_suffix>` to load the homepage, or `/<url_suffix>?id=<page_id>` for a specific page.

**Cross-record reference rules (each rule corresponds to a real bug encountered during the Cluckworks port — order matters here):**

| Rule | Why |
|------|-----|
| **`Now.ID['<alias>']` only resolves at `$id` positions, never in data field values.** Using it in a data field ships the literal alias string and breaks the link on the instance. | Confirmed empirically: `sp_container.sp_page = Now.ID['sp_page_cluck_flock']` shipped as `<sp_page>sp_page_cluck_flock</sp_page>` in XML. |
| **For cross-references in data fields, use `Now.ref('<table>', '<alias>')`.** This produces the resolved sys_id at build time. | Works for `sp_container`, `sp_row`, `sp_column`, `sp_widget` — any record indexed in the explicit alias section of `keys.ts`. |
| **`sp_page` records are special — indexed by their `id` natural key, not by alias.** Neither `Now.ID['sp_page_<x>']` nor `Now.ref('sp_page', '<id>')` produces a sys_id (the latter returns the id string). | Hard-code the deterministic sys_id from `src/fluent/generated/keys.ts` after a build. The hash is stable as long as the alias name doesn't change. |
| **`sp_portal.homepage` is a reference column to `sp_page`** — stores a sys_id. Working portals' display values like `sw_sc_category` are the *referenced page's `id` field shown as the display value*, not raw stored data. Pass the sys_id directly. | First deploy with `homepage: 'cluck_flock'` (string) saved as empty because validation rejected the non-sys_id value. Form showed blank → portal fell back to OOB index page → user saw the default "How can I help?" portal at `/cluck`. |
| **Service Portal HTML lint rejects `href="#"`** with `TS213`. Use `href="javascript:void(0)"` for visual-only links. | SDK build error during the Cluckworks port. |
| **Stricter SDK types than older auto-generated samples**: `sp_*.order`, `sp_column.size`, `sp_*.subheader`, etc. must be unquoted numbers/booleans, not strings. | TS2322 errors during the Cluckworks port. |

**Figma fidelity:** High. The Cluckworks port translated a full Figma Make output (React + Tailwind + shadcn/ui token layer) to a faithful Service Portal page using handwritten HTML/CSS — warm-cream palette, Fraunces/Inter typography, terracotta CTAs, sticky header, hero, filter bar, three-column footer all preserved.

**Trade-offs:** Legacy framework signaling; ServiceNow is steering new investment toward UI Builder. Performance ceiling is lower than Seismic web components for very heavy dashboards. Tailwind utilities must be hand-translated to plain SCSS (don't load Tailwind into the widget — it conflicts with Bootstrap 3 base styles).

**Proven working as of 2026-04-24:** Cluckworks "Meet the Flock" port deployed to `https://dev378814.service-now.com/cluck`. See `sdk-examples/cluck-sample/src/fluent/portal/cluck-flock-page.now.ts` and `meet-the-flock-widget.{html,scss,server.js,client.js,now.ts}` for the complete reference implementation.

### Path B — Stock UI Builder + Seismic components

**Audience:** All users — no partner status needed.

**When to use:** When the consultant prefers the modern UI Builder look and the Figma design can be approximated using only stock Seismic components (cards, data grids, forms, headings, images, containers).

**Workflow:**
1. Confirm UI Builder loads at `/now/experience/ui-builder` on the instance.
2. Create an Experience → root route → App Shell.
3. Add Pages with Data Resources bound to backend tables/REST.
4. Compose stock components into pages.
5. Capture as update set for portability.

**Figma fidelity:** Medium — bounded by what stock components can render. Custom branding limited to theming hooks; bespoke component shapes require Path C.

**Trade-offs:** Not fully "as code" — composition is click-through in UI Builder. No custom components possible without `snc`.

### Path C (PARTNER-ONLY) — UI Builder + custom Stencil components via `snc`

**Audience:** Paid ServiceNow Technology Partners only. Confirmed unavailable on PDI as of 2026-04-24.

**When to use:** When the consultant is a paid partner AND the Figma design has bespoke components that stock Seismic cannot express.

**Prerequisites — two-binary install (see §3.2 for the partner-gating warning):**

1. **Download `snc` from the ServiceNow Store.** Requires paid Technology Partner credentials. Install the `.pkg` (macOS), `.msi` (Windows), or platform package and confirm `snc --version` resolves.
2. **Install the npm wrapper:** `npm i -g @servicenow/cli`. Confirmed working with `now-cli @29.0.2`.

**Per-instance profile setup (one-time):**

3. `snc configure profile set --name <alias> --host <instance-url>` (interactive credential prompt).

**Component workflow:**

4. `snc ui-component project --name x-<companycode>-<component-name> --scope x_<companycode>_<scope>` to scaffold.
5. Author in TypeScript + JSX-like templates + SCSS; typed props; emitted events.
6. `snc ui-component develop` for live-reload local preview.
7. `snc ui-component deploy` → pushes to the profile-configured instance.
8. Drop into an Experience page in UI Builder and bind data resources.

**Figma fidelity:** Highest — Figma components map 1:1 to Stencil components, design tokens map to CSS custom properties, auto-layout maps to flex/grid.

**Plumbing-proof status as of 2026-04-24:**
- ✅ Step 2 complete (`@servicenow/cli` 29.0.2 installed at `/Users/groovingtothemusic/.npm-global/bin/now-cli`).
- ❌ Step 1 BLOCKED (`snc` is paid-partner-gated; not accessible from this PDI account).
- ❌ Steps 3+ unreachable until partner status is acquired or Path C is abandoned.

**Recommendation for Vibe OverYonder:** Treat Path C as a documented future capability, not a current deliverable. Default the product's Track B output to Path A. Add Path C support if/when the user acquires partner status.

---

## 7. Honest caveats — things GPT's instructions must not misstate

1. **`snc` is paid-partner-gated.** Confirmed 2026-04-24 on the ServiceNow Store. PDI/personal developer accounts cannot install it, so Path C (UI Builder + custom Stencil components) is unavailable to most Vibe OverYonder users. Default Track B output is Path A (Service Portal). Do not promise UI Builder custom components without first confirming the consultant holds paid Technology Partner status.
2. **`@servicenow/sdk` does NOT author UI Builder experiences.** Experiences/Pages/App Shells live as `sys_ux_*` records that the Fluent SDK doesn't generate. Path C, when available, is a **parallel effort** using `snc` + UI Builder, not an extension of the existing `src/fluent/` tree.
3. **`snc` (ServiceNow CLI) and `@servicenow/sdk` (`now-sdk`) are different tools** installed via different distribution channels (Store download for `snc`, npm global for `@servicenow/cli`, pnpm workspace for `@servicenow/sdk`). They are complementary, not substitutes.
4. **The UI-component CLI is a two-binary install.** `snc` (from the ServiceNow Store) is the actual CLI; `@servicenow/cli` (npm) is a wrapper that adds the `ui-component` extension on top. **`npm i -g @servicenow/cli` alone is insufficient** — running its commands without `snc` on PATH errors with `SNC is not found, please install SNC from store.` Install `snc` first, then the npm wrapper. See §3.2.
5. **Service Portal widgets are AngularJS 1.x + Bootstrap 3** — legacy framework, but the only Track B path available to Audience A and **fully Figma-translatable** with hand-written HTML/CSS/JS. Don't dismiss it as "not modern" — it ships today.
6. **UI Builder licensing** — core UI Builder + stock components work on standard platform licensing (Path B is available on PDI). The constraint is on `snc` (custom components), not UI Builder itself. Some domain-specific experiences (Employee Center Pro, CSM Workspaces) require additional SKUs.
7. **Seismic components are web components**, not React. Figma-generated React code cannot be dropped in directly — it must be translated to Stencil/TS component form (Path C only).
8. **Scope prefixing on PDIs** — all scoped artifacts are prefixed `x_1939459_...` on this PDI. Component names should follow: `x-1939459-<kebab-case-name>`.

---

## 8. Gates before generating porting instructions

Before GPT writes step-by-step Figma porting instructions, confirm:

1. **Audience tier** (§0.4). Ask: *"Are you authoring on a PDI / standard customer instance, or do you have paid ServiceNow Technology Partner status?"*
   - PDI / non-partner → use Path A (Service Portal). Do not generate Path C instructions.
   - Paid partner → all paths available; pick based on Figma fidelity needs.
2. **Input tier** (§0.3) — Sketch / Partial Figma / Full Figma. State the tier and expected faithfulness back to the consultant before generating.
3. For Path B or C: confirm `/now/experience/ui-builder` loads on the target instance.

**First concrete deliverable for Audience A (default):**
- A `@servicenow/sdk` Fluent widget scaffold for one Figma-derived component (e.g., re-implementing Cluckworks "Meet the Flock" hen card with hand-translated HTML/CSS/JS).
- Deployed via `pnpm exec now-sdk install` to the existing `x_1939459_cluck` portal at `/cluck`.
- Prove the Figma → Service Portal pipeline end-to-end on one widget before attempting a full Figma file port.

**First concrete deliverable for Audience B (if applicable):**
- A `snc` scaffold for `x-<companycode>-cluck-hen-card`, deployed as a custom Stencil component.
- A minimal UI Builder Experience with one page binding it to the `bird` table.

---

## 9. Summary for GPT

- **Track model:** Backend (Track A, always) + UI (Track B, optional per §0). Ask the gate question before generating Track B.
- **Audience axis (§0.4):** PDI / non-partner = Audience A (default); paid Technology Partner = Audience B. **Determines which Track B paths are available.**
- **Input tiers (§0.3):** Sketch / Partial Figma / Full Figma — state the tier and faithfulness back to the consultant.
- **Track B paths (§6):**
  - **Path A (DEFAULT, all audiences):** Service Portal widgets via `@servicenow/sdk` Fluent. AngularJS 1.x + Bootstrap 3 underneath, but Figma-translatable with handwritten HTML/CSS/JS. Already proven (Cluckworks, Shoreline). Same toolchain as the backend.
  - **Path B (all audiences):** Stock UI Builder + Seismic components. Modern look, lower Figma fidelity, no custom components.
  - **Path C (Audience B only):** UI Builder + custom Stencil components via `snc`. Highest fidelity. **Requires paid Technology Partner status — confirmed unavailable on PDI.**
- **Backend tool:** `@servicenow/sdk` (Fluent, TypeScript). Already used — don't regenerate, reuse.
- **Composition tools:** Path A → `@servicenow/sdk` Fluent (`sp_portal`, `sp_page` records). Paths B/C → UI Builder (visual), producing `sys_ux_*` records.
- **Instance:** `https://dev378814.service-now.com` (Audience A — PDI).
- **First port target:** Cluckworks `x_1939459_cluck` "Meet the Flock" hen-card, delivered as a Service Portal widget (Path A).
- **Do not:** promise UI Builder custom components without confirming partner status; try to author UI Builder experiences through `@servicenow/sdk`; try to drop React components into UI Builder; force Track B on engagements that don't need a custom UI; dismiss Service Portal as "not modern" when it's the only Track B path most users can ship.

---

## 10. Runtime architecture

Vibe OverYonder runs as two cooperating processes plus a SQLite store. Both live in this workspace.

### 10.1 Processes

| Process | Path | Stack | Port | Role |
|---------|------|-------|------|------|
| **Web app** | `vibe_now/` | Vite + React + TypeScript | `5174` | The three-zone consultant canvas (sidebar / chat / right panel), Settings, project list, doc-upload modal. |
| **API** | `vibe_now_api/` | Fastify + TypeScript + better-sqlite3 | `5275` | LLM credential storage, doc → spec extraction, ServiceNow auth aliases, build/deploy run streaming, Figma upload + transpile. |

The frontend talks to the API via plain fetch (`VITE_API_URL` env var, defaults to relative `/api/...` for the dev proxy). When the API is unreachable, the frontend silently falls back to localStorage for everything that has a fallback path (auth aliases, LLM config) so the demo flow still works offline.

### 10.2 Persistence

SQLite database at `vibe_now_api/data/vibe.db` (path configurable via `VIBE_DB_PATH`). Schema lives in `vibe_now_api/src/db.ts`; migrations are idempotent `CREATE TABLE IF NOT EXISTS` + `addColumnIfMissing()` — no migration framework, intentional for a single-user dev tool.

Tables:

| Table | Purpose |
|-------|---------|
| `auth_aliases` | ServiceNow PDI/sub-prod credentials, AES-256-GCM-encrypted password column. Source of truth for one-click deploy. |
| `build_runs` / `deploy_runs` | Streaming log + final-status records for `now-sdk build` / `now-sdk install` runs. Drives the right-panel Build/Deploy progress UI. |
| `llm_credentials` | One row per provider (openai, anthropic, google, groq, custom). Stores `model`, `base_url`, `api_key_enc` (AES-256-GCM), `updated_at`. **Plaintext keys never leave the server.** |
| `llm_active` | Singleton (`CHECK (id = 1)`) pointer to the currently selected provider. FK-linked to `llm_credentials` so deleting a credential clears the pointer. |

### 10.3 Encryption

All sensitive columns (`auth_aliases.password_enc`, `llm_credentials.api_key_enc`) use the helper at `vibe_now_api/src/lib/crypto.ts` — AES-256-GCM with a 32-byte master key from the `VIBE_MASTER_KEY` env var (64-char hex, generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). The server boots with a hard fail if the master key is missing — never start it without one.

Ciphertext format: `iv(12) || authTag(16) || ciphertext`, base64-encoded. The same primitive is used for every secret.

### 10.4 Routes (current)

| Method + path | Purpose |
|---------------|---------|
| `GET /api/health` | Liveness probe; frontend uses this for the "Backend connected" banner. |
| `GET/POST/PATCH/DELETE /api/aliases…` | ServiceNow auth alias CRUD + `:id/default`. |
| `GET/PUT/DELETE /api/llm/credentials…` | LLM credential CRUD. List/get never return plaintext keys (only `hasKey: bool`). |
| `PUT /api/llm/active` | Set the currently selected provider. |
| `POST /api/llm/test` | Real authenticated probe of a provider (uses stored key OR a just-typed override). Returns `{ok, level, title, detail}`. |
| `POST /api/spec/extract-from-doc` | Multipart upload of `.md/.txt/.pdf/.docx`; pdf-parse + mammoth extract plain text; `extractSpecFromText` calls OpenAI structured output (`gpt-5`, `json_schema` strict) and returns an `ExtractedSpec`. |
| `POST /api/figma/upload` | Multipart upload of Figma Make zip exports; cached for the build-time transpile. |
| `POST /api/sdk/build` / `POST /api/sdk/deploy` | SSE-streamed `now-sdk build` / `now-sdk install` runs. |
| `GET /api/runs/:id/stream` | SSE log stream for an in-flight build/deploy run. |

Routes register in `vibe_now_api/src/server.ts`. Multipart is hoisted to server level so it's shared by Figma upload + spec-from-doc without double-registration.

### 10.5 Frontend ↔ backend reachability detection

`vibe_now/src/lib/authAliases.ts#detectBackend()` does a single 1.5 s health probe and caches the result for the page lifetime. Every async data helper (`loadAliasesAsync`, `loadLlmConfigAsync`, …) checks it on entry and routes to backend or localStorage. The Settings modal renders different banners (success/warning) based on the same flag.

---

## 11. Entry paths — how a project starts

A project starts in one of two ways. Both produce the same `Project` shape; the difference is only how the initial `Spec` is seeded.

### 11.1 Conversation entry (default)

User clicks **New Idea**, types a name + optional description, and the consultant takes the first turn (currently scripted in `assistantBehavior.ts`; replaced by a real LLM in phase 2 — see §14).

### 11.2 Document entry — spec-from-doc (added 2026-04-26)

User clicks **New Idea → Document tab**, drops a PRD/spec doc (`.md`, `.txt`, `.pdf`, `.docx`, max 25 MB) into the dropzone. Pipeline:

1. Frontend POSTs the file to `/api/spec/extract-from-doc` (multipart).
2. `vibe_now_api/src/lib/docText.ts` extracts plain text:
   - `.md` / `.txt` → utf-8 verbatim
   - `.pdf` → `pdf-parse` (deep import to avoid the package's debug-fixture-on-import gotcha)
   - `.docx` → `mammoth.extractRawText`
3. Char-count guard rejects docs under 40 chars (likely scanned/empty).
4. `vibe_now_api/src/lib/specExtractor.ts` calls OpenAI `chat.completions` with `response_format: { type: 'json_schema', strict: true, schema: SCHEMA }`. Schema covers `title`, `description`, `features`, `tables[]`, `portal`, `architectureDecisions[]`, `openQuestions[]`. Strict mode means no JSON repair, no fragile parsing.
5. Frontend seeds a `Project` with the extracted tables/portal/uiTrackOverrides, jumps `replyTurn` to `automation` (skipping the data-model/portal turns the doc already answered), and renders the architecture decisions + open questions as the consultant's first message.

The model defaults to `gpt-5`; override via `OPENAI_MODEL` env var. The key resolves through the §12.3 ladder.

**Error envelopes:** 400 (no file / unsupported ext / empty), 413 (>25 MB), 503 (no key configured), 500 (provider error). All return `{error: string}` with actionable copy.

---

## 12. LLM provider abstraction

The product is provider-agnostic by design — OpenAI, Anthropic, Google, Groq, and any OpenAI-compatible custom endpoint plug into the same surfaces. Provider choice is a **per-workspace setting** today (one active provider at a time); per-project overrides are a phase-2 add.

### 12.1 Provider registry (frontend)

`vibe_now/src/lib/llmConfig.ts#PROVIDERS` lists each provider with `id`, `label`, `defaultBaseUrl`, `models[]`, `keyPrefix`, and `keyHint`. Adding a new provider is a single entry in this array — the Settings dropdown, model picker, and key-prefix sanity check all read from it.

`vibe_now/src/lib/providerVisuals.ts` is the parallel visual identity layer — keyed by string id with a fallback palette. Used by the cost-tracking components (§13). Unknown ids degrade to neutral colors instead of crashing the UI, so adding a provider doesn't require a UI patch.

### 12.2 Credential storage (backend)

Routes: `vibe_now_api/src/routes/llmCredentials.ts`. Storage: `vibe_now_api/src/lib/llmCredentials.ts` (the only module that decrypts keys). Key handling:

| Input shape | Behavior |
|-------------|----------|
| `apiKey: undefined / null` | Keep existing ciphertext (no-op for upserts) |
| `apiKey: ''` | Clear the stored key |
| `apiKey: '<value>'` | Encrypt with `VIBE_MASTER_KEY` and store |

The frontend uses the sentinel `'__on_file__'` (`LLM_KEY_ON_FILE_SENTINEL`) when displaying the API-key field for an existing credential — it shows "Key on file — type to replace" instead of dots, and the sentinel is filtered out of any save/test request so we never round-trip a placeholder.

### 12.3 Resolver ladder (server-side)

When any LLM call site needs a key, it calls `resolveProviderKey(provider)` which checks:

1. Stored credential's decrypted `api_key_enc` for the requested provider.
2. The matching env var: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`.
3. Returns `null` (caller surfaces a 503 with actionable copy).

This preserves the dev-shortcut of dropping a key in `vibe_now_api/.env` while making the encrypted Settings flow the production path.

### 12.4 Test endpoint

`POST /api/llm/test` runs a real authenticated probe — `GET /v1/models` with `Authorization: Bearer <key>` for OpenAI/Groq/custom, `x-api-key` for Anthropic, `?key=` for Google. Returns `{ok, level: 'success'|'warning'|'error', title, detail}`. The frontend's `testLlmConfigAsync` prefers this when the backend is up and falls back to a CORS-restricted browser probe when offline.

### 12.5 Settings UI

`SettingsModal.tsx` has three sections: AI Behavior (consultant-mode toggle), ServiceNow Instances (auth aliases), LLM Provider (provider/model/key/test). When the backend is reachable, the LLM section shows a green "Backend connected — keys are AES-256-GCM encrypted server-side" banner and hides the "Save API key to this browser" checkbox (since it's irrelevant). When offline, it shows the warning banner and the localStorage path.

---

## 13. Cost tracking

Per-project token + cost meter, no spending caps. UI scaffolded; data wiring lands when the LLM provider abstraction goes live and every call returns usage.

### 13.1 Components (in `vibe_now/src/components/`)

| Component | Surface |
|-----------|---------|
| `CostFooterChip` | Compact pill at the bottom of the chat panel — provider dot + model + total spend; hover reveals `tokens-in / tokens-out`. Click opens the detail modal. |
| `WorkspaceCostCard` | Sidebar rollup — total $, 14-day sparkline, stacked-bar provider breakdown, "View details" link. |
| `CostDetailModal` | Three tabs: **By project** (sortable table with subtle heatmap on the cost cell), **By turn** (chronological list with expandable rows + token breakdown), **By provider** (per-provider summary). |
| `Tabs` | Generic tabs primitive (didn't exist before; reusable elsewhere). |

All four use the existing token system in `vibe_now/src/styles/theme.css`. Provider colors come from `lib/providerVisuals.ts` so they stay in sync with the registry.

### 13.2 Storage plan (phase 2 wiring)

Every LLM call response includes `usage: {input_tokens, output_tokens}` (provider-normalized). Persist on the same row as the call: turn record (`chat`), spec-extract record, build record, build-retry record. Roll up per-project (footer chip + By Project tab) and per-workspace (sidebar card + sparkline). Cost = `tokens × per-model rate` from a static price table in `lib/pricing.ts`; refresh manually when providers change pricing.

### 13.3 What we deliberately skipped

- **No spending caps.** Caps are easy to bolt on later but annoying when wrong; user-facing telemetry is enough for v1.
- **No external billing dashboard CTAs.** This is a dev tool, not a SaaS console.

---

## 14. Phase-2 agent rebuild — the SDK-understanding layer

**Goal:** Vibe OverYonder stops being a templated codegen with a scripted consultant, and becomes a real provider-agnostic agent that ingests the SDK at provider-selection time, then converses, proposes spec changes, and emits Fluent + portal code itself. The product *is* the SDK-understanding layer; the human collaborator picks the LLM and supplies the key.

### 14.1 Locked decisions (2026-04-26 → 2026-04-27)

1. **Provider scope is dynamic.** The `LLMProvider` interface + registry pattern (`vibe_now_api/src/lib/llm/`) accepts new providers as a single `register()` call — no core changes. First wave: OpenAI + Anthropic. Second wave: xAI (Grok), Google. Each provider is one file under `providers/`.
2. **Bundle scope = "Plus" (~60k tokens).** The SDK knowledge bundle injected as system prompt on every call:
   - `@servicenow/sdk` Fluent type declarations (stripped `.d.ts`)
   - Call-site index from all three sample apps in `sdk-examples/`
   - The full source of one canonical sample (likely `shoreline-rentals-sample` — it's the most complete) so the LLM has a working reference, not just snippets
   - Service Portal widget shape (5 files + 5 layout records, with example)
   - The three SDK-gotcha memories as inlined rules (PDI scope-prefix auto-enforcement, `--reinstall` recovery, `Now.ID` vs `Now.ref` vs hardcoded sys_ids)
   - `vibe_overyonder.md` §0 track model
   Bundled as a single markdown file at `vibe_now_api/data/sdk-bundle.md`, built by a `scripts/build-sdk-bundle.ts`. Fits well under any provider's context window.
3. **Transition strategy = C** — LLM owns the dialogue from message 1; the existing scripted turns in `assistantBehavior.ts` remain as the **offline/no-key fallback** so demos work without a provider configured.
4. **Codegen retry budget = 1.** Emit Fluent files → run `tsc --noEmit` on the workspace → on errors, feed diagnostics back to the LLM once → if the second emit also fails, surface the generated files + errors to the user. More retries hide bad prompts; the spec or bundle needs the fix, not another LLM round.
5. **Cost visibility = per-project meter, no cap.** See §13.

### 14.2 What stays / replaced / new

**Stays:** the `Spec` type and `Project → Spec` derivation (clean handoff contract); `docText.ts` + `specExtractor.ts` (already an LLM call with structured output — first instance of the new pattern); `deploy.ts` CLI shell-out; the Figma transpile pipeline; the workspace runner.

**Replaced:**
- `vibe_now/src/lib/assistantBehavior.ts` (the canonical-turn script) → LLM-driven dialogue with a `proposeSpecPatch` tool call; scripted turns become the offline fallback.
- `vibe_now_api/src/lib/fluentGen.ts` (~1k-line Fluent template) → LLM codegen with the SDK bundle in context, gated by a `tsc --noEmit` validation loop.

**New:**
- `vibe_now_api/src/lib/llm/` — `LLMProvider` interface + `registry.ts` + `providers/{openai,anthropic,…}.ts`. Each provider exposes `chat`, `chatStream`, `structured`, plus a `models[]` self-description.
- `scripts/build-sdk-bundle.ts` — one-shot bundle builder. Run on workspace setup or when `@servicenow/sdk` version changes.
- `POST /api/chat/turn` (SSE) — conversational endpoint. Stateless w.r.t. UI; takes Spec + history, returns assistant message + optional `proposeSpecPatch`.
- `POST /api/build/llm` (SSE) — codegen endpoint. Takes the locked Spec, emits Fluent files, runs `tsc`, retries once on errors.

### 14.3 Conversational call shape

```
system: "You are a senior ServiceNow solution architect using @servicenow/sdk Fluent.
        SDK knowledge: <bundle>
        Track model: <track-A/B summary from §0>
        Current spec: <JSON>"
messages: <conversation history>
user: <latest user turn>
tools:
  - proposeSpecPatch(jsonPatch) — emit when committing a decision
  - readyToBuild()             — emit when user signals approval
```

The frontend renders the assistant text + reflects spec patches into the right panel. No turn-index gymnastics — the LLM decides what to ask, what to commit, when to push back.

### 14.4 Build call shape

```
system: "Generate @servicenow/sdk Fluent files for this scoped app.
        SDK knowledge: <bundle>
        Reference apps: <call-site index>
        Output: structured {files: [{path, content}]} matching the workspace shape."
user: <locked spec>
```

Emit → write to `workspaces/<runId>/` → `tsc --noEmit` → on errors, single retry with diagnostics in context. Track-B Path A (Service Portal widgets) is a second LLM call gated on `uiTrack.customUiNeeded === true`, with the 5-files-and-5-layout-records rule from the bundle.

### 14.5 Order of operations (current state)

| Step | Status |
|------|--------|
| Spec-from-doc end-to-end | **Done.** Backend + frontend wired; needs a real key in Settings to complete the smoke test (`OPENAI_API_KEY` in `.env` or a key saved via Settings). |
| LLM credential storage + Settings wiring | **Done.** Backend tables, encrypted storage, real `/v1/models` test, fallback ladder all live. |
| Cost-tracking UI components | **Done (UI only).** Wiring blocked on the provider abstraction landing. |
| Provider abstraction + bundle scanner | **Next.** OpenAI + Anthropic providers, `LLMProvider` interface, `scripts/build-sdk-bundle.ts`, `data/sdk-bundle.md`. |
| Conversational endpoint replacing scripted turns | After provider abstraction. Scripted turns demoted to offline fallback. |
| LLM codegen replacing `fluentGen.ts` | After conversational. Hardest piece; tsc-validate loop is critical. |
| Cost-tracking data wiring | Lands alongside the provider abstraction (every call returns usage). |

### 14.6 Out of scope until v1.1+

- Multiple concurrent provider credentials per workspace (today: one active provider at a time, but per-provider `llm_credentials` rows so switching back to a previous provider doesn't require re-entering the key).
- Per-project provider override (today: workspace default applies to every project).
- RAG over the SDK bundle (single bundled markdown is enough until it grows past ~150k tokens).
- Spending caps (only the meter ships in v1).
- Figma-side prompt emission (today: user runs Figma Make themselves and uploads the export; LLM-authored Figma prompts come later).
