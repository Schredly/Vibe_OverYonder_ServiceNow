# Cluckworks "Today's Basket" — Figma Make Prompt

This is the Figma Make prompt for the second Cluckworks page. The output is ported into the same Cluckworks scoped app (`x_1939459_cluck`) as a Service Portal widget reachable at `/cluck?id=cluck_basket`. It uses the same toolchain and brand language as `meet-the-flock-widget` — see `cluck.md` for the established design system.

The prompt is shaped for **portability into a Service Portal widget** (Path A in `vibe_now/documentation/vibe_overyonder.md` §6) and reuses the warm-cream + terracotta + Fraunces/Inter palette from the proven "Meet the Flock" port.

---

## Backend data this widget binds to

The existing `todays-basket-widget.server.js` already exposes the following live values from the `x_1939459_cluck_egg_log` table aggregated for today's date. The Figma design must accommodate all of them so the port is a 1:1 binding.

| Backend field | Type | What it means |
|---------------|------|---------------|
| `data.as_of` | string | Display-formatted timestamp (e.g. `"2026-04-24 21:32:18"`) |
| `data.date` | string | Today's date in `yyyy-MM-dd` |
| `data.total` | number | Total eggs collected today (all grades) |
| `data.cracked` | number | Eggs cracked / unsellable |
| `data.sellable` | number | `total - cracked` |
| `data.dozens` | number | `floor(sellable / 12)` — the headline number |
| `data.grades.jumbo` | number | Per-grade counts |
| `data.grades.xlarge` | number | |
| `data.grades.large` | number | |
| `data.grades.medium` | number | |
| `data.grades.small` | number | |
| `data.grades.doubleYolk` | number | "Double yolk" — a marketing-friendly novelty count |
| `data.happy_hens` | number | Sum of `current_count` across active flocks |

---

## Figma Make Prompt

```
Design a single web page called "Today's Basket" for Cluckworks, a small pastured-poultry farm.
Visitors land here to see what fresh eggs are available right now and to start a CSA subscription.
The visual mood matches the existing Cluckworks "Meet the Flock" page — warm, hand-crafted,
modern-rustic, with a serif display face and a humanist sans for body. Same palette: warm cream
background, off-white card surfaces, terracotta primary, sage secondary, deep brown text.

PAGE STRUCTURE (in order, top to bottom):

1. Header strip (REUSE the same header design as "Meet the Flock")
   - Cluckworks wordmark on the left
   - Right-aligned nav links: "Today's Basket" (current), "Meet the Flock", "CSA", "Visit"
   - Sticky on scroll

2. Hero section — the "fresh count" centerpiece
   - Eyebrow text: "Collected this morning"
   - Massive headline number: a placeholder "12 dozen" — this will bind to backend data.dozens.
     Treat it as the visual anchor of the page; oversized serif, terracotta accent.
   - Sub-headline: "Available right now from the coop. First come, first cracked."
   - A small "as of {timestamp}" line in muted text underneath. Use a freshness dot indicator
     (a small filled circle in sage) to signal "live data".

3. Stats strip — three side-by-side metric tiles (cards in a row, equal width)
   - Tile 1: "Total eggs today" (number) with sub-label "across all grades"
   - Tile 2: "Sellable" (number) with sub-label "after culling cracked"
   - Tile 3: "Happy hens" (number) with sub-label "currently in the flock"
   - Each tile: card surface, soft shadow, big number in serif, label in body sans.

4. Grade breakdown section
   - Section heading: "By grade"
   - Six grade cards in a responsive grid (3-up desktop, 2-up tablet, 1-up mobile):
     • Jumbo
     • Extra Large
     • Large
     • Medium
     • Small
     • Double Yolk (call this out visually — small "novelty" badge or asterisk treatment;
       this is a fun differentiator, not just another size)
   - Each card: an egg illustration or icon at the top, the grade name, the count number,
     and a thin progress-bar element showing the share of today's total.
   - The Double Yolk card should use a slightly different accent (sage instead of terracotta)
     to telegraph it's special.

5. CSA call-to-action band (full-width strip)
   - Headline: "Want a dozen every week?"
   - Sub-copy: "Subscribe to our CSA and we'll set aside the freshest eggs from each
     morning's collection."
   - Single primary button: "Start a Subscription"
   - Right side: a small illustration or photo of a basket of eggs (or an empty placeholder
     div if no asset is available).

6. Footer band (REUSE the same footer design as "Meet the Flock")
   - Three columns: About, Contact, Newsletter signup
   - Copyright line

DESIGN SYSTEM REQUIREMENTS (these matter for portability — match Meet the Flock):

- Use Figma Variables (not just local styles) for all colors, typography, spacing, and radii.
  Same groups as Meet the Flock: color/, font/, space/, radius/, shadow/.
- Same warm-cream / terracotta / sage / deep-brown palette. Do not introduce new hues.
- Typography: serif display (Fraunces) for headings and the headline number, humanist sans
  (Inter) for body. Define h1, h2, h3, body, caption, button text, and a NEW token
  "display-xxl" for the headline dozens count (~6rem, tabular-nums).
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Radii: card 16, pill 999, input 8, button 12.
- One subtle card shadow token (same as Meet the Flock).
- ALL containers use auto-layout. No absolute positioning.
- Make the metric tile a Component with no variants.
- Make the grade card a Component with two variants: Default and Novelty (for Double Yolk).
- Reuse the primary button component from Meet the Flock if possible.

CONSTRAINTS — DO NOT INCLUDE:

- No hero video, parallax, or animation requirements.
- No carousel, marquee, or auto-rotating elements.
- No nested cards-inside-cards (a metric tile inside a section header band is fine; a tile
  containing another tile is not).
- No iconography that requires a paid icon set; use simple line icons or geometric shapes.
- No dark mode variant in this pass.
- No login/account UI — this is a public marketing page that reads from the egg log.

DELIVERABLE:

A single desktop frame (1440 wide), a tablet frame (834 wide), and a mobile frame (390 wide),
all using the same Variables and the same metric-tile / grade-card components. Include the
Tokens page or merge with the Meet the Flock token page if both pages live in the same file.
```

---

## Why this prompt is shaped this way

| Choice | Reason |
|--------|--------|
| Reuse Meet the Flock header/footer/palette | The two pages live in the same portal — visual continuity is critical. The generator should produce a consistent token layer instead of inventing a new one. |
| Headline number is the visual anchor | This is a marketing splash, not a dashboard. The "12 dozen available" line is the emotional hook; everything else is supporting context. |
| Six grade cards with the Double Yolk standout | Maps 1:1 to the six counts already exposed in `data.grades`. The Novelty variant makes the rare double-yolk count fun rather than just "another grade." |
| `display-xxl` token | The current Meet the Flock token set tops out around 3.75rem for h1. The Today's Basket headline needs to be larger. Adding it as a new token (rather than inline) keeps the design-system ethos consistent. |
| `tabular-nums` for the headline | When the number changes daily (or live), tabular figures prevent layout reflow. |
| Same auto-layout / Variables / no-nested-cards constraints as Meet the Flock | Same generator predictability. |

---

## Target output of the porting pipeline

When the Figma file is ready, the manual port produces these widget files in `src/fluent/portal/`:

- `todays-basket-widget.scss` — token layer extended with `display-xxl`; section styles for hero + stats strip + grade grid + CSA band.
- `todays-basket-widget.html` — AngularJS template binding all 13 backend fields.
- `todays-basket-widget.server.js` — keep as-is unless the design surfaces fields not currently exposed (e.g. if the Figma adds a "biggest single collection" stat, extend the server).
- `todays-basket-widget.client.js` — minimal controller; this page is mostly presentational so probably just a no-op or a simple "subscribe" deep-link function.
- `todays-basket-widget.now.ts` — Fluent record with `clientScript` referenced.

Plus a 5-record page-layout cluster in `cluck-basket-page.now.ts`:

- `sp_page` (id: `cluck_basket`, title: "Today's Basket")
- `sp_container` (width: `container-fluid`)
- `sp_row`
- `sp_column` (size: 12)
- `sp_instance` referencing `widget_todays_basket`

The `sp_portal` record stays unchanged — `homepage` continues to point at `cluck_flock`; this page is reached via `/cluck?id=cluck_basket` and via the header nav link.

Deploy after porting:
```bash
cd "/Users/groovingtothemusic/servicenow sdk/sdk-examples/cluck-sample"
pnpm exec now-sdk build
pnpm exec now-sdk install
```

Live at: `https://dev378814.service-now.com/cluck?id=cluck_basket`

---

## What to send back after Figma Make finishes

1. The Figma share URL (or the zipped React/Tailwind output, as with Meet the Flock).
2. Confirmation that the Variables + auto-layout requirements were honored.
3. If multiple Figma Make attempts were needed, send all of them — the Meet the Flock port found that one of three attempts honored the prompt and the other two went off-track. Same expectation here.
