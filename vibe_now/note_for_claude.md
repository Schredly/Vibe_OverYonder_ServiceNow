# Note for Claude — Vibe Now

Hello future Claude. This is a handoff note from a prior session. Read this before making changes so you don't re-derive context.

## What this project is

**Vibe Now** is an AI-powered ServiceNow application builder. The UX is modeled on "vibe coding" tools: the user describes an app in natural language, an AI consultant chats with them to refine the idea, and the system generates a scoped ServiceNow app via the **ServiceNow Now SDK**.

This folder lives under `/Users/groovingtothemusic/servicenow sdk/` (note the space — always quote paths) alongside:
- `sdk-examples/` — Now SDK reference apps
- `snow-converter/` — another tool
- `gpt_vibe_doc/` — related docs

## Current phase

**Phase 1 is complete** — frontend app shell only. Everything the user sees is React state; there is **no backend, no database, no real LLM call, no real Now SDK integration yet**.

## Tech stack

- Vite 6 + React 18 + TypeScript + Tailwind v4 (`@tailwindcss/vite` plugin, no `tailwind.config.js`)
- `lucide-react` for icons
- No routing library, no state library — plain `useState` in `src/App.tsx`
- Dev server on **port 5174** (`vite.config.ts`)

## How to run

```bash
cd "/Users/groovingtothemusic/servicenow sdk/vibe_now"
npm install        # first time only
npm run dev        # Vite on http://localhost:5174
npm run lint       # runs `tsc -b --noEmit` — project should type-check clean
npm run build      # tsc + vite build
```

## File structure

```
vibe_now/
├── index.html                  # favicon points at /favicon.svg
├── package.json                # scripts: dev, build, preview, lint
├── vite.config.ts              # port 5174, host: true
├── tsconfig.{json,app,node}.json
├── public/
│   └── favicon.svg             # orange bullseye matching --primary (#FF6B35)
└── src/
    ├── main.tsx
    ├── App.tsx                 # single-file state container — most logic lives here
    ├── styles/
    │   ├── index.css           # imports tailwind + theme
    │   └── theme.css           # CSS vars (light + dark), keyframes, @custom-variant dark
    ├── types/index.ts          # Project, Message, Spec, ProposalState, etc
    ├── data/mockData.ts        # currently empty arrays (demo data was cleared)
    └── components/
        ├── Sidebar.tsx         # logo + New Idea + project list (hover: pencil/trash)
        ├── Workspace.tsx       # AI Consultant header + chat thread + composer
        ├── RightPanel.tsx      # Living Spec + Build & Deploy + Export
        ├── ChatBubble.tsx      # renders text / proposal / deploy-success message kinds
        ├── ProposalCard.tsx    # the Approve/Decline spec recap shown inline in chat
        ├── TypingIndicator.tsx # bouncing-dots "AI is thinking" bubble
        ├── DeployProgress.tsx  # step list with pending/active/done states
        ├── Modal.tsx           # reused for New Idea / Edit / Delete-confirm / Deploy
        ├── Button.tsx          # variants: primary, secondary, ghost, danger
        ├── Input.tsx           # Input + TextArea
        ├── Card.tsx            # Card + CardHeader
        ├── StatusChip.tsx      # success/warning/danger/info/neutral pills
        ├── Collapsible.tsx
        └── ThemeToggle.tsx     # .dark class on <html>, persisted to localStorage
```

## Key interaction flow (read `src/App.tsx` to see it)

1. User clicks **New Idea** → enters name + optional description → project appears in sidebar.
2. User chats with the AI Consultant. Replies are a **scripted 6-turn sequence** (`replyScript` in App.tsx) — clarifying questions → recommendations → permissions. After turn 6, the agent automatically emits a **proposal message** with the full spec and **Approve / Decline** buttons rendered inline via `ProposalCard`.
3. **Approve** → `proposalState = 'approved'` → green "Approved" badge appears on Living Spec header → **Build & Deploy** button unlocks.
4. **Decline** → `proposalState = 'declined'` → AI says "tell me what to change" → user keeps chatting. If user types anything matching `APPROVAL_KEYWORDS` (looks good / ship it / deploy / ready / approve / lgtm), the proposal is re-issued.
5. **Build & Deploy** → opens a modal with 5 simulated pipeline steps (800–1100 ms each). On completion: project status flips to `deployed`, a green deploy-success message appears in the chat with a generated scope id like `x_my_app`.
6. **Export Specification** → downloads `{ project, spec, exportedAt }` as JSON.
7. Chat header has a **maximize icon** that hides both side panels so chat goes full-width.

## Important design choices (don't undo these without reason)

- **Spec is derived per-project** via `buildSpecFromProject()` — it's not stored on the Project, it's computed from `project.name + description`. Table names are slugified (`x_{slug}_record`, `x_{slug}_activity`).
- **All colors come from CSS vars** in `theme.css` (`--primary`, `--bg-card`, etc). Do not hardcode hex values in components unless matching an existing pattern.
- **Dark mode** uses `.dark` class + `@custom-variant dark (&:where(.dark, .dark *))` in Tailwind v4. Don't use Tailwind's built-in `dark:` without verifying this is set up first.
- **No comments in components** unless the *why* is non-obvious — the user preference is tight code.
- **Demo data was deliberately cleared** — `mockData.ts` exports empty arrays. The app is supposed to boot to an empty state. Do not re-add sample projects/messages.
- **Phase 1 only** — the AI replies are deterministic scripts, not LLM calls. The "Build & Deploy" pipeline is a `setTimeout` chain, not a real deploy. Do not pretend otherwise to the user.

## What Phase 2 probably looks like

The user has discussed but not committed to:
- FastAPI backend (mirrors the pattern in the user's OverYonder project)
- Persistence: either flat JSON files, SQLite, or Postgres — user asked for recommendations on all three; Postgres + Docker Compose is on the table
- Real LLM wiring for the chat (so replies stop being canned)
- Real Now SDK invocation for Build & Deploy (generating and deploying a scoped app)
- Docker Compose with web + api + db services

Ask the user which path they want before scaffolding Phase 2.

## Conventions observed in the codebase

- Component files use **named exports** (`export function Foo(...)`), not default exports (except `App`).
- Props interfaces defined inline right above the component.
- Button variants go through the `Button` component, never raw `<button>` with utility classes (except for icon-only sidebar buttons where custom styling was intentional).
- `lucide-react` icons at `w-4 h-4` for inline, `w-5 h-5` for headers.
- Animations defined in `theme.css` (`fadeIn`, `slideDown`, `scaleIn`, `bounce`, `spin`, `pulseDot`) and referenced via `animate-[keyframe_duration_easing]` classes.

## Gotchas

- The parent folder has a **space** in its path (`servicenow sdk`). Always wrap paths in quotes in shell commands.
- Favicon is `public/favicon.svg` (transparent background, orange bullseye). Browsers cache favicons aggressively — hard-refresh (Cmd+Shift+R) if the user reports it still showing the old one.
- The **New Idea modal** uses a different state object from the **Edit modal** (`newIdeaName` vs `editName`) — don't consolidate without thinking about the UX flow.
- There are `tsconfig.app.tsbuildinfo` and `tsconfig.node.tsbuildinfo` files that are tsc's incremental cache. Safe to ignore or delete; they regenerate.

Good luck. Ask the user questions before making structural changes.
