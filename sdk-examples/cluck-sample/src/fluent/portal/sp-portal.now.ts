import { Record } from '@servicenow/sdk/core'

/**
 * Dedicated "Cluckworks" portal at /cluck. A standalone portal gives us
 * our own branding separate from /sp.
 */
export const cluckPortal = Record({
    $id: Now.ID['sp_portal_cluck'],
    table: 'sp_portal',
    data: {
        title: 'Cluckworks',
        url_suffix: 'cluck',
        // sp_portal.homepage is a REFERENCE column to sp_page (stores the
        // page's sys_id). The "string-looking" display values seen on the
        // OOB portal admin form (e.g. 'sw_sc_category') are actually the
        // referenced page's `id` field shown as the display value.
        // Pass the page's deterministic sys_id directly — Now.ID and
        // Now.ref both fail to resolve sp_page records (see cluck-flock-page.now.ts).
        homepage: '74a1ea2fc0b94591aaeb7a1f47cb9a86',
        kb_knowledge_base: '',
    },
})
