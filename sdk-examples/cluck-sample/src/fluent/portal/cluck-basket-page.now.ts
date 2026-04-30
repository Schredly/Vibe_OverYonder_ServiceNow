import { Record } from '@servicenow/sdk/core'

/**
 * Cluckworks "Today's Basket" page layout.
 * Wires todays-basket-widget into a one-column page reachable at
 * /cluck?id=cluck_basket. The portal homepage stays pointed at cluck_flock;
 * this is a secondary page accessed via the header nav.
 *
 * Cross-record reference rules (see vibe_overyonder.md §6 Path A):
 * - Now.ref('<table>', '<alias>') for sp_container/row/column/widget refs.
 * - sp_page references need the deterministic sys_id hard-coded from
 *   src/fluent/generated/keys.ts after a build (sp_page is indexed by
 *   natural key, not by alias, so neither Now.ID nor Now.ref produces
 *   the sys_id needed for sp_container.sp_page).
 */

// Deterministic sys_id for sp_page_cluck_basket — read from keys.ts after the
// first successful build. Stable as long as the alias name doesn't change.
const PAGE_SYS_ID = '3650aeb1a13445cb91110cb333ce0ac6'

export const cluckBasketPage = Record({
    $id: Now.ID['sp_page_cluck_basket'],
    table: 'sp_page',
    data: {
        category: 'custom',
        draft: false,
        id: 'cluck_basket',
        internal: false,
        omit_watcher: false,
        public: true,
        title: 'Today\'s Basket',
        use_seo_script: false,
    },
})

export const cluckBasketContainer = Record({
    $id: Now.ID['sp_container_cluck_basket'],
    table: 'sp_container',
    data: {
        background_style: 'default',
        bootstrap_alt: false,
        name: 'cluck_basket - container',
        order: 1,
        sp_page: PAGE_SYS_ID,
        subheader: false,
        width: 'container-fluid',
    },
})

export const cluckBasketRow = Record({
    $id: Now.ID['sp_row_cluck_basket'],
    table: 'sp_row',
    data: {
        order: 1,
        sp_container: Now.ref('sp_container', 'sp_container_cluck_basket'),
    },
})

export const cluckBasketColumn = Record({
    $id: Now.ID['sp_column_cluck_basket'],
    table: 'sp_column',
    data: {
        order: 1,
        size: 12,
        sp_row: Now.ref('sp_row', 'sp_row_cluck_basket'),
    },
})

export const cluckBasketInstance = Record({
    $id: Now.ID['sp_instance_cluck_basket'],
    table: 'sp_instance',
    data: {
        active: true,
        order: 1,
        sp_column: Now.ref('sp_column', 'sp_column_cluck_basket'),
        sp_widget: Now.ref('sp_widget', 'widget_todays_basket'),
    },
})
