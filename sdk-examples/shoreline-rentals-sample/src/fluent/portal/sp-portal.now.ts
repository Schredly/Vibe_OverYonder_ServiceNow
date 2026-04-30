import { Record } from '@servicenow/sdk/core'

/**
 * Dedicated "Shoreline" portal — reached at /sp_shoreline. A standalone portal
 * gives us our own branding without affecting the default /sp portal.
 */
export const shorelinePortal = Record({
    $id: Now.ID['sp_portal_shoreline'],
    table: 'sp_portal',
    data: {
        title: 'Shoreline Beach Rentals',
        url_suffix: 'shoreline',
        homepage: 'index', // default home page stub; customize after deploy
        kb_knowledge_base: '',
    },
})
