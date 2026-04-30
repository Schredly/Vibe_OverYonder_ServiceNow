# Cluckworks "Meet the Flock" — Figma Make Prompt

This file is the input prompt for Figma Make. The output Figma file will be ported into the Cluckworks scoped app (`x_1939459_cluck`) as a Service Portal widget at `/sp?id=cluck&page=hens`.

The prompt is shaped for **portability into a ServiceNow Service Portal widget** (Path A in `vibe_now/documentation/vibe_overyonder.md` §6). Constraints below are not stylistic preferences — they are technical requirements for clean translation into HTML / SCSS / AngularJS templates.

---

## Figma Make Prompt

```
Design a single web page called "Meet the Flock" for Cluckworks, a small pastured-poultry farm.
The page lets visitors browse adoptable hens and sponsor one. The visual mood is warm,
hand-crafted, modern-rustic — think small-batch farm, not corporate ag.

PAGE STRUCTURE (in order, top to bottom):

1. Header strip
   - Cluckworks wordmark on the left
   - Right-aligned nav links: "Today's Basket", "Meet the Flock" (current), "CSA", "Visit"
   - Sticky on scroll

2. Hero section
   - H1: "Meet the Flock"
   - Sub-headline: "Sponsor a hen, get monthly photo updates, and know exactly where your eggs come from."
   - A small stat row underneath: "8 hens currently adoptable · Updated daily"

3. Filter bar (single row)
   - A search input ("Search by name…")
   - Three pill toggles: "All Breeds", "Heritage", "Layers"
   - A sort dropdown: "Newest first" / "By name"

4. Hen grid (the core component to design carefully)
   - Responsive grid, 3 columns on desktop, 2 on tablet, 1 on mobile
   - Each card contains:
     • A square photo of the hen at the top
     • A small breed pill ("Buff Orpington", "Australorp", etc.)
     • Hen name as the card title (e.g., "Henrietta", "Cluckzilla", "Bluebell")
     • A 2-3 line bio
     • A small metadata row: hatched date, coop name
     • A primary "Adopt {name}" button
     • A subtle "♥ Save" icon-button in the top-right corner of the card
   - Design 6 hen cards with distinct names and bios so the variety is obvious

5. Footer band
   - Three columns: About, Contact, Newsletter signup
   - Copyright line

DESIGN SYSTEM REQUIREMENTS (these matter for portability):

- Use Figma Variables (not just local styles) for all colors, typography, spacing, and radii.
  Group them: color/, font/, space/, radius/, shadow/.
- Color palette: warm cream background, off-white card surfaces, terracotta accent for
  primary actions, deep brown for body text, soft sage as a secondary accent. Provide
  AA-contrast text colors.
- Typography: a serif display face for headings (Fraunces or similar), a humanist sans
  for body (Inter or similar). Define h1, h2, h3, body, caption, button text.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Radii: card 16, pill 999, input 8, button 12.
- One subtle card shadow token.
- ALL containers must use auto-layout. No absolute positioning.
- Make the hen card a Component with variants: Default / Hovered / Saved / Sponsored.
  The Sponsored variant overlays a "Sponsored by Maya R." chip on the photo and replaces
  the Adopt button with a "Send a thank-you" link.
- Make the breed pill, the primary button, and the icon-button their own components.

CONSTRAINTS — DO NOT INCLUDE:

- No hero video, parallax, or animation requirements.
- No carousel or auto-rotating elements.
- No nested cards-inside-cards.
- No iconography that requires a paid icon set; use simple line icons or system shapes.
- No dark mode variant in this pass — only the default warm-light palette.

DELIVERABLE:

A single desktop frame (1440 wide), a tablet frame (834 wide), and a mobile frame (390 wide),
all using the same Variables and the same hen-card Component. Include a small "Tokens"
page in the file showing the color, typography, spacing, and radius variables.
```

---

## Why the prompt is shaped this way

| Choice | Reason |
|--------|--------|
| Auto-layout required | Auto-layout becomes flex/grid in generated SCSS. Absolute-positioned designs don't translate cleanly. |
| Variables, not local styles | Only Figma Variables are exposed via the `/v1/files/:key/variables/local` API endpoint used by the Tier-3 token extractor. |
| Components with variants | Variants become AngularJS template branches (e.g. `ng-if="hen.sponsored"`). Loose stylings would force the generator to guess. |
| Explicit `do not include` list | Forbids the patterns that would force vision-only fallback (motion, parallax, deep nesting). |
| Three breakpoints (1440 / 834 / 390) | Gives the generator real responsive targets instead of inventing breakpoints. |
| Tokens page in file | Lets us visually diff Figma's tokens against the generated `_tokens.scss` after extraction. |

---

## Target output of the porting pipeline

When the Figma file is ready, the manual end-to-end pass produces these four files in `src/fluent/portal/`:

- `meet-the-flock-widget.scss` — token layer + layout (extracted from Figma Variables + auto-layout)
- `meet-the-flock-widget.html` — AngularJS template using `ng-repeat` / `ng-click` / `ng-if`
- `meet-the-flock-widget.server.js` — `GlideRecord` query against `x_1939459_cluck_bird` (filter: `is_adoptable=true^adoption_sponsorISEMPTY^status=active`)
- `meet-the-flock-widget.now.ts` — Fluent record registering the widget

Existing widget at this path will be **rewritten**, not appended to.

Backend bindings (no changes needed):
- Table: `x_1939459_cluck_bird`
- Adopt action: navigate to Adopt-a-Hen catalog item with `bird` parameter
- 8 seed hens already in place — General Tso (rooster) is non-adoptable so the grid will show 7 by default.

Deploy after porting:
```bash
cd "/Users/groovingtothemusic/servicenow sdk/sdk-examples/cluck-sample"
pnpm exec now-sdk build
pnpm exec now-sdk install
```

Live at: `https://dev378814.service-now.com/sp?id=cluck&page=hens`

---

## What to send back after Figma Make finishes

To run the manual port pass, share:

1. **Figma share URL** of the file (view access at minimum).
2. **Figma personal access token** if Tier-3 extraction via the Figma REST API is desired (otherwise we fall back to Tier-2 via exported PNGs of each frame).
3. **Confirmation** that the Tokens page exists and uses Figma Variables (not just local styles).

If Figma Make returns something that doesn't meet the design-system requirements above (e.g. uses local styles instead of Variables, or non-auto-layout containers), iterate the prompt before porting — it's much cheaper to fix the Figma than to fight the generator.
