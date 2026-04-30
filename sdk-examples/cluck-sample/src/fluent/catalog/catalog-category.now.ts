import { Record } from '@servicenow/sdk/core'

/**
 * Dedicated "Cluckworks Farm Stand" category inside the OOB Service Catalog.
 */

export const cluckServiceCatalog = 'e0d08b13c3330100c8b837659bba8fb4'

export const cluckCatalogCategory = Record({
    $id: Now.ID['sc_category_cluck'],
    table: 'sc_category',
    data: {
        title: 'Cluckworks Farm Stand',
        description:
            'Fresh pastured eggs, CSA subscriptions, chick pre-orders, and farm experiences.',
        sc_catalog: cluckServiceCatalog,
        active: true,
        order: 100,
        icon: 'icon-basket',
    },
})
