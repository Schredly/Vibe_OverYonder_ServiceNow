// Walk the IR from M2 and emit a single AngularJS-compatible HTML template.
//
// Inputs:
//   - IrProject (from figma-source/ir.json)
//   - Compiled CSS (from M3, only the user's :root tokens / class lookups)
// Output:
//   - widget.html — plain HTML with AngularJS directives. The widget that
//     M5 ships pairs this with the M3 compiled CSS as customCss.
//
// Translation rules (the meaty part):
//   - className → class
//   - {expr} text → {{ expr }}
//   - cond && X → ng-if="cond"
//   - cond ? a : b → two siblings, second with ng-if="!cond"
//   - arr.map((x, i) => …) → ng-repeat="x in arr"
//   - <Header/> (local component) → inline-expand the body with prop substitution
//   - <Search/> (lucide) → inline SVG from registry
//   - <Button/> (shadcn) → minimal HTML shim
//   - onClick={fn} → ng-click="fn()"  (interactive behavior is v2 polish)
//   - style={{...}} → ng-style="{...}" (pass-through; AngularJS evaluates)
//
// Identifier rewriting is intentionally minimal in this pass: bare identifiers
// referring to a parent's prop get substituted at inline-expand time. Everything
// else passes through. M5 will wire `data.*` for runtime values.

import type {
  IrAttr,
  IrComponent,
  IrFor,
  IrFragment,
  IrIf,
  IrModule,
  IrNode,
  IrProject,
} from './types.js';
import { renderLucideIcon, isKnownLucideIcon } from './lucideIcons.js';
import { getShadcnShim, isShadcnComponent } from './shadcnShims.js';
import { getReactRouterStrategy } from './reactRouterStubs.js';

// HTML attribute names that don't follow the camelCase → kebab-case mapping
// React uses for everything else. (React turns `tabindex` into `tabIndex`,
// `htmlFor` into `for`, etc. We reverse those at emit time.)
const REACT_TO_HTML_ATTR: Record<string, string> = {
  className: 'class',
  htmlFor: 'for',
  tabIndex: 'tabindex',
  readOnly: 'readonly',
  contentEditable: 'contenteditable',
  spellCheck: 'spellcheck',
  autoComplete: 'autocomplete',
  autoFocus: 'autofocus',
  maxLength: 'maxlength',
  minLength: 'minlength',
  rowSpan: 'rowspan',
  colSpan: 'colspan',
  noValidate: 'novalidate',
  acceptCharset: 'accept-charset',
  crossOrigin: 'crossorigin',
};

function htmlAttrName(reactName: string): string {
  if (REACT_TO_HTML_ATTR[reactName]) return REACT_TO_HTML_ATTR[reactName];
  if (reactName.startsWith('aria') && reactName !== 'aria') {
    // ariaLabel → aria-label, ariaLabelledby → aria-labelledby
    return reactName.replace(/^aria([A-Z])/, (_, c: string) => `aria-${c.toLowerCase()}`).replace(/([A-Z])/g, (_, c: string) => `-${c.toLowerCase()}`);
  }
  if (reactName.startsWith('data') && reactName !== 'data') {
    return reactName.replace(/([A-Z])/g, (_, c: string) => `-${c.toLowerCase()}`);
  }
  return reactName;
}

// HTML void elements — emit `<foo />` without a closing tag.
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c]);
}

function escapeAttr(s: string): string {
  return s.replace(/[&"]/g, (c) => HTML_ESCAPE[c]);
}

// React onClick handler attribute → AngularJS ng-click directive name.
// React event handlers → AngularJS directives. **Critical**: do not map
// onChange/onInput to ng-change. AngularJS's ng-change directive
// `require`s a sibling ng-model on the same element; without it the
// `$compile:ctreq` error fires and AngularJS halts compilation of the
// ENTIRE subtree, leaving large parts of the page unbound (i.e. blank).
// The Figma Make output has many <input onChange={…}> elements that
// don't carry an explicit `value` (the prop comes through props.value
// from a parent), so we can't reliably auto-pair an ng-model. Park the
// handler on a data-* instead — the deployed widget's clientScript can
// wire it up later if/when we add real two-way binding.
const EVENT_TO_NG: Record<string, string> = {
  onClick: 'ng-click',
  onChange: 'data-on-change',
  onInput: 'data-on-input',
  onSubmit: 'ng-submit',
  onFocus: 'ng-focus',
  onBlur: 'ng-blur',
  onMouseEnter: 'ng-mouseenter',
  onMouseLeave: 'ng-mouseleave',
  onKeyDown: 'ng-keydown',
  onKeyUp: 'ng-keyup',
};

// Substitution context — used when inline-expanding a local component. Maps
// the callee's prop name to the caller's IrAttr value (string / expression /
// event handler). The prop substituter walks the inlined body and rewrites
// IrExpr nodes whose expression matches a prop name.
interface PropSubst {
  [propName: string]: IrAttr;
}

interface EmitContext {
  project: IrProject;
  /** Stack of active prop-substitution maps as we inline-expand. */
  substStack: PropSubst[];
  warnings: string[];
}

// Resolve an IrExpr's expression source against the substitution stack. If
// the expression is a bare identifier matching a prop, return the prop's
// attr value. Otherwise return undefined and the caller emits the original.
//
// Recurses through transitive prop forwarding: when component A inlines B
// with `<B foo={foo}/>`, the inner `foo` resolves to A's `foo`; we keep
// walking deeper frames so we land on whatever A's caller passed for `foo`.
// Without this, `<App><PortalLayout onNavigate={setViewMode}>
// <Sidebar onNavigate={onNavigate}/></PortalLayout></App>` resolves the
// Sidebar's `onNavigate` only one hop and stops at PortalLayout's prop
// name — never reaching `setViewMode` at the top.
//
// Forwarded callback props show up as `kind: 'event'` (because parseTsx
// classifies any `on*` JSX attribute as an event), so we must also walk
// through event-kind values whose handler is just a bare identifier.
function resolveBareIdentifier(expr: string, ctx: EmitContext): IrAttr | undefined {
  const trimmed = expr.trim();
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) return undefined;
  let target = trimmed;
  let lastResolved: IrAttr | undefined;
  for (let i = ctx.substStack.length - 1; i >= 0; i -= 1) {
    const subst = ctx.substStack[i];
    if (!Object.prototype.hasOwnProperty.call(subst, target)) continue;
    const value = subst[target];
    lastResolved = value;
    let nextSrc: string | undefined;
    if (value.kind === 'expression') nextSrc = value.expression;
    else if (value.kind === 'event') nextSrc = value.handler;
    else return value; // string / spread — concrete, done
    const next = nextSrc.trim();
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(next)) return value;
    // Bare-identifier forwarding. Keep walking; if `next === target` we still
    // walk so transitive same-name forwarding resolves to the outermost
    // concrete binding.
    target = next;
  }
  return lastResolved;
}

// Look up a local component definition from the project by name. Searches
// all modules — components live in distinct files in Figma Make output.
function findLocalComponent(
  name: string,
  project: IrProject,
): { module: IrModule; component: IrComponent } | undefined {
  for (const m of project.modules) {
    const c = m.components.find((c) => c.name === name);
    if (c) return { module: m, component: c };
  }
  return undefined;
}

// Convert a JSX onClick/onSubmit/etc. handler into an AngularJS-evaluable
// expression. Handles the four shapes Figma Make output produces:
//
//   1. Bare identifier:  `handleClick`         → `handleClick()`
//   2. Member access:    `obj.method`          → `obj.method()`
//   3. Inline expr arrow:`() => doX(x)`        → `doX(x)`
//   4. Inline block arrow:                     → `S1; S2`
//        `() => { onNavigate?.(v); close?.(); }`
//   5. Parameterized arrow (e.g. event handlers receiving `e`):
//        `(e) => e.stopPropagation()`          → keep as-is on data-* event
//          (we can't evaluate without an event arg, but the user can wire
//          it up server-side later — at minimum it's preserved). For the
//          AngularJS-mapped events we only emit when there's no parameter.
//
// AngularJS 1.5+ accepts `;`-separated statements in expressions, so the
// block-body case becomes a sequence of calls evaluated in order. Optional
// chaining (`?.`) is supported in 1.6+ and we ship 1.8, so it survives
// untouched.
function unwrapHandler(rawHandler: string): string {
  let handler = rawHandler.trim();

  // Strip the outer arrow ` () => …` or ` (e) => …`. We only unwrap when the
  // arrow takes zero parameters — handlers that need the event object can't
  // be lifted into AngularJS expression syntax (no event in scope) and are
  // better left raw so a custom directive can pick them up later.
  const zeroArgArrow = handler.match(/^\(\s*\)\s*=>\s*([\s\S]+)$/);
  if (zeroArgArrow) handler = zeroArgArrow[1].trim();

  // Block body: `{ S1; S2; ... }` → `S1; S2; ...`. Statements are already
  // semicolon-separated by the source generator. Strip a trailing semicolon
  // for tidiness.
  if (handler.startsWith('{') && handler.endsWith('}')) {
    handler = handler.slice(1, -1).trim();
    handler = handler.replace(/;\s*$/, '');
  }

  // After unwrapping, if the result is still a bare identifier or a
  // member-access chain (no call), wrap it in a function call form.
  // AngularJS treats `foo` as a property read, not an invocation.
  if (/^[a-zA-Z_$][\w.$]*$/.test(handler)) handler = `${handler}()`;

  return handler;
}

// Lexical substitution of bare-identifier prop refs inside an event
// handler body or any AngularJS expression. We need this because event
// handlers like `onNavigate?.(item.view); onMobileClose?.()` contain
// prop-name references (`onNavigate`, `onMobileClose`) that need to
// resolve to the caller's bindings (`setViewMode`, `setMobileSidebarOpen`)
// — but the resolver runs only on full attr values, not on identifiers
// embedded in larger expressions.
//
// Approach: scan for word-boundary identifier tokens that aren't
// preceded by `.` (member access), `?` (optional chain selector), or a
// digit/identifier char (in which case the regex itself wouldn't match).
// For each candidate, look up via resolveBareIdentifier and substitute
// the resolved expression source. JS keywords and known scope helpers
// pass through.
const HANDLER_KEYWORDS = new Set([
  'true','false','null','undefined','this','new','return','if','else','for',
  'while','var','let','const','function','class','in','typeof','void','delete',
  'throw','try','catch','finally','switch','case','break','continue','do','with',
  'debugger','async','await','of',
]);
function substituteIdentifiersInExpr(source: string, ctx: EmitContext): string {
  if (ctx.substStack.length === 0) return source;
  return source.replace(
    /(^|[^\w$.?])([a-zA-Z_$][\w$]*)/g,
    (whole, lead, ident) => {
      if (HANDLER_KEYWORDS.has(ident)) return whole;
      const resolved = resolveBareIdentifier(ident, ctx);
      if (!resolved) return whole;
      if (resolved.kind === 'expression') return lead + resolved.expression;
      if (resolved.kind === 'string') return lead + JSON.stringify(resolved.value);
      if (resolved.kind === 'event') {
        // The bare identifier appears as `propName?.()` / `propName(args)`
        // in the surrounding handler. If the resolved value is a zero-arg
        // arrow `() => EXPR`, splice in just EXPR — the surrounding `?.()`
        // then short-circuits on EXPR's return value (typically undefined),
        // so the side-effect fires once and AngularJS doesn't choke on
        // arrow syntax (which it can't parse).
        const arrow = resolved.handler.match(/^\(\s*\)\s*=>\s*([\s\S]+)$/);
        return lead + (arrow ? arrow[1].trim() : resolved.handler);
      }
      return whole;
    },
  );
}

// --- Attribute emission -----------------------------------------------------

function emitAttr(attr: IrAttr, ctx: EmitContext): string {
  if (attr.kind === 'spread') {
    // Spread props don't translate cleanly. Emit as a comment marker so the
    // generated HTML stays valid and the lost info is findable in dev.
    return ` <!-- spread:${escapeAttr(attr.expression)} -->`;
  }
  if (attr.kind === 'event') {
    const ngName = EVENT_TO_NG[attr.name] ?? `data-event-${attr.name.toLowerCase()}`;
    let handler = unwrapHandler(attr.handler);
    handler = substituteIdentifiersInExpr(handler, ctx);
    return ` ${ngName}="${escapeAttr(handler)}"`;
  }
  // String value — direct pass-through with HTML escaping.
  if (attr.kind === 'string') {
    const name = htmlAttrName(attr.name);
    let value = attr.value;
    // Service Portal SDK lint (TS213) rejects href="#"; rewrite to a
    // no-op JS scheme. Same rule that bit Cluckworks on 2026-04-24.
    if (name === 'href' && value === '#') value = 'javascript:void(0)';
    return ` ${name}="${escapeAttr(value)}"`;
  }
  // Expression value
  if (attr.kind === 'expression') {
    const name = htmlAttrName(attr.name);
    // Special-case `style={{...}}` — pass the object source through to AngularJS.
    if (name === 'style') {
      // If the expression is a literal object, pass to ng-style; otherwise
      // emit as ng-style too (AngularJS will eval).
      return ` ng-style="${escapeAttr(attr.expression)}"`;
    }
    // If this expression is a bare-identifier prop reference, substitute now.
    const sub = resolveBareIdentifier(attr.expression, ctx);
    if (sub) {
      if (sub.kind === 'string') {
        return ` ${name}="${escapeAttr(sub.value)}"`;
      }
      if (sub.kind === 'expression') {
        if (isAngularSafeExpression(sub.expression)) {
          return ` ${name}="{{ ${sub.expression} }}"`;
        }
        return ` data-${name}-jsx="${escapeAttr(snippet(sub.expression))}"`;
      }
      if (sub.kind === 'event') {
        // Substituting an expression-valued slot with an event handler is
        // unusual; punt and pass through as data-attribute.
        return ` data-substituted-event="${escapeAttr(sub.handler)}"`;
      }
    }
    if (isAngularSafeExpression(attr.expression)) {
      return ` ${name}="{{ ${attr.expression} }}"`;
    }
    // Template-literal attr — convert `` `static ${expr} static` `` into
    // AngularJS class-interpolation `class="static {{ expr }} static"`.
    // This is the workhorse case: every Figma Make export uses dynamic
    // className strings (Tailwind classes flipped on isCollapsed,
    // isActive, isMobileOpen, etc.). Without this conversion, every
    // such element loses its `class` attr entirely and the layout
    // collapses to a styleless skeleton.
    const interpolated = templateLiteralToInterpolation(attr.expression);
    if (interpolated !== null) {
      return ` ${name}="${escapeAttr(interpolated)}"`;
    }
    // JSX-literal / non-AngularJS expression. Emitting it as `{{...}}` would
    // leave AngularJS unable to evaluate it and render the raw braces as
    // text. Stash on a data-attribute instead so the dev-time warning
    // surface picks it up while the rendered HTML stays clean.
    return ` data-${name}-jsx="${escapeAttr(snippet(attr.expression))}"`;
  }
  return '';
}

// Convert a JS template-literal source like `` `flex-1 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}` ``
// to an AngularJS interpolation string like `flex-1 {{ isCollapsed ? 'lg:ml-20' : 'lg:ml-64' }}`.
// Returns null when the input isn't a template literal or contains a
// nested template literal we can't safely inline (rare; falls back to
// the data-* attribute path).
//
// Why this is the right shape: AngularJS's `class="..."` attribute
// supports embedded `{{ }}` expressions natively — they re-evaluate when
// scope changes, which is exactly the React-template-literal semantic.
function templateLiteralToInterpolation(source: string): string | null {
  const s = source.trim();
  if (!s.startsWith('`') || !s.endsWith('`') || s.length < 2) return null;
  const inner = s.slice(1, -1);
  let out = '';
  let i = 0;
  while (i < inner.length) {
    const ch = inner[i];
    if (ch === '\\' && i + 1 < inner.length) {
      // Template-literal escape — collapse `\\``→``, `\\$`→`$`, `\\\\`→`\\`.
      const next = inner[i + 1];
      out += next === '`' || next === '$' || next === '\\' ? next : ch + next;
      i += 2;
      continue;
    }
    if (ch === '$' && inner[i + 1] === '{') {
      // Find matching `}`, tracking brace depth so `${a ? {x:1} : null}` works.
      let depth = 1;
      let j = i + 2;
      while (j < inner.length && depth > 0) {
        const cj = inner[j];
        if (cj === '{') depth++;
        else if (cj === '}') depth--;
        if (depth > 0) j++;
      }
      if (depth !== 0) return null;
      const expr = inner.slice(i + 2, j).trim();
      // Nested template literal inside the expression — punt. Could be
      // handled recursively but the cases that matter (Tailwind class
      // toggling) never nest in practice.
      if (expr.includes('`')) return null;
      // The expression must be safely AngularJS-evaluable. Reject ones
      // with raw JSX (`<Foo`) just like isAngularSafeExpression does.
      if (/<[A-Za-z]|<\/|<>/.test(expr)) return null;
      // Collapse internal whitespace so the resulting class string is
      // tidy and so inline arrows like `() => x` render predictably.
      const flat = expr.replace(/\s+/g, ' ');
      out += `{{ ${flat} }}`;
      i = j + 1;
      continue;
    }
    out += ch;
    i++;
  }
  // Collapse runs of whitespace introduced by source-level newlines in
  // the template literal — the original CSS-class-list semantic doesn't
  // care, and tidy HTML helps inspecting in DevTools.
  return out.replace(/\s+/g, ' ').trim();
}

// "AngularJS-safe" = expression contains no JSX (`<` outside of comparisons)
// or template-literal back-ticks. Conservative heuristic — false positives
// only mean a value gets parked on `data-*` instead of interpolated, which
// is far better than rendering literal `{{ <Home /> }}` text.
function isAngularSafeExpression(expr: string): boolean {
  const trimmed = expr.trim();
  if (trimmed.length === 0) return false;
  // Any JSX literal — `<Foo` or `</Foo>` or `<>` — is out.
  if (/<[A-Za-z]|<\/|<>/.test(trimmed)) return false;
  // Template literals with embedded JS land back in trouble for AngularJS
  // — punt them to data-* too.
  if (trimmed.includes('`')) return false;
  return true;
}

// Truncate long expressions when stashing them on a data-* attribute so the
// HTML doesn't balloon. The full source is still available in the IR if a
// developer needs it.
function snippet(expr: string, max: number = 80): string {
  const flat = expr.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : flat.slice(0, max - 1) + '…';
}

// Some expression-type attributes need to be hoisted to AngularJS-specific
// directives. e.g. for `<input value={state}/>` we want `ng-model` if there's
// also an onChange, otherwise just a one-way bind via `value="{{state}}"`.
// For v1 we just pass everything through as `name="{{expr}}"` — fine for
// static rendering, behavior comes back in v2.

// --- Node emission ----------------------------------------------------------

export interface EmitResult {
  html: string;
  warnings: string[];
}

export function emitProject(project: IrProject): EmitResult {
  const ctx: EmitContext = {
    project,
    substStack: [],
    warnings: [],
  };
  if (!project.rootComponent) {
    return { html: '<!-- no root component found -->', warnings: ['no root component'] };
  }
  const root = findLocalComponent(project.rootComponent.component, project);
  if (!root) {
    return {
      html: `<!-- root component ${project.rootComponent.component} not found -->`,
      warnings: [`root component "${project.rootComponent.component}" not found`],
    };
  }
  const body = emitNodes(root.component.body, ctx);

  // Note: scope seeding does NOT happen via an `ng-init` here. AngularJS's
  // expression parser is a strict subset of JavaScript that can't evaluate
  // `new Date(...)`, regex literals, function calls with `function`/`async`,
  // bitwise ops, etc. — and the seeds we extract from React source
  // routinely contain `new Date(Date.now() - …).toISOString()` in mock
  // data. A single bad token in `ng-init` makes $parse throw, which
  // halts compilation of the subtree and leaves the entire scope
  // unbound. We saw this concretely on 2026-05-07 with the FraudSight
  // export: `viewMode='dashboard'` was a few characters away from
  // `new Date(...)` in the same ng-init, so the dashboard branch
  // never rendered even though viewMode would have evaluated cleanly
  // on its own.
  //
  // Both real seeding paths use real JavaScript where `new Date()` is fine:
  //   - Preview iframe: VibeCtrl controller does `Object.assign($scope, SEEDS)`
  //     in `routes/figma.ts#buildPreviewBundle`.
  //   - Deployed Service Portal: the widget's clientScript assigns
  //     `$scope.<name>` directly (see fluentGen's figmaWidgetClient).
  // Both consume `extractScopeSeeds(project)`, so the seed list is
  // identical between contexts; only the *evaluation runtime* differs.

  // Wrap in a single root container so AngularJS has one element to bind.
  const html = `<div class="vibe-figma-root">\n${body}\n</div>\n`;
  return { html, warnings: ctx.warnings };
}

// Walk every module/component and produce a list of {name, expr} pairs
// for scope seeding. useState wins over literal bindings (React rule).
// Skips entries whose source snippet contains JSX or template literals —
// AngularJS expressions can't parse those, so we leave them out rather
// than break the entire seed evaluation.
//
// Exported because both the M4 emit (ng-init for the local preview) AND
// fluentGen (client.js controller for the deployed widget) need to seed
// the same names. Service Portal's widget directive isolates scope in a
// way that an ng-init in the template doesn't reach where {{x}} resolves
// from — only assigning $scope.x in the widget's clientScript reliably
// lands the value on the right scope. Both consumers route through here.
export interface ScopeSeed {
  name: string;
  expr: string;
}

export function extractScopeSeeds(project: IrProject): ScopeSeed[] {
  const map = new Map<string, string>();

  // Pass 1: top-level literals (module scope) and per-component literal
  // bindings. Push order matches what the body actually references at
  // render time when not shadowed.
  for (const mod of project.modules) {
    for (const lit of mod.topLevelLiterals ?? []) {
      if (isAngularSafeSeed(lit.sourceSnippet)) map.set(lit.name, lit.sourceSnippet);
    }
    for (const c of mod.components) {
      for (const lit of c.literalBindings ?? []) {
        if (isAngularSafeSeed(lit.sourceSnippet)) map.set(lit.name, lit.sourceSnippet);
      }
    }
  }
  // Pass 2: useState initials override anything pushed in pass 1.
  for (const mod of project.modules) {
    for (const c of mod.components) {
      for (const u of c.state ?? []) {
        const initial = (u.initial ?? '').trim();
        if (!initial) {
          // useState() with no args → initial is undefined. Seed as null
          // so {{x}} renders empty rather than the literal `{{x}}`.
          map.set(u.name, 'null');
          continue;
        }
        if (isAngularSafeSeed(initial)) map.set(u.name, initial);
        else map.set(u.name, 'null');
      }
    }
  }

  return Array.from(map.entries()).map(([name, expr]) => ({ name, expr }));
}

function buildScopeSeed(project: IrProject): string {
  const seeds = extractScopeSeeds(project);
  if (seeds.length === 0) return '';
  return seeds.map((s) => `${s.name}=${s.expr}`).join('; ');
}

// Conservative gate — AngularJS expressions are a *restricted* subset of
// JavaScript. The whole `ng-init` evaluates atomically: a single bad token
// (`new Date(…)` is the canonical offender, but also `function` decls,
// regex literals, `void`/`typeof`/`instanceof`, the comma operator, bitwise
// ops, etc.) makes AngularJS's $parse throw a syntax error which
// silently abandons EVERY seed in the same ng-init — including the
// innocent ones. That bug surfaces as "the dashboard branch never
// renders because viewMode is undefined" even though viewMode='dashboard'
// is two characters away in the source. Reject anything we can't prove
// AngularJS will accept so a single bad initializer can't poison the
// whole scope.
function isAngularSafeSeed(expr: string): boolean {
  const trimmed = expr.trim();
  if (trimmed.length === 0) return false;
  if (/<[A-Za-z]|<\/|<>/.test(trimmed)) return false;
  if (trimmed.includes('`')) return false;
  // `new Foo(…)` is the most common offender — Date.now()/Math.random()
  // tend to show up in mock-data initializers.
  if (/\bnew\s+[A-Za-z_$]/.test(trimmed)) return false;
  // Reserved JS keywords that AngularJS expressions also reject.
  if (/\b(function|class|throw|delete|void|typeof|instanceof|in|yield|async|await|do|while|for|switch|try|catch|finally|return|var|let|const|debugger|export|import)\b/.test(
    trimmed,
  )) return false;
  // Regex literals — syntactically distinguishable from division because
  // they appear after `=`, `(`, `,`, `[`, etc. We don't try to be precise;
  // just reject anything that looks like /…/flags.
  if (/[=(,\[\s]\/[^/\n*][^\n]*\/[gimsuy]*[\s,)\]]/.test(' ' + trimmed + ' ')) return false;
  // Bitwise operators (& | ^ ~ << >>) and comma-operator are out.
  // Bitwise & is rare enough to reject wholesale; AngularJS DOES support
  // logical && so we have to distinguish: only reject `&` not followed
  // by another `&`, etc.
  if (/[^&]&[^&]|[^|]\|[^|]|\^|~|<<|>>/.test(trimmed)) return false;
  return true;
}

function emitNodes(nodes: IrNode[], ctx: EmitContext): string {
  return nodes.map((n) => emitNode(n, ctx)).join('');
}

function emitNode(node: IrNode, ctx: EmitContext): string {
  switch (node.kind) {
    case 'text':
      return escapeHtml(node.value);
    case 'expr':
      return emitExpr(node.expression, ctx);
    case 'fragment':
      return emitFragment(node, ctx);
    case 'if':
      return emitIf(node, ctx);
    case 'for':
      return emitFor(node, ctx);
    case 'element':
      return emitElement(node, ctx);
    case 'component':
      return emitComponentRef(node, ctx);
    case 'unsupported':
      ctx.warnings.push(`unsupported node: ${node.reason}`);
      return `<!-- unsupported: ${escapeHtml(node.reason)} -->`;
    default:
      return '';
  }
}

function emitExpr(expression: string, ctx: EmitContext): string {
  // If this is a prop reference being inlined, substitute literally:
  //   `{title}` with prop value `"Total eggs"` → text "Total eggs"
  //   `{value}` with prop expression `data.total` → `{{ data.total }}`
  const sub = resolveBareIdentifier(expression, ctx);
  if (sub) {
    if (sub.kind === 'string') return escapeHtml(sub.value);
    if (sub.kind === 'expression') return `{{ ${sub.expression} }}`;
    if (sub.kind === 'event') return ''; // can't render an event handler as text
    if (sub.kind === 'spread') return '';
  }
  return `{{ ${expression} }}`;
}

function emitFragment(node: IrFragment, ctx: EmitContext): string {
  return emitNodes(node.children, ctx);
}

function emitIf(node: IrIf, ctx: EmitContext): string {
  // We need a wrapping element to attach ng-if. If there's exactly one
  // child and it's an element, attach ng-if directly to that element so
  // we don't add an extra layer of nesting. Otherwise wrap in a div.
  //
  // **Why div, not span**: when the conditional content contains block
  // elements (which is true for any non-trivial branch — sidebar +
  // header + main, or the per-screen wrappers in a multi-view App.tsx),
  // a `<span>` host gets auto-closed by the HTML parser the moment it
  // sees the first `<div>/<header>/<main>` child. The ng-if directive
  // then ends up on an empty <span>, the real content becomes a sibling
  // with no conditional, and the entire view structure is silently
  // wrong. A `<div>` is content-model-safe for everything we wrap.
  const thenChildren = node.then;
  const elseChildren = node.else ?? [];
  const renderBranch = (children: IrNode[], ngIfExpr: string): string => {
    if (children.length === 1) {
      const sole = children[0];
      if (sole.kind === 'element') {
        return injectAttrToElement(sole, `ng-if`, ngIfExpr, ctx);
      }
      if (sole.kind === 'component') {
        const inner = emitNode(sole, ctx);
        return `<div ng-if="${escapeAttr(ngIfExpr)}">${inner}</div>`;
      }
    }
    const inner = emitNodes(children, ctx);
    return `<div ng-if="${escapeAttr(ngIfExpr)}">${inner}</div>`;
  };

  let out = renderBranch(thenChildren, node.condition);
  if (elseChildren.length > 0) {
    out += renderBranch(elseChildren, `!(${node.condition})`);
  }
  return out;
}

function injectAttrToElement(
  el: IrNode & { kind: 'element' },
  name: string,
  value: string,
  ctx: EmitContext,
): string {
  // Render with the extra attr injected. We do this by calling emitElement
  // but with a synthetic attr added at the end.
  const augmented: typeof el = {
    ...el,
    attrs: [...el.attrs, { kind: 'string', name, value } as IrAttr],
  };
  return emitElement(augmented, ctx);
}

function emitFor(node: IrFor, ctx: EmitContext): string {
  // ng-repeat goes on the FIRST element child; if children contain multiple
  // elements or a fragment, wrap in a span so we have one to attach to.
  if (node.children.length === 1 && node.children[0].kind === 'element') {
    const el = node.children[0];
    let repeatExpr = `${node.itemName} in ${node.iterable}`;
    if (node.indexName) repeatExpr += `\n      | $index as ${node.indexName}`;
    if (node.keyExpression) repeatExpr += ` track by ${node.keyExpression}`;
    return injectAttrToElement(el, 'ng-repeat', repeatExpr, ctx);
  }
  if (node.children.length === 1 && node.children[0].kind === 'component') {
    // Inline-expand and then attach ng-repeat to the resulting wrapper.
    // Use a div for the same reason as emitIf — the inlined component
    // body is usually block-level, which would auto-close a span.
    const inner = emitNode(node.children[0], ctx);
    let repeatExpr = `${node.itemName} in ${node.iterable}`;
    if (node.keyExpression) repeatExpr += ` track by ${node.keyExpression}`;
    return `<div ng-repeat="${escapeAttr(repeatExpr)}">${inner}</div>`;
  }
  const inner = emitNodes(node.children, ctx);
  let repeatExpr = `${node.itemName} in ${node.iterable}`;
  if (node.keyExpression) repeatExpr += ` track by ${node.keyExpression}`;
  return `<div ng-repeat="${escapeAttr(repeatExpr)}">${inner}</div>`;
}

function emitElement(
  node: IrNode & { kind: 'element' },
  ctx: EmitContext,
): string {
  const tag = node.tag;
  let attrs = '';
  for (const a of node.attrs) attrs += emitAttr(a, ctx);
  if (VOID_ELEMENTS.has(tag)) return `<${tag}${attrs} />`;
  const inner = emitNodes(node.children, ctx);
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

function emitComponentRef(
  node: IrNode & { kind: 'component' },
  ctx: EmitContext,
): string {
  const compName = node.name;

  // Lucide icon — emit inline SVG.
  if (node.source === 'lucide' || isKnownLucideIcon(compName)) {
    // Find a className attr to forward as the SVG class.
    const classAttr = node.attrs.find((a) => a.kind === 'string' && a.name === 'className');
    const cls = classAttr && classAttr.kind === 'string' ? classAttr.value : '';
    return renderLucideIcon(compName, cls);
  }

  // shadcn/ui — emit minimal HTML shim with class additions.
  const shim = getShadcnShim(compName);
  if (shim || isShadcnComponent(compName)) {
    const s = shim ?? { tag: 'div', extraClass: `shadcn-${compName.toLowerCase()}` };
    let attrs = '';
    let foundClass = false;
    for (const a of node.attrs) {
      if (a.kind === 'string' && a.name === 'className') {
        foundClass = true;
        attrs += ` class="${escapeAttr(`${s.extraClass ?? ''} ${a.value}`.trim())}"`;
      } else {
        attrs += emitAttr(a, ctx);
      }
    }
    if (!foundClass && s.extraClass) attrs += ` class="${escapeAttr(s.extraClass)}"`;
    if (s.marker) attrs += ` data-shadcn="${escapeAttr(s.marker)}"`;
    if (s.voidTag) return `<${s.tag}${attrs} />`;
    const inner = emitNodes(node.children, ctx);
    return `<${s.tag}${attrs}>${inner}</${s.tag}>`;
  }

  // react-router-dom stubs — these never render meaningfully in a Service
  // Portal widget. Drop them transparently before they hit the
  // "unknown-component" fallback (which would leak `element={<Home />}`
  // and friends as literal `{{ ... }}` text).
  const routerStrategy = getReactRouterStrategy(compName);
  if (routerStrategy) {
    if (routerStrategy === 'skip') return '';
    if (routerStrategy === 'transparent') {
      // Render the children only. Drop every Route/Router prop — none of
      // them map to anything AngularJS understands.
      return emitNodes(node.children, ctx);
    }
    if (routerStrategy === 'link') {
      // <Link to="/foo"> → <a href="/foo">. Preserve className, pass
      // children verbatim.
      let href: string | null = null;
      let cls = '';
      for (const a of node.attrs) {
        if (a.kind === 'string' && a.name === 'to') href = a.value;
        else if (a.kind === 'string' && a.name === 'className') cls = a.value;
      }
      const hrefAttr = href ? ` href="${escapeAttr(href)}"` : '';
      const clsAttr = cls ? ` class="${escapeAttr(cls)}"` : '';
      const inner = emitNodes(node.children, ctx);
      return `<a${hrefAttr}${clsAttr}>${inner}</a>`;
    }
  }

  // Local component — inline-expand with prop substitution.
  if (node.source === 'local') {
    const target = findLocalComponent(compName, ctx.project);
    if (!target) {
      ctx.warnings.push(`local component "${compName}" not found in project IR`);
      return `<!-- missing local component: ${escapeHtml(compName)} -->`;
    }
    return inlineExpand(target.component, node, ctx);
  }

  // Unknown — fall back to a div with the original content as children.
  // We deliberately DO NOT pass attrs through. Unknown components carry
  // arbitrary JSX-expression props (`element={<Home />}`, `errorElement`,
  // typed handlers) that the standard emitter would convert to `{{ ... }}`
  // interpolations, which AngularJS then renders as literal text fragments
  // in the portal — the source of the `}}" data-unknown-component=...`
  // bug reported on 2026-04-29.
  ctx.warnings.push(`unknown component reference: ${compName}`);
  const inner = emitNodes(node.children, ctx);
  return `<div data-unknown-component="${escapeAttr(compName)}">${inner}</div>`;
}

function inlineExpand(
  comp: IrComponent,
  callSite: IrNode & { kind: 'component' },
  ctx: EmitContext,
): string {
  // Build a substitution map from the call-site attrs, keyed by the
  // component's destructured prop names. Anything not in `comp.props` is
  // ignored (we can't surface it without a member-access plan).
  const subst: PropSubst = {};
  for (const a of callSite.attrs) {
    if (a.kind === 'spread') continue;
    if (comp.props.includes(a.name)) {
      subst[a.name] = a;
    }
  }
  // `children` is special — React's `props.children` is whatever JSX was
  // wrapped between the open/close tags. If the component declares a
  // `children` prop, expose it via subst by emitting it inline.
  if (comp.props.includes('children') && callSite.children.length > 0) {
    // Render children once and inline as a string-typed attr (so prop refs
    // to {children} resolve to that rendered HTML). Since our subst values
    // are IrAttrs and we don't have a "rendered HTML" attr kind, we cheat:
    // emit children at the use site by treating bare {children} expressions
    // as a sentinel. Easier path: pre-render now, splice as text.
    subst.children = {
      kind: 'string',
      name: 'children',
      // Mark with a sentinel so emitExpr emits the rendered HTML directly.
      // We use a UUID-ish prefix to avoid collisions with user content.
      value: `__VIBE_INLINE_CHILDREN__${Math.random().toString(36).slice(2)}`,
    };
    // Stash the rendered children so emitExpr can swap it back.
    (subst.children as IrAttr & { __renderedHtml?: string }).__renderedHtml = emitNodes(
      callSite.children,
      ctx,
    );
  }

  ctx.substStack.push(subst);
  let out = emitNodes(comp.body, ctx);

  // Replace any `__VIBE_INLINE_CHILDREN__...` tokens with the stashed HTML
  // (since they got HTML-escaped, we replace the escaped form too).
  if (subst.children) {
    const sentinel = (subst.children as IrAttr & { value?: string }).value!;
    const rendered = (subst.children as IrAttr & { __renderedHtml?: string }).__renderedHtml ?? '';
    out = out.split(escapeHtml(sentinel)).join(rendered);
    out = out.split(sentinel).join(rendered);
  }
  ctx.substStack.pop();
  return out;
}
