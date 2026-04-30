// Spec → Now SDK Fluent project emitter.
//
// Phase 2 first-cut scope: emit a buildable, deployable scoped app with
//   - now.config.json (scope, name)
//   - one core table x_<company>_<slug>_record extending task
//   - one role x_<company>_<slug>.user
//   - if portal.enabled:
//       sp_portal + sp_page + sp_container + sp_row + sp_column + sp_instance
//       + a Welcome sp_widget
//     i.e. the full 5-record page-layout cluster needed for a portal to
//     actually render. Without these the deployed `/<suffix>` URL falls
//     back to the OOB "How can I help?" page (verified empirically with
//     Cluckworks on 2026-04-24 — see vibe_overyonder.md §6 Path A for
//     the cross-reference rules learned the hard way).
//
// Cross-record reference rules embedded here:
//   - Now.ID['<alias>'] only resolves to a sys_id at $id positions, never
//     in data field values. We use a deterministic 32-char hex derived
//     per-record (md5 of alias + scopeId) as both the alias key AND the
//     reference value. The SDK accepts a sys_id-shaped alias as $id and
//     emits exactly that sys_id; references then point at the same hex
//     and the records link cleanly.
//   - sp_portal.homepage is a reference column to sp_page; pass the page
//     sys_id (NOT the page's `id` string).
//
// We explicitly do NOT generate business rules, catalog items, flows, or
// tier-faithful Figma-derived widgets in this cut. The Welcome widget is a
// minimal hello-world that proves the portal renders. The Figma transpile
// is the next expansion.

import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { scopeSlug } from './scope.js';
import type { SpecInput } from '../types.js';
import type { FigmaWidgetArtifacts } from './figmaTranspile/index.js';

interface GenArgs {
  workspaceDir: string;
  scope: string;
  spec: SpecInput;
  // Optional override — if a prior deploy of this scope already exists on the
  // instance, we pin to its sys_app sys_id so the SDK sees the right app.
  knownScopeId?: string;
  // M5 — when present, the generator emits a Figma-derived widget instead of
  // the placeholder welcome widget. Produced by prepareFigmaWidget() in
  // figmaTranspile/index.ts when the project has uploaded Figma source.
  figmaWidget?: FigmaWidgetArtifacts;
  // Static-iframe shortcut — when set AND no figmaWidget is provided, the
  // homepage widget becomes a full-bleed iframe pointing at this URL (the
  // hosted preview bundle from /api/figma/preview-bundle/<projectId>). Lets
  // the deployed portal mirror the local prototype 1:1 without a real
  // Figma→widget transpile. Requires the URL to be reachable from the
  // ServiceNow instance's browser (i.e. publicly resolvable, not localhost).
  iframePreviewUrl?: string;
}

export function generateFluentProject({
  workspaceDir,
  scope,
  spec,
  knownScopeId,
  figmaWidget,
  iframePreviewUrl,
}: GenArgs): void {
  const slug = scopeSlug(scope);
  const tableName = `${scope}_record`;
  const roleName = `${scope}.user`;
  const portalSuffix = spec.portal?.urlSuffix || slug;
  const title = spec.title.trim();
  const scopeId = knownScopeId ?? stableScopeId(workspaceDir);

  writeFile(`${workspaceDir}/package.json`, packageJson(slug));
  writeFile(`${workspaceDir}/tsconfig.json`, tsconfig());
  writeFile(`${workspaceDir}/now.config.json`, nowConfig(scope, title, scopeId));
  writeFile(`${workspaceDir}/.gitignore`, '/node_modules\n/target\n');

  // Wipe stale table files so removing a table from the spec also removes
  // it from the next deploy. Without this, prior tables remain registered
  // with the SDK and double-deploy under their old sys_id.
  const tablesDir = `${workspaceDir}/src/fluent/tables`;
  if (existsSync(tablesDir)) {
    rmSync(tablesDir, { recursive: true, force: true });
  }

  if (spec.tables && spec.tables.length > 0) {
    // User-elicited data model — emit one Fluent file per table with real
    // column types. References across tables in this spec resolve to the
    // scoped, prefixed table name so SN can wire the relationship.
    for (const t of spec.tables) {
      const fullName = `${scope}_${t.name}`;
      writeFile(
        `${workspaceDir}/src/fluent/tables/${fullName}.now.ts`,
        domainTable({ scope, table: t }),
      );
    }
  } else {
    // Legacy fallback — single placeholder table extending task. Kept so
    // projects that haven't done the data-model turn still produce a
    // deployable scaffold.
    writeFile(
      `${workspaceDir}/src/fluent/tables/${tableName}.now.ts`,
      recordTable({ table: tableName, label: title, description: spec.description }),
    );
  }

  writeFile(`${workspaceDir}/src/fluent/roles/${roleName}.now.ts`, roleRecord(roleName));

  if (spec.portal?.enabled) {
    const ids = derivePortalSysIds(slug, scopeId);
    const useFigmaWidget = !!figmaWidget;
    const useIframeWidget = !useFigmaWidget && !!iframePreviewUrl;

    // Wipe stale portal files from prior builds before re-emitting. Without
    // this, a project that switched from a welcome-only build to a figma
    // build (or vice-versa) would leave both widget definitions on disk —
    // the SDK errors with `defined 2 times` since both register the same
    // deterministic sys_id. Idempotent: nothing to delete on first build.
    const portalDir = `${workspaceDir}/src/fluent/portal`;
    if (existsSync(portalDir)) {
      rmSync(portalDir, { recursive: true, force: true });
    }

    writeFile(
      `${workspaceDir}/src/fluent/portal/sp_portal.now.ts`,
      portalRecord({
        title,
        urlSuffix: portalSuffix,
        portalSysId: ids.portal,
        homepageSysId: ids.page,
      }),
    );
    writeFile(
      `${workspaceDir}/src/fluent/portal/sp_page_${slug}.now.ts`,
      portalPage({ title, slug, pageSysId: ids.page }),
    );
    writeFile(
      `${workspaceDir}/src/fluent/portal/sp_layout_${slug}.now.ts`,
      portalLayout({ slug, ids }),
    );

    if (useFigmaWidget) {
      // M5: emit a Figma-derived widget using the artifacts produced by the
      // transpile pipeline (M2 IR + M3 compiled CSS + M4 widget HTML).
      writeFile(
        `${workspaceDir}/src/fluent/portal/figma-widget.now.ts`,
        figmaWidgetRecord({ slug, title, widgetSysId: ids.widget }),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/figma-widget.html`,
        readFileSync(figmaWidget!.htmlPath, 'utf8'),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/figma-widget.scss`,
        readFileSync(figmaWidget!.cssPath, 'utf8'),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/figma-widget.server.js`,
        figmaWidgetServer({
          title,
          dataLiterals: figmaWidget!.rootDataLiterals,
        }),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/figma-widget.client.js`,
        figmaWidgetClient({ scopeSeeds: figmaWidget!.scopeSeeds }),
      );
    } else if (useIframeWidget) {
      // Static-iframe shortcut. Single full-bleed iframe widget pointing at
      // the hosted preview bundle. Same SPWidget cluster as welcome/figma so
      // the page-layout records keep working unchanged.
      writeFile(
        `${workspaceDir}/src/fluent/portal/iframe-widget.now.ts`,
        iframeWidget({ slug, title, widgetSysId: ids.widget }),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/iframe-widget.html`,
        iframeWidgetHtml(),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/iframe-widget.scss`,
        iframeWidgetScss(),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/iframe-widget.server.js`,
        iframeWidgetServer({ previewUrl: iframePreviewUrl! }),
      );
    } else {
      writeFile(
        `${workspaceDir}/src/fluent/portal/welcome-widget.now.ts`,
        welcomeWidget({ slug, title, widgetSysId: ids.widget }),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/welcome-widget.html`,
        welcomeWidgetHtml(),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/welcome-widget.scss`,
        welcomeWidgetScss(),
      );
      writeFile(
        `${workspaceDir}/src/fluent/portal/welcome-widget.server.js`,
        welcomeWidgetServer({ title, description: spec.description }),
      );
    }
  }
}

// now.config.json must keep the same scopeId across rebuilds — the SDK uses
// it as the durable identity of the scoped app. We generate once and persist.
function stableScopeId(workspaceDir: string): string {
  const path = resolve(workspaceDir, 'now.config.json');
  if (existsSync(path)) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8')) as { scopeId?: string };
      if (parsed.scopeId && /^[a-f0-9]{32}$/.test(parsed.scopeId)) return parsed.scopeId;
    } catch {
      // fall through and mint a new one
    }
  }
  return randomBytes(16).toString('hex');
}

interface PortalSysIds {
  portal: string;
  page: string;
  container: string;
  row: string;
  column: string;
  instance: string;
  widget: string;
}

// Deterministic per-record sys_id. Same scope+slug → same sys_id across
// rebuilds → SDK does idempotent updates instead of creating duplicates.
function deriveSysId(seed: string): string {
  return createHash('md5').update(seed).digest('hex');
}

function derivePortalSysIds(slug: string, scopeId: string): PortalSysIds {
  const ns = `${scopeId}::${slug}`;
  return {
    portal: deriveSysId(`${ns}::sp_portal`),
    page: deriveSysId(`${ns}::sp_page`),
    container: deriveSysId(`${ns}::sp_container`),
    row: deriveSysId(`${ns}::sp_row`),
    column: deriveSysId(`${ns}::sp_column`),
    instance: deriveSysId(`${ns}::sp_instance`),
    widget: deriveSysId(`${ns}::sp_widget_welcome`),
  };
}

function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function packageJson(slug: string): string {
  return (
    JSON.stringify(
      {
        name: `vibe-overyonder-${slug}`,
        version: '0.1.0',
        private: true,
        type: 'module',
        dependencies: {
          '@servicenow/sdk': '^4.4.0',
          '@servicenow/sdk-core': '^4.4.0',
        },
        devDependencies: {
          typescript: '^5.6.3',
        },
      },
      null,
      2,
    ) + '\n'
  );
}

function tsconfig(): string {
  return (
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          noEmit: true,
        },
        include: ['src/**/*'],
      },
      null,
      2,
    ) + '\n'
  );
}

function nowConfig(scope: string, name: string, scopeId: string): string {
  return (
    JSON.stringify(
      {
        scope,
        scopeId,
        name,
      },
      null,
      2,
    ) + '\n'
  );
}

function recordTable(opts: { table: string; label: string; description: string }): string {
  return `import { Record } from '@servicenow/sdk/core'

// Generated by Vibe OverYonder. Minimal scoped table extending task.
Record({
    $id: Now.ID['${opts.table}'],
    table: 'sys_db_object',
    data: {
        name: '${opts.table}',
        label: ${JSON.stringify(opts.label)},
        super_class: 'task',
        is_extendable: false,
    },
})
`;
}

// Domain table — uses the high-level Table() helper from @servicenow/sdk/core
// so columns are co-declared with the table itself. Mirrors the cluck-sample
// pattern (see sdk-examples/cluck-sample/src/fluent/tables/customer-table.now.ts).
//
// Mapping rules:
//   - 'string'   → StringColumn (default; maxLength 255 implied by SDK)
//   - 'integer'  → IntegerColumn
//   - 'decimal'  → DecimalColumn
//   - 'boolean'  → BooleanColumn
//   - 'date'     → DateColumn
//   - 'datetime' → DateTimeColumn
//   - 'reference'→ ReferenceColumn({ referenceTable: '<scope>_<ref>' })
//                  In-spec refs (other tables in spec.tables) get scope-prefixed.
//                  Out-of-spec refs (e.g. 'sys_user', 'task') pass through verbatim.
//   - 'choice'   → ChoiceColumn with empty `choices: {}` — values come later via
//                  a future enrichment turn. Without choices the column still
//                  deploys as a string-backed select; the user can edit options
//                  in the platform.
//   - 'longtext' → StringColumn({ maxLength: 4000 }) — the platform-safe big-text
//                  pattern used by cluckworks; LongStringColumn is unreliable
//                  across SDK versions.
interface TableInput {
  name: string;
  label: string;
  extends?: string;
  columns: { name: string; label: string; type: string; reference?: string; mandatory?: boolean }[];
}

const KNOWN_OOB_TABLES = new Set([
  'sys_user',
  'sys_user_group',
  'task',
  'incident',
  'change_request',
  'sc_req_item',
  'sc_request',
  'sc_cat_item',
  'cmdb_ci',
  'kb_knowledge',
]);

function domainTable(opts: { scope: string; table: TableInput }): string {
  const { scope, table } = opts;
  const fullName = `${scope}_${table.name}`;
  const importedColumns = new Set<string>(['Table']);
  const schemaLines: string[] = [];

  for (const col of table.columns) {
    const line = renderColumn(scope, col, importedColumns);
    if (line) schemaLines.push(`        ${col.name}: ${line},`);
  }

  // Sort imports for deterministic output across rebuilds (helps SDK caching
  // and makes diff review during PRs easier).
  const importList = Array.from(importedColumns).sort().join(', ');
  const extendsLine = table.extends ? `    extends: '${table.extends}',\n` : '';
  return `import { ${importList} } from '@servicenow/sdk/core'

// Generated by Vibe OverYonder from the user's data-model elicitation.
// Source: src/lib/assistantBehavior.ts#parseTableDefs.
export const ${fullName} = Table({
    name: '${fullName}',
    label: ${JSON.stringify(table.label)},
${extendsLine}    schema: {
${schemaLines.join('\n')}
    },
})
`;
}

function renderColumn(
  scope: string,
  col: { name: string; label: string; type: string; reference?: string; mandatory?: boolean },
  imports: Set<string>,
): string | null {
  const labelArg = `label: ${JSON.stringify(col.label)}`;
  const mandArg = col.mandatory ? `, mandatory: true` : '';

  switch (col.type) {
    case 'string':
      imports.add('StringColumn');
      return `StringColumn({ ${labelArg}${mandArg} })`;
    case 'integer':
      imports.add('IntegerColumn');
      return `IntegerColumn({ ${labelArg}${mandArg} })`;
    case 'decimal':
      imports.add('DecimalColumn');
      return `DecimalColumn({ ${labelArg}${mandArg} })`;
    case 'boolean':
      imports.add('BooleanColumn');
      return `BooleanColumn({ ${labelArg}${mandArg} })`;
    case 'date':
      imports.add('DateColumn');
      return `DateColumn({ ${labelArg}${mandArg} })`;
    case 'datetime':
      imports.add('DateTimeColumn');
      return `DateTimeColumn({ ${labelArg}${mandArg} })`;
    case 'longtext':
      imports.add('StringColumn');
      return `StringColumn({ ${labelArg}, maxLength: 4000${mandArg} })`;
    case 'choice':
      imports.add('ChoiceColumn');
      // Empty choices block — the user hasn't specified values yet. ServiceNow
      // accepts this and the column behaves as a string-select; values can be
      // added in the platform or via a future spec enrichment.
      return `ChoiceColumn({ ${labelArg}${mandArg}, choices: {} })`;
    case 'reference': {
      if (!col.reference) return null;
      imports.add('ReferenceColumn');
      // In-spec refs get the current scope's prefix; OOB tables (sys_user,
      // task, incident, etc.) and explicitly scope-prefixed names pass through.
      const isPrefixed = col.reference.startsWith('x_');
      const isOob = KNOWN_OOB_TABLES.has(col.reference);
      const refTable = isPrefixed || isOob ? col.reference : `${scope}_${col.reference}`;
      return `ReferenceColumn({ ${labelArg}${mandArg}, referenceTable: '${refTable}' })`;
    }
    default:
      // Unknown type — fall back to string so an unrecognized future type
      // doesn't break the build. Worth logging but not failing on.
      imports.add('StringColumn');
      return `StringColumn({ ${labelArg}${mandArg} })`;
  }
}

function roleRecord(roleName: string): string {
  return `import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['${roleName}'],
    table: 'sys_user_role',
    data: {
        name: '${roleName}',
        description: 'Default user role for this Vibe OverYonder app.',
        elevated_privilege: false,
    },
})
`;
}

// sp_portal: homepage is a REFERENCE column to sp_page (stores sys_id).
// Pass the page's sys_id directly, NOT Now.ID['sp_page_*'] (which won't
// resolve in a data field) and NOT the page's `id` string (which gets
// rejected by the reference validator and saved as empty — see screenshot
// from 2026-04-25 where homepage was blank).
function portalRecord(opts: {
  title: string;
  urlSuffix: string;
  portalSysId: string;
  homepageSysId: string;
}): string {
  return `import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['${opts.portalSysId}'],
    table: 'sp_portal',
    data: {
        title: ${JSON.stringify(opts.title)},
        url_suffix: '${opts.urlSuffix}',
        homepage: '${opts.homepageSysId}',
    },
})
`;
}

function portalPage(opts: { title: string; slug: string; pageSysId: string }): string {
  return `import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['${opts.pageSysId}'],
    table: 'sp_page',
    data: {
        category: 'custom',
        draft: false,
        id: '${opts.slug}_home',
        internal: false,
        omit_watcher: false,
        public: true,
        title: ${JSON.stringify(opts.title + ' — Home')},
        use_seo_script: false,
    },
})
`;
}

// 5-record page-layout cluster: sp_container → sp_row → sp_column →
// sp_instance(→ sp_widget). Without this the page exists but has no
// content, so the portal homepage URL renders blank/falls back to OOB.
function portalLayout(opts: { slug: string; ids: PortalSysIds }): string {
  return `import { Record } from '@servicenow/sdk/core'

// Page-layout cluster — wires the welcome widget into a one-column page.
// All cross-references use literal sys_id strings (not Now.ID[...]) because
// data-field references don't resolve via the alias table; see
// vibe_overyonder.md §6 Path A for the rules learned from Cluckworks.

Record({
    $id: Now.ID['${opts.ids.container}'],
    table: 'sp_container',
    data: {
        background_style: 'default',
        bootstrap_alt: false,
        name: '${opts.slug}_home - container',
        order: 1,
        sp_page: '${opts.ids.page}',
        subheader: false,
        width: 'container-fluid',
    },
})

Record({
    $id: Now.ID['${opts.ids.row}'],
    table: 'sp_row',
    data: {
        order: 1,
        sp_container: '${opts.ids.container}',
    },
})

Record({
    $id: Now.ID['${opts.ids.column}'],
    table: 'sp_column',
    data: {
        order: 1,
        size: 12,
        sp_row: '${opts.ids.row}',
    },
})

Record({
    $id: Now.ID['${opts.ids.instance}'],
    table: 'sp_instance',
    data: {
        active: true,
        order: 1,
        sp_column: '${opts.ids.column}',
        sp_widget: '${opts.ids.widget}',
    },
})
`;
}

// Minimal placeholder widget so the portal renders something instead of
// a blank page. Replaced by Figma-derived widgets in the next expansion.
function welcomeWidget(opts: { slug: string; title: string; widgetSysId: string }): string {
  return `import { SPWidget } from '@servicenow/sdk/core'

SPWidget({
    $id: Now.ID['${opts.widgetSysId}'],
    name: ${JSON.stringify(opts.title + ' — Welcome')},
    id: '${opts.slug}-welcome',
    htmlTemplate: Now.include('./welcome-widget.html'),
    customCss: Now.include('./welcome-widget.scss'),
    serverScript: Now.include('./welcome-widget.server.js'),
    hasPreview: true,
})
`;
}

function welcomeWidgetHtml(): string {
  return `<div class="vibe-welcome">
    <header class="vibe-welcome-hero">
        <span class="vibe-welcome-eyebrow">Powered by Vibe OverYonder</span>
        <h1>{{data.title}}</h1>
        <p class="vibe-welcome-sub" ng-if="data.description">{{data.description}}</p>
    </header>
    <section class="vibe-welcome-status">
        <div class="vibe-welcome-pill">
            <span class="vibe-welcome-dot"></span>
            <span>Portal deployed · {{data.scope}}</span>
        </div>
        <p class="vibe-welcome-note">
            This is the placeholder homepage that Vibe OverYonder generates for every new portal.
            Your Figma design will replace this widget once Phase 2 transpile lands.
        </p>
    </section>
</div>
`;
}

function welcomeWidgetScss(): string {
  return `.vibe-welcome {
    --vw-bg: #FAF7F0;
    --vw-fg: #1F1B16;
    --vw-muted: #6B5A47;
    --vw-accent: #4F46E5;
    --vw-card: #FFFFFF;
    --vw-border: rgba(31, 27, 22, 0.12);

    background: var(--vw-bg);
    color: var(--vw-fg);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 4rem 1.5rem;

    h1 {
        font-size: clamp(2rem, 4vw, 3rem);
        margin: 0 0 1rem;
        letter-spacing: -0.02em;
        font-weight: 600;
    }

    p { margin: 0; }

    .vibe-welcome-hero {
        max-width: 48rem;
        margin: 0 auto 3rem;
        text-align: center;
    }

    .vibe-welcome-eyebrow {
        display: inline-block;
        margin-bottom: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--vw-accent);
    }

    .vibe-welcome-sub {
        font-size: 1.125rem;
        color: var(--vw-muted);
        line-height: 1.6;
    }

    .vibe-welcome-status {
        max-width: 36rem;
        margin: 0 auto;
        background: var(--vw-card);
        border: 1px solid var(--vw-border);
        border-radius: 0.75rem;
        padding: 1.5rem;
        text-align: center;
    }

    .vibe-welcome-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.875rem;
        border-radius: 999px;
        background: rgba(79, 70, 229, 0.08);
        color: var(--vw-accent);
        font-size: 0.875rem;
        font-weight: 500;
        font-family: ui-monospace, SFMono-Regular, monospace;
        margin-bottom: 1rem;
    }

    .vibe-welcome-dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        background: #10B981;
    }

    .vibe-welcome-note {
        color: var(--vw-muted);
        font-size: 0.875rem;
        line-height: 1.55;
    }
}
`;
}

function welcomeWidgetServer(opts: { title: string; description: string }): string {
  return `(function () {
    data.title = ${JSON.stringify(opts.title)};
    data.description = ${JSON.stringify(opts.description || '')};
    try {
        data.scope = (gs.getCurrentScopeName && gs.getCurrentScopeName()) || '';
    } catch (e) {
        data.scope = '';
    }
})()
`;
}

// M5 — Figma-derived widget. The .html and .scss files are written verbatim
// from the M3/M4 outputs; this generator produces the SPWidget Fluent record
// that wires them up plus the server.js that seeds any data the AngularJS
// template references (e.g. `ng-repeat="hen in hens"` needs `data.hens`).
function figmaWidgetRecord(opts: {
  slug: string;
  title: string;
  widgetSysId: string;
}): string {
  return `import { SPWidget } from '@servicenow/sdk/core'

// Generated by Vibe OverYonder M5 — Figma-derived widget. The HTML is the
// AngularJS template emitted by jsxToTemplate.ts; the SCSS is the Tailwind
// + user :root tokens compiled by tailwindCompile.ts and scoped to
// .vibe-figma-root so the Service Portal chrome isn't reset. The client
// script seeds the controller scope with every useState initial + literal
// binding so {{ }} expressions in the template resolve at first render
// (Service Portal isolates the widget scope, so an in-template ng-init
// can't reach the same scope the templates evaluate against).
SPWidget({
    $id: Now.ID['${opts.widgetSysId}'],
    name: ${JSON.stringify(opts.title + ' — Figma')},
    id: '${opts.slug}-figma',
    htmlTemplate: Now.include('./figma-widget.html'),
    customCss: Now.include('./figma-widget.scss'),
    serverScript: Now.include('./figma-widget.server.js'),
    clientScript: Now.include('./figma-widget.client.js'),
    hasPreview: true,
})
`;
}

// Server.js for the Figma widget. Surfaces top-level data literals from the
// user's React source as `data.<name>` so any `ng-repeat="x in <name>"` in
// the emitted HTML resolves cleanly.
//
// `dataLiterals` come from M2 — top-level array/object const declarations in
// the root component's module (e.g. `const hensData = [{...}]`). We embed
// the raw source snippets directly; they're plain JS literals so they
// evaluate fine inside the IIFE. If a snippet references undefined symbols
// (e.g. a TypeScript type) we still emit it; the runtime will surface a
// clear error and the user can re-upload after cleaning up.
function figmaWidgetServer(opts: {
  title: string;
  dataLiterals: { name: string; sourceSnippet: string }[];
}): string {
  const literalLines = opts.dataLiterals
    .map((d) => `    data.${d.name} = ${d.sourceSnippet};`)
    .join('\n');
  return `(function () {
    data.title = ${JSON.stringify(opts.title)};
${literalLines}
    try {
        data.scope = (gs.getCurrentScopeName && gs.getCurrentScopeName()) || '';
    } catch (e) {
        data.scope = '';
    }
})()
`;
}

// Service Portal widget client controller. Seeds the controller scope with
// every useState initial + literal binding so the template's bare-name
// {{ x }} interpolations resolve at first render. Service Portal compiles
// each widget with its own controller scope; an ng-init in the template
// lands on the wrong scope, so we set both `c.<name>` (the controller
// reference exposed in the template) AND `$scope.<name>` (caught by
// AngularJS's bare-identifier resolution). Same controller signature
// Service Portal expects: function($scope, …) with `c = this`.
function figmaWidgetClient(opts: {
  scopeSeeds: { name: string; expr: string }[];
}): string {
  // Each seed becomes two assignments — `c.x = expr;` for templates using
  // `{{c.x}}` and `$scope.x = expr;` for templates using `{{x}}`. The
  // figma transpile emits bare names, so the $scope assignment is the
  // load-bearing one; the c.* one is belt-and-suspenders for any user
  // who hand-edits the widget HTML.
  const lines = opts.scopeSeeds
    .map((s) => `    try { c.${s.name} = ${s.expr}; $scope.${s.name} = c.${s.name}; } catch (e) { c.${s.name} = null; $scope.${s.name} = null; }`)
    .join('\n');
  return `function ($scope) {
    var c = this;
${lines}
    // Server-supplied data.* is already on $scope under the data namespace,
    // but expose every server data key on $scope as a bare name too so
    // templates that reference top-level literals via {{ literalName }}
    // resolve regardless of whether the seed above caught them. Last-write
    // wins — server data overrides the static initials when both are set.
    if (c.data && typeof c.data === 'object') {
        for (var k in c.data) {
            if (Object.prototype.hasOwnProperty.call(c.data, k)) {
                $scope[k] = c.data[k];
            }
        }
    }
}
`;
}

// Static-iframe shortcut. Pre-real-Figma-transpile, this gives the deployed
// portal the same visual as the local prototype by embedding the hosted
// preview bundle in a full-bleed iframe. Caveats:
//   - The preview URL must be reachable from the user's browser (and ideally
//     allow being framed — set X-Frame-Options ALLOWALL or omit, and a
//     permissive CSP frame-ancestors). Localhost won't work from a hosted
//     ServiceNow instance; tunnel via cloudflared/ngrok or host on a real
//     domain.
//   - No SSO, no Now record binding, no record links from the iframe page —
//     it's a visual stand-in, not the real portal. Use until M5 transpile
//     covers the design.
function iframeWidget(opts: { slug: string; title: string; widgetSysId: string }): string {
  return `import { SPWidget } from '@servicenow/sdk/core'

SPWidget({
    $id: Now.ID['${opts.widgetSysId}'],
    name: ${JSON.stringify(opts.title + ' — Preview Iframe')},
    id: '${opts.slug}-iframe',
    htmlTemplate: Now.include('./iframe-widget.html'),
    customCss: Now.include('./iframe-widget.scss'),
    serverScript: Now.include('./iframe-widget.server.js'),
    hasPreview: true,
})
`;
}

function iframeWidgetHtml(): string {
  return `<div class="vibe-iframe-shell">
    <iframe
        ng-src="{{data.previewUrl}}"
        class="vibe-iframe-frame"
        title="Vibe OverYonder preview"
        allow="clipboard-read; clipboard-write"
        loading="eager"
        referrerpolicy="no-referrer"
    ></iframe>
</div>
`;
}

function iframeWidgetScss(): string {
  return `.vibe-iframe-shell {
    position: fixed;
    inset: 0;
    background: #FAF7F0;
    z-index: 1;
}

.vibe-iframe-frame {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
}
`;
}

function iframeWidgetServer(opts: { previewUrl: string }): string {
  // ng-src binds via data.previewUrl rather than baking the URL into the
  // template so re-deploys can swap the URL without rewriting the .html.
  return `(function () {
    data.previewUrl = ${JSON.stringify(opts.previewUrl)};
})()
`;
}
