// Parse a single .tsx file into our IR.
//
// Input: TypeScript source string.
// Output: IrModule — list of components with their JSX bodies normalized,
// plus the file's import map.
//
// The shape we look for is what Figma Make / shadcn-cli output:
//   - One file = one (or a few) named React function components
//   - Either `function App() { return (...); }` or
//     `export default function App() { ... }` or
//     `const App = () => { ... }` plus a default-export
//   - State via `useState`, no class components, no Suspense
//
// We deliberately do NOT try to handle every React idiom. Anything we can't
// translate becomes an `IrUnsupported` node with a `reason` so the emitter
// can surface diagnostics instead of silently losing content.

import { parse } from '@babel/parser';
import generateModule from '@babel/generator';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';
import type {
  ImportRecord,
  ImportSource,
  IrAttr,
  IrComponent,
  IrModule,
  IrNode,
  IrUseState,
} from './types.js';

// @babel/generator and @babel/traverse export both ESM-default and CJS-default;
// resolve through the .default property when the runtime gave us the module
// object. tsx-watch + esm interop sometimes lands us on the wrapper.
const generate = ((generateModule as unknown as { default?: typeof generateModule }).default ??
  generateModule) as typeof generateModule;
const traverse = ((traverseModule as unknown as { default?: typeof traverseModule }).default ??
  traverseModule) as typeof traverseModule;

function classifyImport(from: string): ImportSource {
  if (from === 'lucide-react' || from.startsWith('lucide-react/')) return 'lucide';
  if (from.startsWith('./components/ui/') || from.startsWith('../components/ui/'))
    return 'shadcn';
  if (from.startsWith('./components/figma/') || from.startsWith('../components/figma/'))
    return 'figma-helper';
  if (from.startsWith('./') || from.startsWith('../')) return 'local';
  return 'external';
}

// Strip TypeScript-only expression wrappers from a cloned AST so the
// generated source is valid JavaScript. Without this, snippets like
// `'approved' as const` or `value satisfies Foo` survive into emitted
// .client.js / server.js files and trigger `SyntaxError` in browsers — the
// entire widget controller silently fails to register and the deployed
// portal shows literal `{{ }}` template text.
//
// Handled cases (all share an `.expression` inner field):
//   TSAsExpression          x as T   /  x as const
//   TSTypeAssertion         <T>x
//   TSNonNullExpression     x!
//   TSSatisfiesExpression   x satisfies T
//   TSInstantiationExpression  f<T>
//
// Other TS constructs (type-only imports, type aliases, interfaces) don't
// reach the snippet path because they aren't expression nodes; if any new
// one shows up, this helper logs nothing and just falls through to plain
// generate(), which in the worst case emits the TS syntax — same as the
// current bug, not a regression.
function stripTsNodes<T extends t.Node>(node: T): T {
  // Deep-clone so we don't mutate the original AST that other passes rely on.
  const clone = t.cloneNode(node, /* deep */ true);
  traverse(
    clone,
    {
      noScope: true,
      enter(path) {
        const n = path.node;
        if (
          t.isTSAsExpression(n) ||
          t.isTSTypeAssertion(n) ||
          t.isTSNonNullExpression(n) ||
          t.isTSSatisfiesExpression(n) ||
          t.isTSInstantiationExpression(n)
        ) {
          path.replaceWith(n.expression);
        }
      },
    },
    // traverse() requires a NodePath when the root is an Expression; passing
    // a synthetic File wrapper is the documented escape hatch but adds
    // complexity. The two-argument call works for any node Babel can root.
    undefined as never,
    null,
  );
  return clone;
}

function snippet(node: t.Node): string {
  try {
    return generate(stripTsNodes(node), { compact: true }).code;
  } catch {
    return '';
  }
}

function expressionSource(node: t.Expression): string {
  try {
    return generate(stripTsNodes(node), { compact: false }).code;
  } catch {
    return '';
  }
}

function unsupported(reason: string, node?: t.Node): IrNode {
  return {
    kind: 'unsupported',
    reason,
    sourceSnippet: node ? snippet(node) : undefined,
  };
}

function getJsxName(node: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName): string {
  if (t.isJSXIdentifier(node)) return node.name;
  if (t.isJSXMemberExpression(node)) {
    return `${getJsxName(node.object as t.JSXIdentifier | t.JSXMemberExpression)}.${node.property.name}`;
  }
  return `${node.namespace.name}:${node.name.name}`;
}

function isLowercaseTag(name: string): boolean {
  return /^[a-z]/.test(name) && !name.includes('.');
}

function buildAttrs(
  attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[],
): { attrs: IrAttr[]; keyExpression?: string } {
  const attrs: IrAttr[] = [];
  let keyExpression: string | undefined;

  for (const attr of attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      attrs.push({
        kind: 'spread',
        expression: expressionSource(attr.argument as t.Expression),
      });
      continue;
    }
    const name = getJsxName(attr.name);

    // React `key` is a hint to the loop emitter; don't emit it as an HTML
    // attribute — capture it on the parent IrFor.
    if (name === 'key' && attr.value && t.isJSXExpressionContainer(attr.value)) {
      const expr = attr.value.expression;
      if (!t.isJSXEmptyExpression(expr)) {
        keyExpression = expressionSource(expr);
      }
      continue;
    }

    if (attr.value === null || attr.value === undefined) {
      // Boolean prop: `<input disabled />`. Treat as string="true" so HTML
      // emitters render the attribute name.
      attrs.push({ kind: 'string', name, value: 'true' });
      continue;
    }
    if (t.isStringLiteral(attr.value)) {
      attrs.push({ kind: 'string', name, value: attr.value.value });
      continue;
    }
    if (t.isJSXExpressionContainer(attr.value)) {
      const expr = attr.value.expression;
      if (t.isJSXEmptyExpression(expr)) continue;
      // Event handler? Convention: name starts with `on` followed by an
      // uppercase letter (`onClick`, `onSubmit`). Anything else is a regular
      // expression-valued attr.
      if (/^on[A-Z]/.test(name)) {
        attrs.push({
          kind: 'event',
          name,
          handler: expressionSource(expr),
        });
      } else {
        attrs.push({
          kind: 'expression',
          name,
          expression: expressionSource(expr),
        });
      }
      continue;
    }
    if (t.isJSXElement(attr.value) || t.isJSXFragment(attr.value)) {
      // Element-valued attribute (e.g. `icon={<X/>}`). Emit as expression source.
      attrs.push({
        kind: 'expression',
        name,
        expression: snippet(attr.value),
      });
      continue;
    }
  }

  return { attrs, keyExpression };
}

function buildChildren(children: t.Node[], imports: ImportRecord[]): IrNode[] {
  const out: IrNode[] = [];
  for (const child of children) {
    if (t.isJSXText(child)) {
      // JSXText routinely contains whitespace-only nodes between siblings.
      // Collapse pure whitespace; keep meaningful inner whitespace.
      const text = child.value.replace(/^\s+|\s+$/g, '');
      if (text.length === 0) continue;
      out.push({ kind: 'text', value: text });
      continue;
    }
    if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (t.isJSXEmptyExpression(expr)) continue;
      out.push(buildExpressionChild(expr, imports));
      continue;
    }
    if (t.isJSXElement(child)) {
      out.push(buildElement(child, imports));
      continue;
    }
    if (t.isJSXFragment(child)) {
      out.push({ kind: 'fragment', children: buildChildren(child.children, imports) });
      continue;
    }
    if (t.isJSXSpreadChild(child)) {
      out.push(unsupported('JSX spread child', child));
      continue;
    }
  }
  return out;
}

function buildExpressionChild(expr: t.Expression, imports: ImportRecord[]): IrNode {
  // Conditional ternary: `cond ? a : b` → IrIf
  if (t.isConditionalExpression(expr)) {
    return {
      kind: 'if',
      condition: expressionSource(expr.test),
      then: [buildExpressionAsNode(expr.consequent, imports)],
      else: [buildExpressionAsNode(expr.alternate, imports)],
    };
  }
  // Logical AND: `cond && X` → IrIf without else
  if (t.isLogicalExpression(expr) && expr.operator === '&&') {
    return {
      kind: 'if',
      condition: expressionSource(expr.left),
      then: [buildExpressionAsNode(expr.right, imports)],
    };
  }
  // List rendering: `arr.map((item, i) => ...)` → IrFor
  if (
    t.isCallExpression(expr) &&
    t.isMemberExpression(expr.callee) &&
    t.isIdentifier(expr.callee.property) &&
    expr.callee.property.name === 'map' &&
    expr.arguments.length === 1
  ) {
    const fn = expr.arguments[0];
    if (
      (t.isArrowFunctionExpression(fn) || t.isFunctionExpression(fn)) &&
      fn.params.length >= 1
    ) {
      const itemParam = fn.params[0];
      const indexParam = fn.params[1];
      if (t.isIdentifier(itemParam) && (!indexParam || t.isIdentifier(indexParam))) {
        const body = fn.body;
        let mapped: IrNode | null = null;
        let keyExpression: string | undefined;
        if (t.isJSXElement(body) || t.isJSXFragment(body)) {
          mapped = buildExpressionAsNode(body, imports);
          if (t.isJSXElement(body)) {
            // peek the key attribute
            const found = body.openingElement.attributes.find(
              (a): a is t.JSXAttribute => t.isJSXAttribute(a) && getJsxName(a.name) === 'key',
            );
            if (
              found?.value &&
              t.isJSXExpressionContainer(found.value) &&
              !t.isJSXEmptyExpression(found.value.expression)
            ) {
              keyExpression = expressionSource(found.value.expression);
            }
          }
        } else if (t.isBlockStatement(body)) {
          // arrow with block: pick the first ReturnStatement that yields JSX
          for (const stmt of body.body) {
            if (
              t.isReturnStatement(stmt) &&
              stmt.argument &&
              (t.isJSXElement(stmt.argument) || t.isJSXFragment(stmt.argument))
            ) {
              mapped = buildExpressionAsNode(stmt.argument, imports);
              break;
            }
          }
        } else if (t.isExpression(body)) {
          mapped = buildExpressionAsNode(body, imports);
        }
        if (mapped) {
          return {
            kind: 'for',
            iterable: expressionSource(expr.callee.object as t.Expression),
            itemName: itemParam.name,
            indexName: indexParam && t.isIdentifier(indexParam) ? indexParam.name : undefined,
            keyExpression,
            children: [mapped],
          };
        }
      }
    }
  }
  // JSX element/fragment → emit as IrElement/IrFragment directly.
  if (t.isJSXElement(expr) || t.isJSXFragment(expr)) {
    return buildExpressionAsNode(expr, imports);
  }
  // String literal as a child expression — flatten to text.
  if (t.isStringLiteral(expr)) {
    return { kind: 'text', value: expr.value };
  }
  // Default: bare interpolation expression.
  return { kind: 'expr', expression: expressionSource(expr) };
}

function buildExpressionAsNode(expr: t.Node, imports: ImportRecord[]): IrNode {
  if (t.isJSXElement(expr)) return buildElement(expr, imports);
  if (t.isJSXFragment(expr))
    return { kind: 'fragment', children: buildChildren(expr.children, imports) };
  if (t.isJSXText(expr)) return { kind: 'text', value: expr.value };
  if (t.isStringLiteral(expr)) return { kind: 'text', value: expr.value };
  if (t.isExpression(expr)) return { kind: 'expr', expression: expressionSource(expr) };
  return unsupported('unrecognized expression node', expr);
}

// Component tags whose visible content lives in a JSX-valued PROP rather
// than in `children`. React Router's <Route element={<Home/>} /> is the
// flagship case — without this lift the emitter walks straight past Home
// because Route literally has no JSX children. Generalized so future cases
// (e.g. a layout wrapper with `header={<Foo/>}`) only need the entry below.
const PROP_AS_CHILD_LIFTS: Record<string, string[]> = {
  Route: ['element', 'errorElement'],
  // No-ops for the other react-router stubs but recorded here for clarity:
  // Routes / BrowserRouter / Outlet etc. don't carry content props.
};

/** When a component's "content prop" carries a JSX element/fragment, prepend
 *  that JSX onto the element's children so the walker picks it up. The
 *  attribute is stripped from the lifted set so the emitter's expression
 *  fallback never sees `element={<Home/>}` (which would emit as broken
 *  `{{ <Home /> }}` interpolation). */
function liftContentPropsIntoChildren(
  tagName: string,
  rawAttrs: t.JSXAttribute['value'] extends never ? never : Array<t.JSXAttribute | t.JSXSpreadAttribute>,
  rawChildren: t.Node[],
): { attrs: typeof rawAttrs; children: t.Node[] } {
  const propNames = PROP_AS_CHILD_LIFTS[tagName];
  if (!propNames) return { attrs: rawAttrs, children: rawChildren };

  const lifted: t.Node[] = [];
  const remainingAttrs: typeof rawAttrs = [];
  for (const attr of rawAttrs) {
    if (
      t.isJSXAttribute(attr) &&
      t.isJSXIdentifier(attr.name) &&
      propNames.includes(attr.name.name) &&
      attr.value &&
      t.isJSXExpressionContainer(attr.value)
    ) {
      const expr = attr.value.expression;
      if (t.isJSXElement(expr) || t.isJSXFragment(expr)) {
        lifted.push(expr);
        continue; // drop the attr — its content is now in children
      }
    }
    remainingAttrs.push(attr);
  }
  return {
    attrs: remainingAttrs,
    children: lifted.length > 0 ? [...lifted, ...rawChildren] : rawChildren,
  };
}

function buildElement(elem: t.JSXElement, imports: ImportRecord[]): IrNode {
  const opening = elem.openingElement;
  const tagName = getJsxName(opening.name);

  // Lift content-prop JSX into the element's children. Must happen before
  // buildAttrs/buildChildren so the regular machinery treats the lifted
  // JSX as ordinary children.
  const { attrs: rawAttrs, children: rawChildren } = liftContentPropsIntoChildren(
    tagName,
    opening.attributes,
    elem.children,
  );

  const { attrs } = buildAttrs(rawAttrs);
  const children = buildChildren(rawChildren, imports);

  if (isLowercaseTag(tagName)) {
    return {
      kind: 'element',
      tag: tagName,
      attrs,
      children,
    };
  }

  // Capitalized → component reference.
  const importHit = imports.find((i) => i.name === tagName.split('.')[0]);
  return {
    kind: 'component',
    name: tagName,
    source: importHit ? importHit.source : 'unknown',
    importedFrom: importHit?.from,
    attrs,
    children,
  };
}

// Pull `useState` declarations from the body of a component function so the
// emitter can wire them as `c.<name>` controller fields with seeded defaults.
function extractUseState(fn: t.Function): IrUseState[] {
  const out: IrUseState[] = [];
  if (!t.isBlockStatement(fn.body)) return out;
  for (const stmt of fn.body.body) {
    if (!t.isVariableDeclaration(stmt)) continue;
    for (const decl of stmt.declarations) {
      if (
        !t.isCallExpression(decl.init) ||
        !t.isIdentifier(decl.init.callee) ||
        decl.init.callee.name !== 'useState'
      ) {
        continue;
      }
      if (!t.isArrayPattern(decl.id) || decl.id.elements.length < 1) continue;
      const valueEl = decl.id.elements[0];
      const setterEl = decl.id.elements[1];
      if (!t.isIdentifier(valueEl)) continue;
      const initialArg = decl.init.arguments[0];
      out.push({
        name: valueEl.name,
        initial:
          initialArg && t.isExpression(initialArg) ? expressionSource(initialArg) : undefined,
        setterName: setterEl && t.isIdentifier(setterEl) ? setterEl.name : undefined,
      });
    }
  }
  return out;
}

// Find the JSX node returned by a component function. Most React component
// bodies are either `return (<JSX/>)` or `return <JSX/>` with no parens.
function findReturnJsx(fn: t.Function): t.JSXElement | t.JSXFragment | null {
  if (t.isJSXElement(fn.body) || t.isJSXFragment(fn.body)) return fn.body;
  if (!t.isBlockStatement(fn.body)) return null;
  for (const stmt of fn.body.body) {
    if (
      t.isReturnStatement(stmt) &&
      stmt.argument &&
      (t.isJSXElement(stmt.argument) || t.isJSXFragment(stmt.argument))
    ) {
      return stmt.argument;
    }
  }
  return null;
}

function literalBindings(fn: t.Function): { name: string; sourceSnippet: string }[] {
  const out: { name: string; sourceSnippet: string }[] = [];
  if (!t.isBlockStatement(fn.body)) return out;
  for (const stmt of fn.body.body) {
    if (!t.isVariableDeclaration(stmt)) continue;
    for (const decl of stmt.declarations) {
      if (!t.isIdentifier(decl.id) || !decl.init) continue;
      // Only capture array/object literals — these are typically mock data.
      if (t.isArrayExpression(decl.init) || t.isObjectExpression(decl.init)) {
        out.push({ name: decl.id.name, sourceSnippet: snippet(decl.init) });
      }
    }
  }
  return out;
}

export interface ParseTsxResult {
  module: IrModule;
}

export function parseTsxFile(filename: string, source: string): ParseTsxResult {
  const warnings: string[] = [];

  let ast: t.File;
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch (err) {
    return {
      module: {
        filename,
        imports: [],
        components: [],
        topLevelLiterals: [],
        warnings: [`parse error: ${(err as Error).message}`],
      },
    };
  }

  // Pass 1: collect imports.
  const imports: ImportRecord[] = [];
  for (const node of ast.program.body) {
    if (!t.isImportDeclaration(node)) continue;
    const from = node.source.value;
    const source = classifyImport(from);
    for (const spec of node.specifiers) {
      if (t.isImportDefaultSpecifier(spec)) {
        imports.push({ name: spec.local.name, isDefault: true, from, source });
      } else if (t.isImportSpecifier(spec)) {
        imports.push({ name: spec.local.name, isDefault: false, from, source });
      }
      // Skip namespace imports (`import * as X`); rare in Figma Make output.
    }
  }

  // Pass 2: collect components and top-level literals.
  const components: IrComponent[] = [];
  const topLevelLiterals: { name: string; sourceSnippet: string }[] = [];
  let defaultExportName: string | null = null;

  // Pass 2a: collect default-export bindings. Two shapes that both contain
  // the component definition inline (and would be missed by the named-pass
  // below):
  //   export default function App() { ... }
  //   export default () => (...);
  for (const node of ast.program.body) {
    if (!t.isExportDefaultDeclaration(node)) continue;
    if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
      defaultExportName = node.declaration.id.name;
      const comp = buildComponent(node.declaration.id.name, true, node.declaration, imports);
      if (comp) components.push(comp);
    } else if (t.isIdentifier(node.declaration)) {
      // Component declared elsewhere in the file; named-pass will pick it up.
      defaultExportName = node.declaration.name;
    } else if (
      t.isFunctionExpression(node.declaration) ||
      t.isArrowFunctionExpression(node.declaration)
    ) {
      defaultExportName = '__default__';
      const comp = buildComponent('__default__', true, node.declaration, imports);
      if (comp) components.push(comp);
    }
  }

  // Pass 2b: collect named/top-level components, skipping anything we already
  // added during pass 2a (the default-export branch above).
  const alreadyAdded = new Set(components.map((c) => c.name));
  for (const node of ast.program.body) {
    if (t.isFunctionDeclaration(node) && node.id) {
      if (alreadyAdded.has(node.id.name)) continue;
      // Component? Heuristic: name starts with uppercase AND function returns JSX.
      const looksLikeComponent = /^[A-Z]/.test(node.id.name) && findReturnJsx(node) !== null;
      if (!looksLikeComponent) continue;
      const isDefault = node.id.name === defaultExportName;
      const comp = buildComponent(node.id.name, isDefault, node, imports);
      if (comp) components.push(comp);
      continue;
    }
    if (t.isExportNamedDeclaration(node) && t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
      const looksLikeComponent =
        /^[A-Z]/.test(node.declaration.id.name) && findReturnJsx(node.declaration) !== null;
      if (!looksLikeComponent) continue;
      const isDefault = node.declaration.id.name === defaultExportName;
      const comp = buildComponent(node.declaration.id.name, isDefault, node.declaration, imports);
      if (comp) components.push(comp);
      continue;
    }
    if (t.isVariableDeclaration(node)) {
      for (const decl of node.declarations) {
        if (!t.isIdentifier(decl.id) || !decl.init) continue;
        // Capitalized + arrow function returning JSX → component.
        if (
          /^[A-Z]/.test(decl.id.name) &&
          (t.isArrowFunctionExpression(decl.init) || t.isFunctionExpression(decl.init))
        ) {
          if (findReturnJsx(decl.init)) {
            const isDefault = decl.id.name === defaultExportName;
            const comp = buildComponent(decl.id.name, isDefault, decl.init, imports);
            if (comp) components.push(comp);
          }
        } else if (t.isArrayExpression(decl.init) || t.isObjectExpression(decl.init)) {
          // Top-level data literal that isn't a component — useful for seeding server.js.
          topLevelLiterals.push({ name: decl.id.name, sourceSnippet: snippet(decl.init) });
        }
      }
      continue;
    }
    if (t.isExportNamedDeclaration(node) && t.isVariableDeclaration(node.declaration)) {
      for (const decl of node.declaration.declarations) {
        if (!t.isIdentifier(decl.id) || !decl.init) continue;
        if (
          /^[A-Z]/.test(decl.id.name) &&
          (t.isArrowFunctionExpression(decl.init) || t.isFunctionExpression(decl.init))
        ) {
          if (findReturnJsx(decl.init)) {
            const isDefault = decl.id.name === defaultExportName;
            const comp = buildComponent(decl.id.name, isDefault, decl.init, imports);
            if (comp) components.push(comp);
          }
        } else if (t.isArrayExpression(decl.init) || t.isObjectExpression(decl.init)) {
          topLevelLiterals.push({ name: decl.id.name, sourceSnippet: snippet(decl.init) });
        }
      }
    }
  }

  // Suppress noisy traverse import — keep a no-op reference so unused-import
  // lint doesn't fire if traverse is removed in a later refactor.
  void traverse;

  // Promote isDefault on the named-export-default variant. We earlier may have
  // recorded a function declaration without knowing it would be the default.
  if (defaultExportName) {
    for (const c of components) {
      if (c.name === defaultExportName) c.isDefault = true;
    }
  }

  return {
    module: {
      filename,
      imports,
      components,
      topLevelLiterals,
      warnings,
    },
  };
}

function buildComponent(
  name: string,
  isDefault: boolean,
  fn: t.Function,
  imports: ImportRecord[],
): IrComponent | null {
  const ret = findReturnJsx(fn);
  if (!ret) return null;
  const state = extractUseState(fn);
  const literals = literalBindings(fn);
  const props = extractDestructuredProps(fn);
  const body =
    t.isJSXElement(ret) ? [buildElement(ret, imports)] : buildChildren(ret.children, imports);
  return {
    name,
    isDefault,
    props,
    state,
    literalBindings: literals,
    body,
    warnings: [],
  };
}

// Pull destructured prop names from the function's first parameter:
//   function HenCard({ name, breed, isSponsored = false }) → [name, breed, isSponsored]
//   function App() → []
//   function X(props) → []  (member-access props, not yet handled in M4)
function extractDestructuredProps(fn: t.Function): string[] {
  const first = fn.params[0];
  if (!first) return [];
  // Handle TypeScript-typed parameters by looking through the inner pattern.
  const pattern = t.isAssignmentPattern(first) ? first.left : first;
  if (!t.isObjectPattern(pattern)) return [];
  const out: string[] = [];
  for (const prop of pattern.properties) {
    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && !prop.computed) {
      out.push(prop.key.name);
    } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
      // `...rest` — record the rest binding so the emitter can choose to
      // emit a comment / stub instead of dropping silently.
      out.push(`...${prop.argument.name}`);
    }
  }
  return out;
}
