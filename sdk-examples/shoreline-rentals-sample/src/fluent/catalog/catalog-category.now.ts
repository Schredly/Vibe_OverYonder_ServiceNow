import { Record } from '@servicenow/sdk/core'

/**
 * Dedicated "Shoreline Beach Rentals" category inside the out-of-box
 * Service Catalog. All of our catalog items attach to this category so the
 * portal gets a clean "Beach Rentals" tile.
 */

// Built-in "Service Catalog" (default in every ServiceNow instance)
export const shorelineServiceCatalog = 'e0d08b13c3330100c8b837659bba8fb4'

export const shorelineCatalogCategory = Record({
    $id: Now.ID['sc_category_shoreline'],
    table: 'sc_category',
    data: {
        title: 'Shoreline Beach Rentals',
        description:
            'Rent beach gear, book bundles, or schedule a lesson — Shoreline has you covered.',
        sc_catalog: shorelineServiceCatalog,
        active: true,
        order: 100,
        icon: 'icon-umbrella',
    },
})
