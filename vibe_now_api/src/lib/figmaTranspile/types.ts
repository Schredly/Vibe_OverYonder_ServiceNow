// Intermediate representation for the Figma → Service Portal transpile.
//
// Produced by parseTsx (M2), consumed by jsxToTemplate (M4) and widgetEmit
// (M5). Designed to be roughly framework-agnostic — it captures *what the
// React tree intends* (an element tree with attrs, expressions, conditionals,
// and lists) rather than React-specific shapes. AngularJS emission is one
// possible target; Stencil/Web Components could be another later.
//
// Shape principles:
//   - JSON-serializable (we persist this to disk between phases)
//   - Resolves ambiguities at parse time so emission is mechanical
//   - Records every import so the emitter can shim shadcn/ui and lucide
//   - Drops React-isms that don't translate (refs, hooks beyond useState,
//     Suspense, portals); records them as warnings on the parent component

export type ImportSource = 'shadcn' | 'lucide' | 'local' | 'figma-helper' | 'external';

export interface ImportRecord {
  /** Local name as imported, e.g. `Button`, `ChevronDown`. */
  name: string;
  /** Whether this was a default import (`import X from "..."`) or named. */
  isDefault: boolean;
  /** The raw module path the file imported from. */
  from: string;
  /** Categorization so the emitter knows how to handle the reference. */
  source: ImportSource;
}

// --- IR node tree -----------------------------------------------------------

export interface IrText {
  kind: 'text';
  /** Raw text — emitter is responsible for HTML-escaping. */
  value: string;
}

export interface IrExpr {
  kind: 'expr';
  /**
   * Source code for the expression. The string preserves the original JS
   * syntax (e.g. `user.name`, `count > 0 ? 'plural' : 'singular'`); the
   * AngularJS emitter wraps it in `{{ }}` and does identifier rewrites
   * (e.g. `count` → `data.count` if state, or `c.count` if controller-local).
   */
  expression: string;
}

export interface IrIf {
  kind: 'if';
  /** Source-code condition expression. */
  condition: string;
  then: IrNode[];
  /** Present when the original was a ternary (`cond ? a : b`). */
  else?: IrNode[];
}

export interface IrFor {
  kind: 'for';
  /** Source-code iterable expression, e.g. `hens` or `data.items`. */
  iterable: string;
  /** Loop binding, e.g. `hen`. */
  itemName: string;
  /** Optional index name when `.map((item, idx) => ...)` is used. */
  indexName?: string;
  /** Optional `key` expression captured from JSX `key={...}` attribute. */
  keyExpression?: string;
  children: IrNode[];
}

export interface IrFragment {
  kind: 'fragment';
  children: IrNode[];
}

export interface IrElement {
  kind: 'element';
  /** Lowercase HTML tag, e.g. `div`, `section`, `button`. */
  tag: string;
  attrs: IrAttr[];
  children: IrNode[];
}

export interface IrComponentRef {
  kind: 'component';
  /** Local component name as imported, e.g. `Button`, `HenCard`. */
  name: string;
  /** Resolved import source for this component. `'unknown'` when not imported. */
  source: ImportSource | 'unknown';
  /** The full import-record (when resolvable) for tracing/shimming. */
  importedFrom?: string;
  attrs: IrAttr[];
  children: IrNode[];
}

/** Catch-all for nodes we don't yet understand; kept so we don't silently lose content. */
export interface IrUnsupported {
  kind: 'unsupported';
  reason: string;
  /** Best-effort source code of what we couldn't translate. */
  sourceSnippet?: string;
}

export type IrNode =
  | IrText
  | IrExpr
  | IrIf
  | IrFor
  | IrFragment
  | IrElement
  | IrComponentRef
  | IrUnsupported;

// --- Attributes -------------------------------------------------------------

export interface IrAttrString {
  name: string;
  kind: 'string';
  value: string;
}

export interface IrAttrExpression {
  name: string;
  kind: 'expression';
  /** Source code for the value expression. */
  expression: string;
}

export interface IrAttrEvent {
  /** The React-style name, e.g. `onClick`, `onChange`. The emitter maps to ng-click etc. */
  name: string;
  kind: 'event';
  /**
   * The handler expression. Could be a function name (`adopt`), an inline
   * arrow (`() => setOpen(true)`), or a method call. The emitter wraps in
   * AngularJS-friendly syntax.
   */
  handler: string;
}

export interface IrAttrSpread {
  kind: 'spread';
  /** Source code of the spread expression, e.g. `props`. */
  expression: string;
}

export type IrAttr = IrAttrString | IrAttrExpression | IrAttrEvent | IrAttrSpread;

// --- Component / module / project ------------------------------------------

export interface IrUseState {
  /** The variable name from `const [x, setX] = useState(initial)`. */
  name: string;
  /** Source code of the initial-value expression. */
  initial?: string;
  /** Source code of the setter name. */
  setterName?: string;
}

export interface IrComponent {
  /** Local component name (function or const declaration). */
  name: string;
  /** Whether this was the file's default export. */
  isDefault: boolean;
  /**
   * Destructured prop names from the function signature, e.g.
   * `function HenCard({ name, breed, isSponsored = false })` → `['name', 'breed', 'isSponsored']`.
   * Used by the M4 emitter to do prop substitution when inline-expanding the
   * component into its caller. Empty when the props pattern is not a simple
   * destructure (e.g. `function X(props)` — those need member-access handling).
   */
  props: string[];
  /** Detected `useState` calls inside the component body. */
  state: IrUseState[];
  /** Constants declared at the top of the component body that look like data
   *  (object/array literals); useful for seeding mock data into server.js. */
  literalBindings: { name: string; sourceSnippet: string }[];
  /** The component's return JSX as IR. Empty array when the component is
   *  resolved but its return type is something we couldn't parse. */
  body: IrNode[];
  /** Diagnostics for things we deliberately dropped during parsing. */
  warnings: string[];
}

export interface IrModule {
  /** Path within the zip, normalized (e.g. `app/App.tsx`). */
  filename: string;
  imports: ImportRecord[];
  components: IrComponent[];
  /** Top-level value declarations that aren't components, e.g. a `henData`
   *  array exported alongside `App`. The emitter uses these as data seeds. */
  topLevelLiterals: { name: string; sourceSnippet: string }[];
  /** Diagnostics for the module as a whole. */
  warnings: string[];
}

export interface IrProject {
  /** Name of the root entry component that we'll emit as the widget. */
  rootComponent?: { module: string; component: string };
  modules: IrModule[];
  /** Aggregate stats useful for the report endpoint. */
  stats: {
    moduleCount: number;
    componentCount: number;
    nodeCount: number;
    shadcnImports: number;
    lucideImports: number;
    warnings: number;
  };
}
